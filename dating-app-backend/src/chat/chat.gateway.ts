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
import { UserService } from '../user/user.service';
import { forwardRef, Inject } from '@nestjs/common';

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
  ) {}

  handleConnection(client: any) {
    const userId = this.getUserIdFromClient(client);
    this.userService.setUserOnline(userId, true);
    this.server.emit('userStatus', { userId, status: 'online' });
  }

  handleDisconnect(client: any) {
    const userId = this.getUserIdFromClient(client);
    this.userService.setUserOnline(userId, false);
    this.server.emit('userStatus', { userId, status: 'offline' });
  }

  async emitNewMessage(senderId: string, receiverId: string, message: any) {
    this.server.to(receiverId).emit('newMessage', {
      senderId,
      message
    });
    
    // Emit để cập nhật danh sách matched users
    this.server.to(senderId).to(receiverId).emit('updateMatchedUsers');
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(client: any, payload: SendMessageDto) {
    try {
      const message = await this.chatService.saveMessage(payload);
      this.server.to(payload.receiverId).emit('message', message);
    } catch (error) {
      let message = 'Unknown error';
      if (error instanceof Error) {
        message = error.message;
      }
      client.emit('error', { message });
    }
  }

  @SubscribeMessage('sendLike')
  async handleMatch(
    client: any,
    payload: {
      currentUserId: string;
      targetUserId: string;
      approveStatus: string;
    },
  ) {
    try {
      console.log('called socket');
      console.log('check status: ' + payload.approveStatus);
      const targetUser = await this.userService.findById(payload.targetUserId);
      const currentUser = await this.userService.findById(
        payload.currentUserId,
      );

      if (payload.approveStatus === 'pending') {
        await this.userService.likeUser(
          payload.currentUserId,
          payload.targetUserId,
        );
        if (!targetUser.isOnline) {
          await this.userService.sendNotification(
            targetUser._id.toString(),
            `Bạn có yêu cầu match từ user ${currentUser.name}`,
            'REQUEST_MATCH',
          );
          return;
        }
        const result = {
          fromUserId: payload.currentUserId,
          targetUserId: payload.targetUserId,
          status: payload.approveStatus,
        };
        console.log(JSON.stringify(result));
        console.log('status: ' + payload.approveStatus);
        this.server.emit('matchApprove', JSON.stringify(result));
        return;
      }

      if (payload.approveStatus === 'success') {
        Promise.all([
          await this.userService.setMatch(
            payload.currentUserId,
            payload.targetUserId,
          ),
          await this.userService.setMatch(
            payload.targetUserId,
            payload.currentUserId,
          ),
        ]);
        const matchMessage = {
          fromUserId: payload.currentUserId,
          targetUserId: payload.targetUserId,
          msg: '2 bạn đã match than công',
        };
        this.server.emit('matchStatus', JSON.stringify(matchMessage));
        this.server.off('sendLike', () => {});
        this.server.off('matchApprove', () => {});
        this.server.off('matchStatus', () => {});
        return;
      }

      this.server.off('sendLike', () => {});
      this.server.off('matchApprove', () => {});
      this.server.off('matchStatus', () => {});
      return;
    } catch (error) {}
  }

  @SubscribeMessage('getMessages')
  async handleGetMessages(
    client: any,
    payload: { userId1: string; userId2: string },
  ) {
    try {
      const messages = await this.chatService.getMessagesBetweenUsers(
        payload.userId1,
        payload.userId2,
      );
      client.emit('messages', messages);
    } catch (error) {
      let message = 'Unknown error';
      if (error instanceof Error) {
        message = error.message;
      }
      client.emit('error', { message });
    }
  }

  private getUserIdFromClient(client: any): string {
    return client.handshake.query.userId;
  }
}
