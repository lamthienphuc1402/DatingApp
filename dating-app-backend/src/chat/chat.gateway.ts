import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { UserService } from '../user/user.service'; // Nhập UserService

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    constructor(
        private readonly chatService: ChatService,
        private readonly userService: UserService, // Thêm UserService vào constructor
    ) {}

    handleConnection(client: any) {
        const userId = this.getUserIdFromClient(client);
        this.userService.setUserOnline(userId, true); // Cập nhật trạng thái online
        this.server.emit('userStatus', { userId, status: 'online' }); // Thông báo cho tất cả client
    }

    handleDisconnect(client: any) {
        const userId = this.getUserIdFromClient(client);
        this.userService.setUserOnline(userId, false); // Cập nhật trạng thái offline
        this.server.emit('userStatus', { userId, status: 'offline' }); // Thông báo cho tất cả client
    }

    @SubscribeMessage('sendMessage')
    async handleMessage(client: any, payload: SendMessageDto) {
        try {
            const message = await this.chatService.saveMessage(payload);
            this.server.to(payload.receiverId).emit('message', message);
        } catch (error) {
            let message = 'Unknown error'; // Giá trị mặc định cho thông báo lỗi
            if (error instanceof Error) {
                message = error.message; // Lấy thông báo lỗi nếu error là một instance của Error
            }
            client.emit('error', { message }); // Gửi thông báo lỗi cho client
        }
    }

    @SubscribeMessage('getMessages')
    async handleGetMessages(client: any, payload: { userId1: string; userId2: string }) {
        try {
            const messages = await this.chatService.getMessagesBetweenUsers(payload.userId1, payload.userId2);
            client.emit('messages', messages); // Gửi lại danh sách tin nhắn cho client
        } catch (error) {
            let message = 'Unknown error'; // Giá trị mặc định cho thông báo lỗi
            if (error instanceof Error) {
                message = error.message; // Lấy thông báo lỗi nếu error là một instance của Error
            }
            client.emit('error', { message }); // Gửi thông báo lỗi cho client
        }
    }

    private getUserIdFromClient(client: any): string {
        // Giả sử bạn lưu userId trong client handshake hoặc token
        return client.handshake.query.userId; // Lấy userId từ query params
    }
}