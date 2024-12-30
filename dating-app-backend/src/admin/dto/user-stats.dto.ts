import { ApiProperty } from '@nestjs/swagger';

export class UserStatsDto {
  @ApiProperty({ description: 'Tổng số người dùng' })
  totalUsers: number;

  @ApiProperty({ description: 'Số người dùng đã xác thực' })
  verifiedUsers: number;

  @ApiProperty({ description: 'Số người dùng đang online' })
  onlineUsers: number;

  @ApiProperty({ description: 'Số người dùng mới trong ngày' })
  todayNewUsers: number;
} 