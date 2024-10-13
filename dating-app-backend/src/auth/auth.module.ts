import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '../user/user.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TokenModule } from 'src/token/token.module';

@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => TokenModule),
    JwtModule.register({
      secret: 'kiki', // Thay đổi secret key
      signOptions: { expiresIn: '60m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}