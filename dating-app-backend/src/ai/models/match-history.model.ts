import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class MatchHistory extends Document {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  targetUserId: Types.ObjectId;

  @Prop({ required: true })
  wasSuccessfulMatch: boolean;

  @Prop({ type: Object, required: true })
  features: {
    distanceScore: number;
    ageScore: number;
    interestScore: number;
    genderMatch: number;
    educationMatch: number;
    zodiacScore: number;
    interestVector: number[];
    bioScore: number;
  };

  @Prop({ type: Object })
  interactionMetrics?: {
    chatDuration: number;
    messageCount: number;
    averageResponseTime: number;
    lastInteraction: Date;
  };

  @Prop([String])
  commonInterests: string[];

  @Prop({ required: true })
  matchScore: number;
}

export const MatchHistorySchema = SchemaFactory.createForClass(MatchHistory); 