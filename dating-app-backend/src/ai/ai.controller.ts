import { Controller, Get, Param, Query } from '@nestjs/common';
import { AIService } from './ai.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('ai')
@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Get('compatibility/:userId1/:userId2')
  @ApiOperation({ summary: 'Tính điểm tương thích giữa hai người dùng' })
  @ApiResponse({ status: 200, description: 'Trả về điểm tương thích (0-1)' })
  async getCompatibility(
    @Param('userId1') userId1: string,
    @Param('userId2') userId2: string,
  ): Promise<number> {
    return this.aiService.calculateUserCompatibility(userId1, userId2);
  }

  @Get('matches/:userId')
  @ApiOperation({ summary: 'Lấy danh sách người dùng phù hợp nhất dựa trên AI' })
  @ApiResponse({ status: 200, description: 'Danh sách người dùng được đề xuất' })
  async getTopMatches(
    @Param('userId') userId: string,
    @Query('limit') limit: number = 10,
  ) {
    return this.aiService.getTopMatches(userId, limit);
  }
} 