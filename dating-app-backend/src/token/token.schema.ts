import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

export type TokenDocument = Token & Document;
@Schema()
export class Token {
    // Định nghĩa trường _id
    _id: Types.ObjectId; 

    @Prop({ required: true }) 
    userId: string;

    @Prop({required: true})
    accessToken: string;

    @Prop({required: true})
    refreshToken: string;
}

export const TokenSchema = SchemaFactory.createForClass(Token);
