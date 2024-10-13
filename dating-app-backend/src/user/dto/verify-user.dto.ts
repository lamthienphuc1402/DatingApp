import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyUserDto {
  @ApiProperty({ description: 'Địa chỉ email của người dùng' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Mã xác thực được gửi đến email' })
  @IsString()
  @IsNotEmpty()
  code: string;
}