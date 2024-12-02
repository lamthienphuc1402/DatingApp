import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateLocationDto {
  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  district: string;
} 