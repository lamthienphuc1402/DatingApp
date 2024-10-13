import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // Nhập ApiProperty

export class LoginUserDto {
  @ApiProperty({ description: 'Địa chỉ email của người dùng' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Mật khẩu của người dùng' })
  @IsNotEmpty()
  @IsString()
  password: string;
}