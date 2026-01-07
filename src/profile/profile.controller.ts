import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ProfilesService } from './profile.service';
import { CreateProfileDto } from './dtos/create-profile.dto';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { CreateChildDto } from './dtos/create-child.dto';
import { UpdateChildDto } from './dtos/update-child.dto';
import { AddInterestsDto } from './dtos/add-interests.dto';
import { UpdatePrivacyDto } from './dtos/update-privacy.dto';
import { UploadPhotoDto } from './dtos/upload-photo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Profile } from './entities/profile.entity';

@ApiTags('Profiles')
@Controller('profiles')
@UseGuards(ThrottlerGuard, JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ProfilesController {
  private readonly logger = new Logger(ProfilesController.name);

  constructor(private readonly profilesService: ProfilesService) {}

   @Post()
  @Throttle({default: { limit: 5, ttl: 60000 }}) 
  @ApiOperation({ summary: 'Create a new profile or update existing' })
  @ApiBody({ type: CreateProfileDto })
  @ApiResponse({ status: 201, description: 'Profile created successfully', type: Profile })
  @ApiResponse({ status: 200, description: 'Existing profile updated successfully', type: Profile })
  async createProfile(
    @CurrentUser('id') userId: string,
    @Body() createProfileDto: CreateProfileDto,
  ): Promise<{ success: boolean; status: number; profile: Profile }> {
    const { status, profile } = await this.profilesService.create(userId, createProfileDto);

    return {
      success: true,
      status,
      profile,
    };
  }

  @Get()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Get all profiles',
    description: 'Retrieve paginated list of all profiles',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Items per page',
  })
  @ApiResponse({
    status: 200,
    description: 'Profiles retrieved successfully',
  })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.profilesService.findAll(+page, +limit);
  }

  @Get('me')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Retrieve profile of authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Profile not found',
  })
  async getMyProfile(@CurrentUser('id') userId: string) {
    return this.profilesService.findByUserId(userId);
  }

  @Get('search')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Search profiles',
    description: 'Search profiles by name or location',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    example: 'Jane',
    description: 'Search query',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved',
  })
  async search(
    @Query('q') query: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.profilesService.searchProfiles(query, +page, +limit);
  }

  @Get(':id')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Get profile by ID',
    description: 'Retrieve specific profile by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Profile UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Profile not found',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.profilesService.findOne(id);
  }

  @Patch(':id')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary:'Update profile',
description: 'Update profile information',
})
@ApiParam({
name: 'id',
description: 'Profile UUID',
})
@ApiResponse({
status: 200,
description: 'Profile updated successfully',
})
@ApiResponse({
status: 404,
description: 'Profile not found',
})
async update(
@Param('id', ParseUUIDPipe) id: string,
@Body() updateProfileDto: UpdateProfileDto,
) {
return this.profilesService.update(id, updateProfileDto);
}
@Delete(':id')
@HttpCode(HttpStatus.NO_CONTENT)
@Throttle({ default: { limit: 3, ttl: 60000 } })
@ApiOperation({
summary: 'Delete profile',
description: 'Permanently delete profile',
})
@ApiParam({
name: 'id',
description: 'Profile UUID',
})
@ApiResponse({
status: 204,
description: 'Profile deleted successfully',
})
@ApiResponse({
status: 404,
description: 'Profile not found',
})
async remove(@Param('id', ParseUUIDPipe) id: string) {
await this.profilesService.remove(id);
}

@Patch(':id/profile-photo')
@Throttle({ default: { limit: 5, ttl: 60000 } })
@ApiOperation({
summary: 'Update profile photo',
description: 'Upload or update profile photo',
})
@ApiParam({
name: 'id',
description: 'Profile UUID',
})
@ApiResponse({
status: 200,
description: 'Profile photo updated successfully',
})
async updateProfilePhoto(
@Param('id', ParseUUIDPipe) id: string,
@Body() uploadPhotoDto: UploadPhotoDto,
) {
return this.profilesService.updateProfilePhoto(id, uploadPhotoDto.photoUrl);
}
@Patch(':id/cover-photo')
@Throttle({ default: { limit: 5, ttl: 60000 } })
@ApiOperation({
summary: 'Update cover photo',
description: 'Upload or update cover photo',
})
@ApiParam({
name: 'id',
description: 'Profile UUID',
})
@ApiResponse({
status: 200,
description: 'Cover photo updated successfully',
})
async updateCoverPhoto(
@Param('id', ParseUUIDPipe) id: string,
@Body() uploadPhotoDto: UploadPhotoDto,
) {
return this.profilesService.updateCoverPhoto(id, uploadPhotoDto.photoUrl);
}

