import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Token không tồn tại');
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = await this.jwtService.verifyAsync(token);
      request.user = payload;
      return true; // Cho phép tất cả user có token hợp lệ
    } catch {
      throw new UnauthorizedException('Token không hợp lệ');
    }
  }
} 