import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateMemberSettingsDto {
  @ApiPropertyOptional({
    example: true,
    description: 'Receive notifications from this group',
  })
  @IsOptional()
  @IsBoolean()
  receiveNotifications?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Mute this group',
  })
  @IsOptional()
  @IsBoolean()
  isMuted?: boolean;
}