import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LocationDocument = Location & Document;

@Schema()
export class Location {
  @Prop({ required: true })
  city: string;

  @Prop({ required: true }) 
  district: string;

  @Prop({ type: [Number], required: true })
  coordinates: number[]; // [longitude, latitude]
}

export const LocationSchema = SchemaFactory.createForClass(Location); 