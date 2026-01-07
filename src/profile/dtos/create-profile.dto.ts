import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDate,
  IsEnum,
  IsInt,
  Min,
  Max,
  MaxLength,
  IsBoolean,
  IsNumber,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Gender } from 'src/enums/gender.enum';
import { ParentingStage } from 'src/enums/parenting-stage.enum';
import { ProfileVisibility } from 'src/enums/profile-visibility.enum';

export class CreateProfileDto {
  @ApiProperty({
    example: 'Jane',
    description: 'First name of the user',
  })
  @IsString()
  @MaxLength(50)
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Last name of the user',
  })
  @IsString()
  @MaxLength(50)
  lastName: string;

  @ApiPropertyOptional({
    example: 'Jane D.',
    description: 'Display name (optional, defaults to first name)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  displayName?: string;

  @ApiPropertyOptional({
    example: 'Loving mother of two. Passionate about parenting and child development.',
    description: 'Short bio about the user',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiProperty({
    example: '1990-05-15',
    description: 'Date of birth (YYYY-MM-DD)',
  })
  @Type(() => Date)
  @IsDate()
  dateOfBirth: Date;

  @ApiProperty({
    enum: Gender,
    example: Gender.FEMALE,
    description: 'Gender of the user',
  })
  @IsEnum(Gender)
  gender: Gender;

  @ApiPropertyOptional({
    example: 'https://example.com/profile.jpg',
    description: 'Profile photo URL',
  })
  @IsOptional()
  @IsUrl()
  profilePhotoUrl?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/cover.jpg',
    description: 'Cover photo URL',
  })
  @IsOptional()
  @IsUrl()
  coverPhotoUrl?: string;

  @ApiPropertyOptional({
    example: 'Lagos, Nigeria',
    description: 'Location/city',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @ApiPropertyOptional({
    example: 6.5244,
    description: 'Latitude coordinate',
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({
    example: 3.3792,
    description: 'Longitude coordinate',
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({
    example: 'Lagos',
    description: 'City',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    example: 'Lagos State',
    description: 'State/Province',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    example: 'Nigeria',
    description: 'Country',
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({
    example: 2,
    description: 'Number of children',
    minimum: 0,
    maximum: 20,
  })
  @IsInt()
  @Min(0)
  @Max(20)
  numberOfChildren: number;

  @ApiPropertyOptional({
    enum: ParentingStage,
    example: ParentingStage.TODDLER,
    description: 'Current parenting stage',
  })
  @IsOptional()
  @IsEnum(ParentingStage)
  parentingStage?: ParentingStage;

  @ApiPropertyOptional({
    enum: ProfileVisibility,
    example: ProfileVisibility.PUBLIC,
    description: 'Profile visibility setting',
    default: ProfileVisibility.PUBLIC,
  })
  @IsOptional()
  @IsEnum(ProfileVisibility)
  visibility?: ProfileVisibility;

  @ApiPropertyOptional({
    example: true,
    description: 'Show location on profile',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  showLocation?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Show age on profile',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  showAge?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Show children information on profile',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  showChildren?: boolean;
}