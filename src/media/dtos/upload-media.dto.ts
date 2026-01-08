import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsBoolean,
  IsUUID,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';
import { MediaContext } from 'src/enums/media-context.enum';

export class UploadMediaDto {
  @ApiPropertyOptional({
    enum: MediaContext,
    example: MediaContext.POST,
    description: 'Context where media will be used',
  })
  @IsOptional()
  @IsEnum(MediaContext)
  context?: MediaContext;

  @ApiPropertyOptional({
    example: 'post-uuid-123',
    description: 'ID of the content this media belongs to',
  })
  @IsOptional()
  @IsUUID()
  contextId?: string;

  @ApiPropertyOptional({
    example: 'Beautiful sunset photo',
    description: 'Alt text for accessibility',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  altText?: string;

  @ApiPropertyOptional({
    example: 'Captured during our family vacation',
    description: 'Caption or description for the media',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  caption?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the media is publicly accessible',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    example: 0,
    description: 'Display order in galleries',
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}