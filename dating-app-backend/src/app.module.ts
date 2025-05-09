import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { LocationService } from './location-service/location-service.service';
import { ChatModule } from './chat/chat.module';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { FeedbackModule } from './feedback/feedback.module';
import { AIModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
      isGlobal: true,
      cache: true,
    }),
    MongooseModule.forRoot(
      'mongodb+srv://phuc:Tphuc1402@cluster0.xecpv7v.mongodb.net/dating-app',
    ),
    UserModule,
    AuthModule,
    ChatModule,
    AdminModule,
    FeedbackModule,
    AIModule,
  ],
  controllers: [AppController],
  providers: [AppService, LocationService],
})
export class AppModule {}
