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
        return message.save(); // Lưu tin nhắn vào cơ sở dữ liệu
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
}