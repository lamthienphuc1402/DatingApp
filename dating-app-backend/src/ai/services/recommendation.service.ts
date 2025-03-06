import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Recommendation } from '../models/recommendation.model';
import { UserMatchingService } from './user-matching.service';
import { TextAnalysisService } from './text-analysis.service';

@Injectable()
export class RecommendationService {
  constructor(
    @InjectModel(Recommendation.name)
    private recommendationModel: Model<Recommendation>,
    private userMatchingService: UserMatchingService,
    private textAnalysisService: TextAnalysisService,
  ) {}

  async generateRecommendations(userId: string, userPreferences: any): Promise<Recommendation> {
    // Lấy hoặc tạo mới recommendation document
    let recommendation = await this.recommendationModel.findOne({ userId });
    if (!recommendation) {
      recommendation = new this.recommendationModel({ userId });
    }

    // Cập nhật preferences
    recommendation.userPreferences = userPreferences;

    // Tính toán recommendations mới
    const newRecommendations = await this.calculateRecommendations(userId, userPreferences);
    recommendation.recommendations = newRecommendations;
    recommendation.lastCalculated = new Date();

    return recommendation.save();
  }

  private async calculateRecommendations(userId: string, preferences: any) {
    // Lấy embedding của user hiện tại
    const userEmbedding = await this.userMatchingService.generateUserEmbedding(userId, preferences);

    // Tìm các users phù hợp dựa trên preferences
    const potentialMatches = await this.findPotentialMatches(userId, preferences);

    // Tính điểm tương thích và tạo recommendations
    const recommendations = await Promise.all(
      potentialMatches.map(async (match) => {
        const matchEmbedding = await this.userMatchingService.generateUserEmbedding(
          match._id,
          match
        );

        const score = await this.userMatchingService.calculateCompatibility(
          userEmbedding.embedding,
          matchEmbedding.embedding
        );

        const reasons = this.generateMatchReasons(preferences, match, score);

        return {
          userId: match._id,
          score,
          reasons,
          lastUpdated: new Date()
        };
      })
    );

    // Sắp xếp theo điểm số và giới hạn số lượng
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  private async findPotentialMatches(userId: string, preferences: any) {
    // Implement logic to query database for potential matches based on preferences
    // This is a placeholder - implement actual database query
    return [];
  }

  private generateMatchReasons(userPrefs: any, match: any, score: number): string[] {
    const reasons: string[] = [];

    if (score > 0.8) {
      reasons.push('Độ tương thích rất cao');
    }

    if (userPrefs.interests?.some((interest: string) => 
      match.interests?.includes(interest))) {
      reasons.push('Có sở thích chung');
    }

    if (userPrefs.education === match.education) {
      reasons.push('Trình độ học vấn tương đồng');
    }

    // Thêm các lý do khác dựa trên các tiêu chí matching

    return reasons;
  }

  async updateSuccessRate(recommendationId: string, success: boolean) {
    const recommendation = await this.recommendationModel.findById(recommendationId);
    if (!recommendation) return;

    // Cập nhật tỷ lệ thành công
    const totalRecommendations = recommendation.recommendations.length;
    const currentSuccesses = recommendation.successRate * totalRecommendations;
    const newSuccessRate = (currentSuccesses + (success ? 1 : 0)) / (totalRecommendations + 1);

    recommendation.successRate = newSuccessRate;
    return recommendation.save();
  }
} 