import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import mongoose from 'mongoose';

export type FeedbackDocument = Feedback & Document;

@Schema({ timestamps: true })
export class Feedback {
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  type: 'bug' | 'feature' | 'other';

  @Prop({ default: false })
  isResolved: boolean;

  @Prop()
  adminResponse?: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback); 