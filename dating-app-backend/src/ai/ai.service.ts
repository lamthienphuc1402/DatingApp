import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../user/schema/user.schema';
import { Message } from '../chat/schema/message.schema';
import { UserMatchingService } from './services/user-matching.service';
import { TextAnalysisService } from './services/text-analysis.service';
import { RecommendationService } from './services/recommendation.service';
import { tf, initTensorFlow, cleanupTensorFlow } from './config/tensorflow.config';
import { MLService } from './services/ml.service';

@Injectable()
export class AIService implements OnModuleInit, OnModuleDestroy {
  private model: tf.LayersModel;

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    private readonly userMatchingService: UserMatchingService,
    private readonly textAnalysisService: TextAnalysisService,
    private readonly recommendationService: RecommendationService,
    private readonly mlService: MLService,
  ) {}

  async onModuleInit() {
    await initTensorFlow();
    await this.initModel();
  }

  async onModuleDestroy() {
    cleanupTensorFlow();
  }

  private async initModel() {
    // Khởi tạo mô hình neural network đơn giản
    this.model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [10], units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    });

    this.model.compile({
      optimizer: 'adam',
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });
  }

  async calculateUserCompatibility(userId1: string, userId2: string): Promise<number> {
    const embedding1 = await this.userMatchingService.generateUserEmbedding(userId1, {});
    const embedding2 = await this.userMatchingService.generateUserEmbedding(userId2, {});
    
    return this.userMatchingService.calculateCompatibility(
      embedding1.embedding,
      embedding2.embedding
    );
  }

  async getMatchRecommendations(userId: string, preferences: any) {
    return this.recommendationService.generateRecommendations(userId, preferences);
  }

  async analyzeChatInteraction(userId: string, chatId: string) {
    return this.textAnalysisService.analyzeChatContent(userId, chatId);
  }

  async getMatchingInsights(userId: string, matchId: string) {
    // Lấy thông tin chi tiết về match
    const [compatibility, chatAnalysis] = await Promise.all([
      this.calculateUserCompatibility(userId, matchId),
      this.analyzeChatInteraction(userId, matchId)
    ]);

    return {
      compatibility: {
        score: Math.round(compatibility * 100),
        level: this.getCompatibilityLevel(compatibility),
      },
      chatAnalysis: {
        sentiment: chatAnalysis.sentiment,
        keywords: chatAnalysis.keywords,
        interaction: {
          frequency: chatAnalysis.messageStats.messageFrequency,
          responseTime: chatAnalysis.messageStats.responseTime,
          engagement: this.calculateEngagementScore(chatAnalysis.messageStats)
        }
      }
    };
  }

  private getCompatibilityLevel(score: number): string {
    if (score >= 0.8) return 'Rất cao';
    if (score >= 0.6) return 'Cao';
    if (score >= 0.4) return 'Trung bình';
    if (score >= 0.2) return 'Thấp';
    return 'Rất thấp';
  }

  private calculateEngagementScore(stats: any): number {
    // Tính điểm tương tác dựa trên các chỉ số thống kê
    const frequencyScore = Math.min(stats.messageFrequency / 10, 1); // Chuẩn hóa tần suất
    const responsiveScore = Math.max(0, 1 - stats.responseTime / (60 * 60 * 1000)); // Điểm cho thời gian phản hồi
    const lengthScore = Math.min(stats.averageLength / 100, 1); // Điểm cho độ dài tin nhắn

    return (frequencyScore * 0.4 + responsiveScore * 0.4 + lengthScore * 0.2) * 100;
  }

  async getTopMatches(userId: string, limit: number = 20, useAI: boolean = true): Promise<any[]> {
    try {
      console.log(`Getting top matches for user ${userId} with useAI=${useAI}`);
      
      const currentUser = await this.userModel.findById(userId);
      if (!currentUser) {
        throw new Error('Không tìm thấy người dùng');
      }

      const potentialMatches = await this.userModel.find({
        _id: { $ne: userId },
        gender: currentUser.genderPreference === 'both' ? 
          { $in: ['male', 'female'] } : 
          currentUser.genderPreference
      });

      console.log(`Found ${potentialMatches.length} potential matches`);

      const matchScores = await Promise.all(
        potentialMatches.map(async (match) => {
          try {
            let score;
            if (useAI) {
              console.log(`Using AI prediction for match ${match._id}`);
              score = await this.mlService.predictMatch(userId, match._id.toString());
            } else {
              console.log(`Using traditional compatibility calculation for match ${match._id}`);
              score = await this.calculateUserCompatibility(userId, match._id.toString());
            }
            
            return {
              user: match,
              score,
              matchMethod: useAI ? 'ai' : 'traditional'
            };
          } catch (error) {
            console.error(`Error calculating score for match ${match._id}:`, error);
            // Fallback về phương pháp tính điểm thông thường nếu dùng AI thất bại
            const score = await this.calculateUserCompatibility(userId, match._id.toString());
            return {
              user: match,
              score,
              matchMethod: 'traditional_fallback'
            };
          }
        })
      );

      const results = matchScores
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(match => ({
          ...match.user.toObject(),
          compatibilityScore: Math.round(match.score * 100),
          matchMethod: match.matchMethod
        }));

      console.log(`Returning ${results.length} matches with methods:`, 
        results.map(r => r.matchMethod).reduce((acc, method) => {
          acc[method] = (acc[method] || 0) + 1;
          return acc;
        }, {})
      );

      return results;

    } catch (error) {
      console.error('Lỗi khi lấy danh sách match:', error);
      throw error;
    }
  }
} 