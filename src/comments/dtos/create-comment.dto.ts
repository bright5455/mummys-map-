import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    example: 'This is such a great post! @johndoe you should see this 😊',
    description: 'Comment content',
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty({ message: 'Comment content cannot be empty' })
  @MaxLength(2000, { message: 'Comment cannot exceed 2000 characters' })
  content: string;

  @ApiProperty({
    example: 'post-uuid-123',
    description: 'ID of the post being commented on',
  })
  @IsUUID()
  @IsNotEmpty()
  postId: string;

  @ApiPropertyOptional({
    example: 'comment-uuid-456',
    description: 'ID of parent comment if this is a reply',
  })
  @IsOptional()
  @IsUUID()
  parentCommentId?: string;
}