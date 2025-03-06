import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class ChatAnalysis extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  chatId: string;

  @Prop({ type: Object })
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };

  @Prop([String])
  keywords: string[];

  @Prop({ type: Object })
  messageStats: {
    averageLength: number;
    responseTime: number;
    messageFrequency: number;
  };

  @Prop({ default: Date.now })
  analyzedAt: Date;
}

export const ChatAnalysisSchema = SchemaFactory.createForClass(ChatAnalysis); 