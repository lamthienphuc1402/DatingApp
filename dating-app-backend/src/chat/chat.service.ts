import { HttpException, HttpStatus, Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from './schema/message.schema';
import { SendMessageDto } from './dto/send-message.dto';
import { UserService } from '../user/user.service';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class ChatService {
    constructor(
        @InjectModel(Message.name) private messageModel: Model<Message>,
        @Inject(forwardRef(() => UserService))
        private readonly userService: UserService,
        @Inject(forwardRef(() => ChatGateway))
        private readonly chatGateway: ChatGateway,
    ) {}

    async saveMessage(payload: SendMessageDto): Promise<Message> {
        const message = new this.messageModel({
            senderId: payload.senderId,
            receiverId: payload.receiverId,
            content: payload.content,
            isRead: false,
            createdAt: new Date()
        });
        
        const savedMessage = await message.save();
        
        // Emit sự kiện qua WebSocket
        await this.chatGateway.emitNewMessage(
            payload.senderId,
            payload.receiverId,
            savedMessage
        );
        
        return savedMessage;
    }

    async checkIfMatched(userId1: string, userId2: string): Promise<boolean> {
        const user1 = await this.userService.findById(userId1);
        const user2 = await this.userService.findById(userId2);

        if (!user1 || !user2) {
            throw new HttpException('One or both users not found', HttpStatus.NOT_FOUND);
        }

        // Kiểm tra xem user1 có trong danh sách matchedUsers của user2 và ngược lại
        return user1.matchedUsers.includes(user2._id) && user2.matchedUsers.includes(user1._id);
    }

    async getMessagesBetweenUsers(userId1: string, userId2: string): Promise<Message[]> {
        // Kiểm tra xem 2 user có match nhau không
        const isMatched = await this.checkIfMatched(userId1, userId2);
        if (!isMatched) {
            throw new HttpException('Users are not matched', HttpStatus.FORBIDDEN);
        }

        const messages = await this.messageModel.find({
            $or: [
                { senderId: userId1, receiverId: userId2 },
                { senderId: userId2, receiverId: userId1 }
            ]
        })
        .sort({ createdAt: -1 }) // Sắp xếp theo thời gian giảm dần
        .limit(50) // Giới hạn số lượng tin nhắn
        .exec();

        // Đánh dấu tin nhắn là đã đọc khi mở chat
        await this.messageModel.updateMany(
            {
                senderId: userId2,
                receiverId: userId1,
                isRead: false
            },
            { $set: { isRead: true } }
        );

        return messages.reverse(); // Đảo ngược lại để hiển thị đúng thứ tự
    }

    async addReaction(messageId: string, userId: string, emoji: string): Promise<Message> {
        const message = await this.messageModel.findById(messageId);
        if (!message) {
            throw new HttpException('Message not found', HttpStatus.NOT_FOUND);
        }

        // Lấy reactions hiện tại hoặc tạo mới nếu chưa có
        const reactions = message.reactions || new Map();
        
        // Lấy danh sách người dùng đã react với emoji này
        const usersReacted = reactions.get(emoji) || [];
        
        // Nếu người dùng chưa react với emoji này
        if (!usersReacted.includes(userId)) {
            // Thêm userId vào danh sách
            reactions.set(emoji, [...usersReacted, userId]);
        } else {
            // Nếu đã react rồi thì xóa reaction
            reactions.set(emoji, usersReacted.filter(id => id !== userId));
            // Nếu không còn ai react với emoji này thì xóa emoji
            if (reactions.get(emoji).length === 0) {
                reactions.delete(emoji);
            }
        }

        message.reactions = reactions;
        return message.save();
    }

    async getLastMessageBetweenUsers(userId1: string, userId2: string): Promise<Message | null> {
        const message = await this.messageModel.findOne({
            $or: [
                { senderId: userId1, receiverId: userId2 },
                { senderId: userId2, receiverId: userId1 }
            ]
        })
        .sort({ createdAt: -1 })
        .select('content senderId receiverId createdAt isRead')
        .exec();

        if (message) {
            // Cập nhật trạng thái đã đọc nếu người nhận xem tin nhắn
            if (message.receiverId.toString() === userId1 && !message.isRead) {
                await this.messageModel.findByIdAndUpdate(message._id, { isRead: false });
                message.isRead = false;
            }
        }

        return message;
    }

    async markMessagesAsRead(userId: string, targetUserId: string): Promise<void> {
        console.log('Service marking messages as read:', { userId, targetUserId }); // Thêm log
        
        // Đánh dấu tin nhắn là đã đọc
        const result = await this.messageModel.updateMany(
            {
                senderId: targetUserId,
                receiverId: userId,
                isRead: false
            },
            { $set: { isRead: true } }
        );
        
        console.log('Update result:', result); // Thêm log để xem kết quả cập nhật
    }
}