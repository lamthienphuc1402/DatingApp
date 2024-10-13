import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { LocationService } from './location-service/location-service.service';
import { ChatModule } from './chat/chat.module';


@Module({
  imports: [
    MongooseModule.forRoot('mongodb+srv://phuc:Tphuc1402@cluster0.xecpv7v.mongodb.net/'),
    UserModule,
    AuthModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService, LocationService],
})
export class AppModule {}
