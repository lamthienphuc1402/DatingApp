import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Feedback, FeedbackDocument } from './schemas/feedback.schema';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(Feedback.name) private feedbackModel: Model<FeedbackDocument>,
  ) {}

  async create(userId: string, createFeedbackDto: CreateFeedbackDto): Promise<Feedback> {
    if (!userId) {
      throw new Error('userId is required');
    }
    
    const feedback = new this.feedbackModel({
      userId,
      content: createFeedbackDto.content,
      type: createFeedbackDto.type,
      createdAt: new Date(),
    });
    return feedback.save();
  }

  async findAll(): Promise<Feedback[]> {
    return this.feedbackModel
      .find()
      .populate('userId', 'name email profilePictures')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByUserId(userId: string): Promise<Feedback[]> {
    return this.feedbackModel
      .find({ userId })
      .populate('userId', 'name email profilePictures')
      .sort({ createdAt: -1 })
      .exec();
  }

  async respondToFeedback(feedbackId: string, adminResponse: string): Promise<Feedback> {
    return this.feedbackModel.findByIdAndUpdate(
      feedbackId,
      {
        adminResponse,
        isResolved: true,
        updatedAt: new Date(),
      },
      { new: true },
    );
  }
}
