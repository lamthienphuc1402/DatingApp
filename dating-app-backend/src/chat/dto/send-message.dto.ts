import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ description: 'ID của người gửi' })
  @IsNotEmpty()
  senderId: string;

  @ApiProperty({ description: 'ID của người nhận' })
  @IsNotEmpty()
  receiverId: string;

  @ApiProperty({ description: 'Nội dung tin nhắn' })
  @IsNotEmpty()
  content: string;
}