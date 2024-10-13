import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { UserService } from '../user/user.service';
import { LoginUserDto } from '../user/dto/login-user.dto';
import * as bcrypt from 'bcrypt';
import { TokenService } from 'src/token/token.service';

@Injectable()
export class AuthService {
  constructor(private userService: UserService, private jwtService: JwtService, private tokenService: TokenService) {}

  async login(loginDto: LoginUserDto) {
    const user = await this.userService.findByEmail(loginDto.email);
    if (user && await bcrypt.compare(loginDto.password, user.password)) {
      const payload = { email: user.email, sub: user._id };
      const token = {
        accessToken: this.jwtService.sign(payload),
        refreshToken: randomUUID()
      };
      const isTokenExisted = await this.tokenService.findUserTokenByUserId(user._id.toString());
      if (isTokenExisted) {
        const newAccessToken = await this.tokenService.refreshToken({
          email: user.email,
          userId: user._id.toString(),
          refreshToken: isTokenExisted
        });
        return {
          refreshToken: isTokenExisted,
          accessToken: newAccessToken
        };
      }
      await this.tokenService.createUserToken({
        ...token,
        userId: user._id.toString()
      });
      return token;
    }
    throw new UnauthorizedException('Invalid email or password');
  }
}