@Patch(':id/privacy')
@Throttle({ default: { limit: 10, ttl: 60000 } })
@ApiOperation({
summary: 'Update privacy settings',
description: 'Update profile privacy and visibility settings',
})
@ApiParam({
name: 'id',
description: 'Profile UUID',
})
@ApiResponse({
status: 200,
description: 'Privacy settings updated successfully',
})
async updatePrivacy(
@Param('id', ParseUUIDPipe) id: string,
@Body() updatePrivacyDto: UpdatePrivacyDto,
) {
return this.profilesService.updatePrivacy(id, updatePrivacyDto);
}

@Get(':id/completion')
@Throttle({ default: { limit: 20, ttl: 60000 } })
@ApiOperation({
summary: 'Get profile completion status',
description: 'Check profile completion percentage and missing fields',
})
@ApiParam({
name: 'id',
description: 'Profile UUID',
})
@ApiResponse({
status: 200,
description: 'Profile completion status retrieved',
})
async getCompletion(@Param('id', ParseUUIDPipe) id: string) {
return this.profilesService.getProfileCompletion(id);
}

@Post(':id/children')
@Throttle({ default: { limit: 10, ttl: 60000 } })
@HttpCode(HttpStatus.CREATED)
@ApiOperation({
summary: 'Add child to profile',
description: 'Add child information to user profile',
})
@ApiParam({
name: 'id',
description: 'Profile UUID',
})
@ApiResponse({
status: 201,
description: 'Child added successfully',
})
@ApiResponse({
status: 404,
description: 'Profile not found',
})
async addChild(
@Param('id', ParseUUIDPipe) profileId: string,
@Body() createChildDto: CreateChildDto,
) {
return this.profilesService.addChild(profileId, createChildDto);
}
@Get(':id/children')
@Throttle({ default: { limit: 20, ttl: 60000 } })
@ApiOperation({
summary: 'Get all children',
description: 'Retrieve all children for a profile',
})
@ApiParam({
name: 'id',
description: 'Profile UUID',
})
@ApiResponse({
status: 200,
description: 'Children retrieved successfully',
})
async getChildren(@Param('id', ParseUUIDPipe) profileId: string) {
return this.profilesService.getChildren(profileId);
}
@Get(':id/children/:childId')
@Throttle({ default: { limit: 20, ttl: 60000 } })
@ApiOperation({
summary: 'Get child by ID',
description: 'Retrieve specific child information',
})
@ApiParam({
name: 'id',
description: 'Profile UUID',
})
@ApiParam({
name: 'childId',
description: 'Child UUID',
})
@ApiResponse({
status: 200,
description: 'Child retrieved successfully',
})
@ApiResponse({
status: 404,
description: 'Child not found',
})
async getChild(
@Param('id', ParseUUIDPipe) profileId: string,
@Param('childId', ParseUUIDPipe) childId: string,
) {
return this.profilesService.getChild(profileId, childId);
}
@Patch(':id/children/:childId')
@Throttle({ default: { limit: 10, ttl: 60000 } })
@ApiOperation({
summary: 'Update child information',
description: 'Update child details',
})
@ApiParam({
name: 'id',
description: 'Profile UUID',
})
@ApiParam({
name: 'childId',
description: 'Child UUID',
})
@ApiResponse({
status: 200,
description: 'Child updated successfully',
})
@ApiResponse({
status: 404,
description: 'Child not found',
})
async updateChild(
@Param('id', ParseUUIDPipe) profileId: string,
@Param('childId', ParseUUIDPipe) childId: string,
@Body() updateChildDto: UpdateChildDto,
) {
return this.profilesService.updateChild(profileId, childId, updateChildDto);
}
@Patch(':id/children/:childId/photo')
@Throttle({ default: { limit: 5, ttl: 60000 } })
@ApiOperation({
summary: 'Update child photo',
description: 'Upload or update child photo',
})
@ApiParam({
name: 'id',
description: 'Profile UUID',
})
@ApiParam({
name: 'childId',
description: 'Child UUID',
})
@ApiResponse({
status: 200,
description: 'Child photo updated successfully',
})
async updateChildPhoto(
@Param('id', ParseUUIDPipe) profileId: string,
@Param('childId', ParseUUIDPipe) childId: string,
@Body() uploadPhotoDto: UploadPhotoDto,
) {
return this.profilesService.updateChildPhoto(
profileId,
childId,
uploadPhotoDto.photoUrl,
);
}
@Delete(':id/children/:childId')
@HttpCode(HttpStatus.NO_CONTENT)
@Throttle({ default: { limit: 5, ttl: 60000 } })
@ApiOperation({
summary: 'Remove child from profile',
description: 'Delete child information',
})
@ApiParam({
name: 'id',
description: 'Profile UUID',
})
@ApiParam({
name: 'childId',
description: 'Child UUID',
})
@ApiResponse({
status: 204,
description: 'Child removed successfully',
})
@ApiResponse({
status: 404,
description: 'Child not found',
})
async removeChild(
@Param('id', ParseUUIDPipe) profileId: string,
@Param('childId', ParseUUIDPipe) childId: string,
) {
await this.profilesService.removeChild(profileId, childId);
}

