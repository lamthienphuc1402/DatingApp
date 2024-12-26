import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Message } from './schema/message.schema';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('send')
  @ApiOperation({ summary: 'Gửi tin nhắn' })
  @ApiResponse({ status: 201, description: 'Tin nhắn đã được gửi thành công.' })
  @ApiResponse({ status: 400, description: 'Yêu cầu không hợp lệ.' })
  async sendMessage(@Body() sendMessageDto: SendMessageDto) {
    return this.chatService.saveMessage(sendMessageDto);
  }

  @Get('messages')
  @ApiOperation({ summary: 'Lấy tin nhắn giữa hai người dùng' })
  @ApiResponse({ status: 200, description: 'Danh sách tin nhắn giữa hai người dùng.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy tin nhắn.' })
  async getMessagesBetweenUsers(
    @Query('userId1') userId1: string,
    @Query('userId2') userId2: string,
  ): Promise<Message[]> {
    return this.chatService.getMessagesBetweenUsers(userId1, userId2);
  }

  @Post('messages/:messageId/reactions')
  async addReaction(
    @Param('messageId') messageId: string,
    @Body() body: { userId: string; emoji: string }
  ) {
    return this.chatService.addReaction(messageId, body.userId, body.emoji);
  }
}