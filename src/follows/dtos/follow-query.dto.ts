import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsEnum, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { FollowStatus } from 'src/enums/follow-status.enum';

export class FollowQueryDto {
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
    description: 'Filter by user ID',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    enum: FollowStatus,
    description: 'Filter by follow status',
  })
  @IsOptional()
  @IsEnum(FollowStatus)
  status?: FollowStatus;

  @ApiPropertyOptional({
    example: 'john',
    description: 'Search by name',
  })
  @IsOptional()
  @IsString()
  search?: string;
}