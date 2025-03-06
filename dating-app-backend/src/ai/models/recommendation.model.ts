import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Recommendation extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop([{
    userId: String,
    score: Number,
    reasons: [String],
    lastUpdated: { type: Date, default: Date.now }
  }])
  recommendations: Array<{
    userId: string;
    score: number;
    reasons: string[];
    lastUpdated: Date;
  }>;

  @Prop({ type: Object })
  userPreferences: {
    ageRange?: { min: number; max: number };
    location?: { maxDistance: number };
    interests?: string[];
    educationLevel?: string[];
  };

  @Prop({ default: Date.now })
  lastCalculated: Date;

  @Prop({ type: Number, default: 0 })
  successRate: number;
}

export const RecommendationSchema = SchemaFactory.createForClass(Recommendation); 