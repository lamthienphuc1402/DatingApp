import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAdminDto {
  @ApiProperty({ description: 'Tên đăng nhập của admin' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ description: 'Email của admin' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Mật khẩu của admin' })
  @IsOptional()
  @IsString()
  password?: string;
} 