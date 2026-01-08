import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class BlockUserDto {
  @ApiProperty({
    example: 'user-uuid-123',
    description: 'ID of the user to block',
  })
  @IsUUID()
  @IsNotEmpty()
  blockedId: string;

  @ApiPropertyOptional({
    example: 'Inappropriate behavior',
    description: 'Reason for blocking',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}