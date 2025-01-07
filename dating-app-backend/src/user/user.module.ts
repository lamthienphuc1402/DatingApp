import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schema/user.schema';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AuthModule } from '../auth/auth.module'; // Nhập AuthModule
import { EmailService } from '../email/email.service'; // Nhập EmailService
import { LocationServiceModule } from '../location-service/location-service.module'; // Import module chứa LocationService
import { LocationService } from 'src/location-service/location-service.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { CloudinaryProvider } from 'src/cloudinary/cloudinary.provider';
import { ChatModule } from 'src/chat/chat.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    forwardRef(() => AuthModule), // Thêm AuthModule vào imports
    LocationServiceModule, // Đảm bảo rằng LocationServiceModule được import
    forwardRef(() => ChatModule),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    EmailService,
    LocationService,
    CloudinaryService,
    CloudinaryProvider,
  ], // Thêm EmailService vào providers
  exports: [UserService],
})
export class UserModule {}
