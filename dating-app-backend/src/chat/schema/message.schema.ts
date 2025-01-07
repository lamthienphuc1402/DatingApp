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

    @Prop({ default: false })
    isRead: boolean;

    @Prop({ type: Map, of: [String], default: new Map() })
    reactions: Map<string, string[]>;

    @Prop()
    createdAt: Date;

    @Prop()
    updatedAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);