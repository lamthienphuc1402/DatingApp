import { IsNotEmpty, IsString, IsEnum } from 'class-validator';

export class CreateFeedbackDto {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsNotEmpty()
  @IsEnum(['bug', 'feature', 'other'])
  type: 'bug' | 'feature' | 'other';
} 