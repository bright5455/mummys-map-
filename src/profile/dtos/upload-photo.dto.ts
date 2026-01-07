import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class UploadPhotoDto {
  @ApiProperty({
    example: 'https://cloudinary.com/image.jpg',
    description: 'Photo URL from cloud storage',
  })
  @IsNotEmpty()
  @IsString()
  @IsUrl()
  photoUrl: string;
}