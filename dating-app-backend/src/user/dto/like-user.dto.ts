import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LikeUserDto {
    @ApiProperty({ description: 'ID của người dùng hiện tại' })
    @IsNotEmpty()
    userId: string;

    @ApiProperty({ description: 'ID của người dùng mục tiêu' })
    @IsNotEmpty()
    targetUserId: string;
}