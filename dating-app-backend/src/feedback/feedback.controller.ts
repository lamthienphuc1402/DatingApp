import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { AdminAuthGuard } from '../admin/guards/admin-auth.guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('feedback')
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @ApiOperation({ summary: 'Gửi phản hồi' })
  async create(@Body() createFeedbackDto: CreateFeedbackDto, @Body('userId') userId: string) {
    return this.feedbackService.create(userId, createFeedbackDto);
  }

  @Get('my-feedback/:userId')
  @ApiOperation({ summary: 'Lấy danh sách phản hồi của tôi' })
  async getMyFeedback(@Param('userId') userId: string) {
    return this.feedbackService.findByUserId(userId);
  }

  @Get()
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: 'Admin: Lấy tất cả phản hồi' })
  async findAll() {
    return this.feedbackService.findAll();
  }

  @Post(':id/respond')
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: 'Admin: Trả lời phản hồi' })
  async respond(@Param('id') id: string, @Body('response') response: string) {
    return this.feedbackService.respondToFeedback(id, response);
  }
}
