import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsUrl,
  MaxLength,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PostType } from 'src/enums/post-type.enum';
import { PostVisibility } from 'src/enums/post-visibility.enum';

class PostMediaDto {
  @ApiProperty({
    example: 'https://cloudinary.com/image.jpg',
    description: 'Media URL',
  })
  @IsUrl()
  mediaUrl: string;

  @ApiPropertyOptional({
    example: 'https://cloudinary.com/thumb.jpg',
    description: 'Thumbnail URL for videos',
  })
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @ApiProperty({
    example: 'image',
    enum: ['image', 'video'],
    description: 'Media type',
  })
  @IsString()
  mediaType: string;

  @ApiPropertyOptional({
    example: 1920,
    description: 'Media width',
  })
  @IsOptional()
  width?: number;

  @ApiPropertyOptional({
    example: 1080,
    description: 'Media height',
  })
  @IsOptional()
  height?: number;

  @ApiPropertyOptional({
    example: 30,
    description: 'Video duration in seconds',
  })
  @IsOptional()
  duration?: number;
}

export class CreatePostDto {
  @ApiPropertyOptional({
    example: 'Had an amazing day at the park with my kids! 🌟 #MommyLife',
    description: 'Post content',
    maxLength: 5000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000, { message: 'Post content cannot exceed 5000 characters' })
  content?: string;

  @ApiProperty({
    enum: PostType,
    example: PostType.TEXT,
    description: 'Type of post',
    default: PostType.TEXT,
  })
  @IsEnum(PostType)
  type: PostType;

  @ApiPropertyOptional({
    enum: PostVisibility,
    example: PostVisibility.PUBLIC,
    description: 'Post visibility',
    default: PostVisibility.PUBLIC,
  })
  @IsOptional()
  @IsEnum(PostVisibility)
  visibility?: PostVisibility;

  @ApiPropertyOptional({
    type: [PostMediaDto],
    description: 'Media attachments (images/videos)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostMediaDto)
  media?: PostMediaDto[];

  @ApiPropertyOptional({
    example: 'post-uuid-to-share',
    description: 'ID of post being shared',
  })
  @IsOptional()
  @IsUUID()
  sharedPostId?: string;
}