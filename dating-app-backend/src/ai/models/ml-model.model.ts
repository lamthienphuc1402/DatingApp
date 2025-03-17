import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class MLModel extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  version: string;

  @Prop({ type: Object, required: true })
  modelTopology: any;

  @Prop({ type: Buffer, required: true })
  weightsData: Buffer;

  @Prop({ type: Array, required: true })
  weightSpecs: Array<{
    name: string;
    shape: number[];
    dtype: string;
  }>;

  @Prop({ type: Object, required: true })
  metadata: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    trainedAt: Date;
    samplesCount: number;
  };
}

export const MLModelSchema = SchemaFactory.createForClass(MLModel); 