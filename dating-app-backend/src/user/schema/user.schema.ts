import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop()
    bio: string;

    @Prop()
    interests: string[];

    @Prop() // Thêm trường cho mã xác thực
    verificationCode: string;

    @Prop({ default: false }) // Thêm trường cho trạng thái xác thực
    isVerified: boolean;

    @Prop({ type: { type: String, enum: ['Point'], required: true }, coordinates: { type: [Number], required: true } }) // Định nghĩa rõ ràng cho trường location
    location: {
        type: { type: string; enum: ['Point']; required: true },
        coordinates: number[]; // [longitude, latitude]
    };

    @Prop({ default: false }) // Thêm trường cho trạng thái đã phê duyệt
    isApproved: boolean;

    @Prop({ type: [Types.ObjectId], ref: 'User' }) // Danh sách người dùng đã tương hợp
    matchedUsers: Types.ObjectId[];
    // Định nghĩa trường _id
    _id: Types.ObjectId; // Hoặc bạn có thể bỏ qua dòng này, Mongoose sẽ tự động tạo

    @Prop({ type: [String], default: [] }) // Danh sách ID của người dùng mà họ đã thích
    likedUsers: string[];

    @Prop({ type: [Types.ObjectId], ref: 'User', default: [] }) // Danh sách người dùng đã thích mình
    likedBy: Types.ObjectId[];

    @Prop({ type: [String], default: [] }) // Danh sách URL của ảnh cá nhân
    profilePictures: string[];
    
    @Prop({ default: false }) // Trạng thái hoạt động
    isOnline: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ location: '2dsphere' }); // Tạo chỉ mục cho vị trí