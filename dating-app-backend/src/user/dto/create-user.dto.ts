import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger'; // Nhập ApiHideProperty

export class CreateUserDto {
  @ApiProperty({ description: 'Tên của người dùng' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Địa chỉ email của người dùng' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Mật khẩu của người dùng' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({
    description: 'Thông tin bổ sung về người dùng',
    required: false,
  })
  bio?: string;

  @ApiProperty({ description: 'Sở thích của người dùng', required: false })
  interests?: string[];

  @ApiHideProperty() // Ẩn trường longitude khỏi Swagger
  @IsNumber()
  longitude: number;

  @ApiHideProperty() // Ẩn trường latitude khỏi Swagger
  @IsNumber()
  latitude: number;

  @ApiProperty({
    description: 'Danh sách URL của ảnh cá nhân',
    required: false,
  })
  @IsOptional()
  @IsArray()
  profilePictures?: any;

  @ApiProperty({ description: 'Tuổi của người dùng', required: false })
  @IsNumber()
  age?: number;

  @ApiProperty({ description: 'Dấu hiệu của người dùng', required: false })
  @IsString()
  zodiacSign?: string;

  @ApiProperty({ description: 'Trình độ học vấn của người dùng', required: false })
  @IsString()
  education?: string;

  @ApiProperty({ description: 'Sở thích của người dùng', required: false })
  @IsString()
  hobbies?: string;

  @ApiProperty({ description: 'Giới tính của người dùng', required: true })
  @IsString()
  gender: 'male' | 'female' | 'other';

  @ApiProperty({ description: 'Sở thích giới tính của người dùng', required: true })
  @IsString()
  genderPreference: 'male' | 'female' | 'both';
}
