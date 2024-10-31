import { IsOptional, IsString, IsArray, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
    @ApiProperty({ description: 'Tên của người dùng', required: false })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({ description: 'Email của người dùng', required: false })
    @IsOptional()
    @IsString()
    email?: string;

    @ApiProperty({ description: 'Mật khẩu của người dùng', required: false })
    @IsOptional()
    @IsString()
    password?: string;

    @ApiProperty({ description: 'Sở thích của người dùng', required: false })
    @IsOptional()
    @IsArray()
    interests?: string[];

    @ApiProperty({ description: 'Thông tin tiểu sử của người dùng', required: false })
    @IsOptional()
    @IsString()
    bio?: string;

    @ApiProperty({ description: 'Danh sách URL của ảnh cá nhân', required: false })
    @IsOptional()
    @IsArray()
    profilePictures?: any;

    @ApiProperty({ description: 'Tuổi của người dùng', required: false })
    @IsOptional()
    @IsNumber()
    age?: number;

    @ApiProperty({ description: 'Dấu hiệu của người dùng', required: false })
    @IsOptional()
    @IsString()
    zodiacSign?: string;

    @ApiProperty({ description: 'Trình độ học vấn của người dùng', required: false })
    @IsOptional()
    @IsString()
    education?: string;

    @ApiProperty({ description: 'Sở thích của người dùng', required: false })
    @IsOptional()
    @IsString()
    hobbies?: string;

    @ApiProperty({ description: 'Giới tính của người dùng', required: false })
    @IsOptional()
    @IsString()
    gender?: 'male' | 'female' | 'other';

    @ApiProperty({ description: 'Sở thích giới tính của người dùng', required: false })
    @IsOptional()
    @IsString()
    genderPreference?: 'male' | 'female' | 'both';

    @ApiProperty({ description: 'Danh sách URL của ảnh cũ', required: false })
    @IsOptional()
    @IsArray()
    existingPictures?: string[];
}