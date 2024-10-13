import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { Message, MessageSchema } from './schema/message.schema'; // Nhập Message và MessageSchema
import { UserModule } from '../user/user.module'; // Nhập UserModule
import { ChatController } from './chat.controller'; // Nhập ChatController

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]), // Đăng ký schema
    UserModule, // Thêm UserModule vào imports
  ],
  providers: [ChatGateway, ChatService],
  controllers: [ChatController], // Thêm ChatController vào controllers
})
export class ChatModule {}