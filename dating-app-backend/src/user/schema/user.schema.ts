import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { LocationSchema } from './location.schema';
import { Location } from './location.schema';

export type UserDocument = User & Document;

@Schema({ timestamps: true})
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  bio: string;

  @Prop({ type: [String], default: [] })
  interests: string[];

  @Prop() // Thêm trường cho mã xác thực
  verificationCode: string;

  @Prop({ default: false }) // Thêm trường cho trạng thái xác thực
  isVerified: boolean;

  @Prop({ type: Object })
  location: {
    type: string;
    coordinates: number[];
  };

  @Prop({ required: false })
  city: string;

  @Prop({ required: false })
  district: string;

  @Prop({ default: false }) // Thêm trường cho trạng thái đã phê duyệt
  isApproved: boolean;

  @Prop({ type: [Types.ObjectId], ref: 'User' }) // Danh sách người dùng đã tương hợp
  matchedUsers: Types.ObjectId[];
  // Định nghĩa trường _id
  _id: Types.ObjectId; // Hoặc bạn có thể bỏ qua dòng này, Mongoose sẽ tự động tạo

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] }) // Danh sách ID của người dùng mà họ đã thích
  likedUsers: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] }) // Danh sách người dùng đã thích mình
  likedBy: Types.ObjectId[];

  @Prop({ type: [String], default: [] }) // Danh sách URL của ảnh cá nhân
  profilePictures: string[];

  @Prop({ default: false }) // Trạng thái hoạt động
  isOnline: boolean;
  // Thêm các trường mới
  @Prop({ min: 18, max: 100 })
  age: number;

  @Prop({
    enum: [
      'Bạch Dương',
      'Kim Ngưu',
      'Song Tử',
      'Cự Giải',
      'Sư Tử',
      'Xử Nữ',
      'Thiên Bình',
      'Bọ Cạp',
      'Nhân Mã',
      'Ma Kết',
      'Bảo Bình',
      'Song Ngư',
    ],
  })
  zodiacSign: string;

  @Prop()
  education: string;

  @Prop()
  hobbies: string;

  @Prop({
    required: true,
    enum: ['male', 'female', 'other'],
    default: 'other',
  })
  gender: string;

  @Prop({
    required: true,
    enum: ['male', 'female', 'both'],
    default: 'both',
  })
  genderPreference: string;

  @Prop({
    type: Object,
    default: {
      prioritizeInterests: true,
      prioritizeAge: true,
      prioritizeEducation: true,
      prioritizeZodiac: true,
      prioritizeOnline: true,
    },
  })
  searchPreferences: Record<string, boolean>;
  @Prop({ type: Array, default: [] })
  notification: Array<any>;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ location: '2dsphere' }); // Tạo chỉ mục cho vị trí
