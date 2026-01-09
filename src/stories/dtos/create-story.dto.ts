import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsBoolean,
  MaxLength,
  IsHexColor,
  IsInt,
  Min,
} from 'class-validator';
import { StoryPrivacy } from 'src/enums/story-privacy.enum';

export class CreateStoryDto {
  @ApiPropertyOptional({
    example: 'Beautiful day at the park! 🌸',
    description: 'Caption for the story',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  caption?: string;

  @ApiPropertyOptional({
    example: 'Hello World!',
    description: 'Text overlay on story',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  textOverlay?: string;

  @ApiPropertyOptional({
    example: '#FF5733',
    description: 'Background color for text stories',
  })
  @IsOptional()
  @IsHexColor()
  backgroundColor?: string;

  @ApiPropertyOptional({
    enum: StoryPrivacy,
    example: StoryPrivacy.FOLLOWERS,
    description: 'Who can view the story',
    default: StoryPrivacy.PUBLIC,
  })
  @IsOptional()
  @IsEnum(StoryPrivacy)
  privacy?: StoryPrivacy;

  @ApiPropertyOptional({
    example: true,
    description: 'Allow replies to the story',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  allowReplies?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Show viewers list to story creator',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  showViewers?: boolean;

  @ApiPropertyOptional({
    example: 24,
    description: 'Hours until story expires (default 24)',
    default: 24,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  expiresInHours?: number;
}