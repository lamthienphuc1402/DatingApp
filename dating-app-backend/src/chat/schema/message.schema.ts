import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
    @Prop({ required: true })
    senderId: string;

    @Prop({ required: true })
    receiverId: string;

    @Prop({ required: true })
    content: string;

    @Prop({ type: Map, of: [String], default: {} })
    reactions: Map<string, string[]>; // emoji: userId[]
}

export const MessageSchema = SchemaFactory.createForClass(Message);