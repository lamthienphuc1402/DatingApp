import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAdminDto {
  @ApiProperty({ description: 'Tên đăng nhập của admin' })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({ description: 'Mật khẩu của admin' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ description: 'Email của admin' })
  @IsEmail()
  email: string;
} 