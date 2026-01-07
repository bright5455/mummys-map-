import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateCommentDto {
  @ApiProperty({
    example: 'Updated comment content with edits',
    description: 'Updated comment content',
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty({ message: 'Comment content cannot be empty' })
  @MaxLength(2000, { message: 'Comment cannot exceed 2000 characters' })
  content: string;
}