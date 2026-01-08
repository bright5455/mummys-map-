import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class FollowUserDto {
  @ApiProperty({
    example: 'user-uuid-123',
    description: 'ID of the user to follow',
  })
  @IsUUID()
  @IsNotEmpty()
  followingId: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Show notifications for this user',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  showNotifications?: boolean;
}