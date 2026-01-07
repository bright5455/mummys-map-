import { ApiProperty } from '@nestjs/swagger';

export class ProfileCompletionDto {
  @ApiProperty({
    example: 75,
    description: 'Profile completion percentage',
  })
  completionPercentage: number;

  @ApiProperty({
    example: ['Add profile photo', 'Add bio', 'Add interests'],
    description: 'Missing profile fields',
  })
  missingFields: string[];

  @ApiProperty({
    example: true,
    description: 'Whether the profile is complete',
  })
  isComplete: boolean;
}