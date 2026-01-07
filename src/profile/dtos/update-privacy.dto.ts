import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { ProfileVisibility } from 'src/enums/profile-visibility.enum';

export class UpdatePrivacyDto {
  @ApiPropertyOptional({
    enum: ProfileVisibility,
    example: ProfileVisibility.PUBLIC,
    description: 'Profile visibility setting',
  })
  @IsOptional()
  @IsEnum(ProfileVisibility)
  visibility?: ProfileVisibility;

  @ApiPropertyOptional({
    example: true,
    description: 'Show location on profile',
  })
  @IsOptional()
  @IsBoolean()
  showLocation?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Show age on profile',
  })
  @IsOptional()
  @IsBoolean()
  showAge?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Show children information on profile',
  })
  @IsOptional()
  @IsBoolean()
  showChildren?: boolean;
}