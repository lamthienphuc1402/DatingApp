import { Controller, Get, Param, Query, Post, Body } from '@nestjs/common';
import { AIService } from './ai.service';
import { MLService } from './services/ml.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('ai')
@Controller('ai')
export class AIController {
  constructor(
    private readonly aiService: AIService,
    private readonly mlService: MLService
  ) {}

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

  @Post('match-history')
  async updateMatchHistory(
    @Body() data: {
      userId: string;
      targetUserId: string;
      wasSuccessfulMatch: boolean;
      interactionMetrics?: {
        chatDuration: number;
        messageCount: number;
        averageResponseTime: number;
        lastInteraction: Date;
      };
    }
  ) {
    return this.mlService.updateMatchHistory(
      data.userId,
      data.targetUserId,
      data.wasSuccessfulMatch,
      data.interactionMetrics
    );
  }

  @Get('predict-match/:userId/:targetUserId')
  async predictMatch(
    @Param('userId') userId: string,
    @Param('targetUserId') targetUserId: string
  ) {
    return this.mlService.predictMatch(userId, targetUserId);
  }

  @Post('train')
  async trainModel() {
    return this.mlService.trainModel();
  }

  @Get('recommendations/:userId')
  async getRecommendations(
    @Param('userId') userId: string,
    @Query('limit') limit: number = 20,
    @Query('useAI') useAI: string = 'true',
    @Query('page') page: number = 1
  ) {
    // Convert string 'true'/'false' to boolean
    const useAIBool = useAI.toLowerCase() === 'true';
    return this.aiService.getTopMatches(userId, limit, useAIBool);
  }

  @Get('matching-insights/:userId/:matchId')
  async getMatchingInsights(
    @Param('userId') userId: string,
    @Param('matchId') matchId: string
  ) {
    return this.aiService.getMatchingInsights(userId, matchId);
  }

  @Get('match-distribution')
  @ApiOperation({ summary: 'Lấy phân phối điểm match' })
  @ApiResponse({ status: 200, description: 'Phân phối điểm match' })
  async getMatchDistribution() {
    return this.mlService.getMatchDistribution();
  }

  @Get('model-stats')
  @ApiOperation({ summary: 'Lấy thống kê về AI model' })
  @ApiResponse({ status: 200, description: 'Thống kê về AI model' })
  async getModelStats() {
    return this.mlService.getModelStats();
  }

  @Post('load-samples')
  @ApiOperation({ summary: 'Tải dữ liệu mẫu cho việc training model' })
  @ApiResponse({ status: 200, description: 'Dữ liệu mẫu đã được tải thành công' })
  async loadSampleData() {
    return this.mlService.loadSampleData();
  }
} 