import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { LikeableType } from 'src/enums/likeable-type.enum';

export class LikeQueryDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Page number',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 20,
    description: 'Items per page',
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    example: 'user-uuid',
    description: 'Filter by user who liked',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    enum: LikeableType,
    description: 'Filter by content type',
  })
  @IsOptional()
  @IsEnum(LikeableType)
  likeableType?: LikeableType;

  @ApiPropertyOptional({
    example: 'content-uuid',
    description: 'Filter by specific content ID',
  })
  @IsOptional()
  @IsUUID()
  likeableId?: string;
}