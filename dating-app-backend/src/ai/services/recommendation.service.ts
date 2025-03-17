import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Recommendation } from '../models/recommendation.model';
import { UserMatchingService } from './user-matching.service';
import { TextAnalysisService } from './text-analysis.service';
import { User } from '../../user/schema/user.schema';

@Injectable()
export class RecommendationService {
  constructor(
    @InjectModel(Recommendation.name)
    private recommendationModel: Model<Recommendation>,
    private userMatchingService: UserMatchingService,
    private textAnalysisService: TextAnalysisService,
    @InjectModel(User.name) private userModel: Model<User>,
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
    // Lấy user hiện tại
    const currentUser = await this.userModel.findById(userId);
    if (!currentUser || !currentUser.location?.coordinates) {
      throw new Error('Không tìm thấy thông tin vị trí người dùng');
    }

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

        // Tính khoảng cách
        const distance = this.calculateDistance(
          currentUser.location.coordinates,
          match.location?.coordinates
        );

        const reasons = this.generateMatchReasons(preferences, match, score);

        return {
          userId: match._id,
          score,
          distance: distance ? Math.round(distance * 10) / 10 : null, // Làm tròn đến 1 chữ số thập phân
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

  private calculateDistance(coords1: number[], coords2?: number[]): number | null {
    if (!coords1 || !coords2) return null;

    const R = 6371; // Bán kính Trái Đất (km)
    const dLat = (coords2[0] - coords1[0]) * Math.PI / 180;
    const dLon = (coords2[1] - coords1[1]) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coords1[0] * Math.PI / 180) * Math.cos(coords2[0] * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
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