import { IsOptional, IsString, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
    @ApiProperty({ description: 'Tên của người dùng', required: false })
    @IsOptional()
    @IsString()
    name?: string;

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
    profilePictures?: any; // Thêm trường profilePictures
}