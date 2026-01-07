import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsUUID, IsNotEmpty, IsOptional } from 'class-validator';
import { LikeableType } from 'src/enums/likeable-type.enum';

export class CreateLikeDto {
  @ApiProperty({
    enum: LikeableType,
    example: LikeableType.POST,
    description: 'Type of content being liked',
  })
  @IsEnum(LikeableType)
  @IsNotEmpty()
  likeableType: LikeableType;

  @ApiProperty({
    example: 'content-uuid-123',
    description: 'ID of the content being liked',
  })
  @IsUUID()
  @IsNotEmpty()
  likeableId: string;

  @ApiPropertyOptional({
    example: 'user-uuid-456',
    description: 'ID of the content owner (for notifications)',
  })
  @IsOptional()
  @IsUUID()
  contentOwnerId?: string;
}