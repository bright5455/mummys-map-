import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateFollowDto {
  @ApiPropertyOptional({
    example: true,
    description: 'Mute this user (hide their posts from feed)',
  })
  @IsOptional()
  @IsBoolean()
  isMuted?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Show notifications for this user',
  })
  @IsOptional()
  @IsBoolean()
  showNotifications?: boolean;
}