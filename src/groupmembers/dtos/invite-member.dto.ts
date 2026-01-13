import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class InviteMemberDto {
  @ApiProperty({
    example: 'user-uuid-123',
    description: 'ID of the user to invite',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({
    example: 'Join our amazing parenting community!',
    description: 'Optional invitation message',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
