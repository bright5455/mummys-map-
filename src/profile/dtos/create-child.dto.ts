import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsDate,
  IsEnum,
  MaxLength,
  IsOptional,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Gender } from 'src/enums/gender.enum';

export class CreateChildDto {
  @ApiProperty({
    example: 'Emma',
    description: 'Name of the child',
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: '2020-03-15',
    description: 'Date of birth of the child (YYYY-MM-DD)',
  })
  @Type(() => Date)
  @IsDate()
  dateOfBirth: Date;

  @ApiProperty({
    enum: Gender,
    example: Gender.FEMALE,
    description: 'Gender of the child',
  })
  @IsEnum(Gender)
  gender: Gender;

  @ApiPropertyOptional({
    example: 'https://example.com/child-photo.jpg',
    description: 'Photo URL of the child',
  })
  @IsOptional()
  @IsUrl()
  photoUrl?: string;

  @ApiPropertyOptional({
    example: 'Loves playing with dolls',
    description: 'Additional notes about the child',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}