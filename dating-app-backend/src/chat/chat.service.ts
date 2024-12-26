import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserService } from '../user/user.service';
import { SendMessageDto } from './dto/send-message.dto';
import { Message, MessageDocument } from './schema/message.schema'; // Nhập Message và MessageDocument

@Injectable()
export class ChatService {
    constructor(
        @InjectModel(Message.name) private messageModel: Model<MessageDocument>, // Inject model
        private readonly userService: UserService,
    ) {}

    async saveMessage(payload: SendMessageDto): Promise<Message> {
        // Kiểm tra xem hai người dùng đã match chưa
        const isMatched = await this.checkIfMatched(payload.senderId, payload.receiverId);
        if (!isMatched) {
            throw new HttpException('Users have not matched yet', HttpStatus.FORBIDDEN);
        }

        const message = new this.messageModel({
            senderId: payload.senderId,
            receiverId: payload.receiverId,
            content: payload.content,
        });
        return message.save(); // L��u tin nhắn vào cơ sở dữ liệu
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
        return this.messageModel.find({
            $or: [
                { senderId: userId1, receiverId: userId2 },
                { senderId: userId2, receiverId: userId1 },
            ],
        }).exec(); // Lấy tin nhắn giữa hai người dùng
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
}