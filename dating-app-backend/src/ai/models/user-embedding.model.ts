import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class UserEmbedding extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true, type: [Number] })
  embedding: number[];

  @Prop({ default: Date.now })
  lastUpdated: Date;

  @Prop({ type: Object })
  metadata: {
    interestVector?: number[];
    behaviorVector?: number[];
    demographicVector?: number[];
  };
}

export const UserEmbeddingSchema = SchemaFactory.createForClass(UserEmbedding); 