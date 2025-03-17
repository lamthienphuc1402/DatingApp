import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { UserService } from '../user/user.service';
import { forwardRef, Inject } from '@nestjs/common';

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private userSocketMap: Map<string, string> = new Map();

  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
  ) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.userSocketMap.set(userId, client.id);
      client.join(userId);
      this.userService.setUserOnline(userId, true);
      this.server.emit('userStatus', { userId, status: 'online' });
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.userSocketMap.delete(userId);
      this.userService.setUserOnline(userId, false);
      this.server.emit('userStatus', { userId, status: 'offline' });
    }
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
  async handleMessage(client: Socket, payload: SendMessageDto) {
    try {
      const message = await this.chatService.saveMessage(payload);
      
      // Gửi tin nhắn cho người nhận
      const receiverSocketId = this.userSocketMap.get(payload.receiverId);
      if (receiverSocketId) {
        this.server.to(receiverSocketId).emit('message', message);
      }
      
      // Gửi tin nhắn về cho người gửi để xác nhận
      client.emit('message', message);
      
      // Emit để cập nhật danh sách matched users
      this.server.to(payload.senderId).to(payload.receiverId).emit('updateMatchedUsers');
    } catch (error) {
      client.emit('error', { 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  @SubscribeMessage('getMessages')
  async handleGetMessages(
    client: Socket,
    payload: { userId1: string; userId2: string },
  ) {
    try {
      const messages = await this.chatService.getMessagesBetweenUsers(
        payload.userId1,
        payload.userId2,
      );
      client.emit('messages', messages);
    } catch (error) {
      client.emit('error', { 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  @SubscribeMessage('addReaction')
  async handleReaction(
    client: Socket,
    payload: { messageId: string; userId: string; emoji: string },
  ) {
    try {
      const updatedMessage = await this.chatService.addReaction(
        payload.messageId,
        payload.userId,
        payload.emoji,
      );
      
      // Gửi cập nhật reaction cho tất cả người dùng trong cuộc trò chuyện
      const { senderId, receiverId } = updatedMessage;
      this.server.to(senderId).to(receiverId).emit('messageUpdated', updatedMessage);
    } catch (error) {
      client.emit('error', { 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  @SubscribeMessage('markRead')
  async handleMarkRead(
    client: Socket,
    payload: { userId: string; targetUserId: string },
  ) {
    try {
      await this.chatService.markMessagesAsRead(payload.userId, payload.targetUserId);
      
      // Thông báo cho người gửi rằng tin nhắn đã được đọc
      const senderSocketId = this.userSocketMap.get(payload.targetUserId);
      if (senderSocketId) {
        this.server.to(senderSocketId).emit('messagesRead', {
          readBy: payload.userId,
          messages: await this.chatService.getMessagesBetweenUsers(
            payload.userId,
            payload.targetUserId,
          ),
        });
      }
    } catch (error) {
      client.emit('error', { 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  sendMessageToUser(userId: string, event: string, data: any) {
    const socketId = this.userSocketMap.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
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
}
