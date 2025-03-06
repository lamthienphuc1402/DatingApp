import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserEmbedding } from '../models/user-embedding.model';
import { User } from '../../user/schema/user.schema';
import { tf } from '../config/tensorflow.config';

@Injectable()
export class UserMatchingService {
  private model: tf.LayersModel;

  constructor(
    @InjectModel(UserEmbedding.name)
    private userEmbeddingModel: Model<UserEmbedding>,
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}

  async generateUserEmbedding(userId: string, preferences: any): Promise<UserEmbedding> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Tạo vector đặc trưng từ thông tin người dùng
    const embedding = await this.createEmbeddingVector(user, preferences);

    // Lưu embedding vào database
    const userEmbedding = new this.userEmbeddingModel({
      userId,
      embedding,
      timestamp: new Date(),
    });

    return userEmbedding.save();
  }

  private async createEmbeddingVector(user: User, preferences: any): Promise<number[]> {
    // Chuyển đổi thông tin người dùng thành vector số
    const features = [
      user.age || 25, // Tuổi
      user.gender === 'male' ? 1 : 0, // Giới tính
      user.interests?.length || 0, // Số lượng sở thích
      user.education ? 1 : 0, // Có học vấn hay không
      user.isVerified ? 1 : 0, // Đã xác thực chưa
      user.profilePictures?.length || 0, // Số ảnh đại diện
      user.bio ? 1 : 0, // Có bio không
      user.zodiacSign ? 1 : 0, // Có cung hoàng đạo không
      user.isOnline ? 1 : 0, // Đang online không
      preferences?.prioritizeDistance ? 1 : 0, // Ưu tiên khoảng cách
    ];

    return tf.tidy(() => {
      // Chuẩn hóa vector
      const tensor = tf.tensor2d([features]);
      const normalized = tf.div(
        tf.sub(tensor, tf.min(tensor)), 
        tf.sub(tf.max(tensor), tf.min(tensor))
      );

      // Chuyển đổi TypedArray sang number[]
      return Array.from(normalized.dataSync());
    });
  }

  calculateCompatibility(embedding1: number[], embedding2: number[]): number {
    return tf.tidy(() => {
      const tensor1 = tf.tensor1d(embedding1);
      const tensor2 = tf.tensor1d(embedding2);

      // Tính cosine similarity
      const dotProduct = tf.sum(tf.mul(tensor1, tensor2));
      const norm1 = tf.sqrt(tf.sum(tf.square(tensor1)));
      const norm2 = tf.sqrt(tf.sum(tf.square(tensor2)));
      const similarity = tf.div(dotProduct, tf.mul(norm1, norm2));

      // Chuyển đổi từ [-1, 1] sang [0, 1]
      return (similarity.dataSync()[0] + 1) / 2;
    });
  }
} 