@Post(':id/interests')
@Throttle({ default: { limit: 10, ttl: 60000 } })
@HttpCode(HttpStatus.OK)
@ApiOperation({
summary: 'Add interests to profile',
description: 'Add multiple interests to user profile',
})
@ApiParam({
name: 'id',
description: 'Profile UUID',
})
@ApiResponse({
status: 200,
description: 'Interests added successfully',
})
@ApiResponse({
status: 404,
description: 'Profile not found',
})
@ApiResponse({
status: 400,
description: 'Some interests not found or inactive',
})
async addInterests(
@Param('id', ParseUUIDPipe) profileId: string,
@Body() addInterestsDto: AddInterestsDto,
) {
return this.profilesService.addInterests(
profileId,
addInterestsDto.interestIds,
);
}
@Get(':id/interests')
@Throttle({ default: { limit: 20, ttl: 60000 } })
@ApiOperation({
summary: 'Get profile interests',
description: 'Retrieve all interests for a profile',
})
@ApiParam({
name: 'id',
description: 'Profile UUID',
})
@ApiResponse({
status: 200,
description: 'Interests retrieved successfully',
})
async getInterests(@Param('id', ParseUUIDPipe) profileId: string) {
return this.profilesService.getInterests(profileId);
}
@Delete(':id/interests/:interestId')
@HttpCode(HttpStatus.NO_CONTENT)
@Throttle({ default: { limit: 10, ttl: 60000 } })
@ApiOperation({
summary: 'Remove interest from profile',
description: 'Delete specific interest from user profile',
})
@ApiParam({
name: 'id',
description: 'Profile UUID',
})
@ApiParam({
name: 'interestId',
description: 'Interest UUID',
})
@ApiResponse({
status: 204,
description: 'Interest removed successfully',
})
@ApiResponse({
status: 404,
description: 'Interest not found in profile',
})
async removeInterest(
@Param('id', ParseUUIDPipe) profileId: string,
@Param('interestId', ParseUUIDPipe) interestId: string,
) {
await this.profilesService.removeInterest(profileId, interestId);
}

@Get('interests/all')
@Throttle({ default: { limit: 20, ttl: 60000 } })
@ApiOperation({
summary: 'Get all available interests',
description: 'Retrieve list of all active interests',
})
@ApiResponse({
status: 200,
description: 'Interests retrieved successfully',
})
async getAllInterests() {
return this.profilesService.getAllInterests();
}
}
