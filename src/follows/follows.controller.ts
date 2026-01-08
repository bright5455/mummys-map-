import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FollowsService } from './follows.service';
import { FollowUserDto } from './dtos/follow-user.dto';
import { BlockUserDto } from './dtos/block-user.dto';
import { UpdateFollowDto } from './dtos/update-follow.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('follows')
@Controller('follows')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post('follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Follow a user' })
  @ApiResponse({ status: 200, description: 'User followed successfully' })
  @ApiResponse({ status: 400, description: 'Already following or invalid request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'User is blocked' })
  @ApiResponse({ status: 404, description: 'User not found' })
  followUser(
    @CurrentUser('id') userId: string,
    @Body() followUserDto: FollowUserDto,
  ) {
    return this.followsService.followUser(userId, followUserDto);
  }

  @Delete('unfollow/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiResponse({ status: 200, description: 'User unfollowed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not following this user' })
  @ApiParam({ name: 'userId', type: String })
  unfollowUser(
    @CurrentUser('id') currentUserId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.followsService.unfollowUser(currentUserId, userId);
  }

  @Get('requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pending follow requests' })
  @ApiResponse({ status: 200, description: 'Follow requests retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getFollowRequests(
    @CurrentUser('id') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.followsService.getFollowRequests(userId, page, limit);
  }

  @Post('requests/:userId/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept a follow request' })
  @ApiResponse({ status: 200, description: 'Follow request accepted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Follow request not found' })
  @ApiParam({ name: 'userId', type: String })
  acceptFollowRequest(
    @CurrentUser('id') currentUserId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.followsService.acceptFollowRequest(currentUserId, userId);
  }

  @Post('requests/:userId/reject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a follow request' })
  @ApiResponse({ status: 200, description: 'Follow request rejected' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Follow request not found' })
  @ApiParam({ name: 'userId', type: String })
  rejectFollowRequest(
    @CurrentUser('id') currentUserId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.followsService.rejectFollowRequest(currentUserId, userId);
  }


  @Get('followers/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get user's followers" })
  @ApiResponse({ status: 200, description: 'Followers retrieved successfully' })
  @ApiParam({ name: 'userId', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getFollowers(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @CurrentUser('id') currentUserId?: string,
  ) {
    return this.followsService.getFollowers(userId, page, limit, currentUserId);
  }

  @Get('following/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get users that a user is following" })
  @ApiResponse({ status: 200, description: 'Following list retrieved successfully' })
  @ApiParam({ name: 'userId', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getFollowing(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @CurrentUser('id') currentUserId?: string,
  ) {
    return this.followsService.getFollowing(userId, page, limit, currentUserId);
  }

  @Get('mutual/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get mutual follows with another user' })
  @ApiResponse({ status: 200, description: 'Mutual follows retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ name: 'userId', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMutualFollows(
    @CurrentUser('id') currentUserId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.followsService.getMutualFollows(currentUserId, userId, page, limit);
  }

  
  @Get('stats/:userId')
  @ApiOperation({ summary: "Get user's follow statistics" })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiParam({ name: 'userId', type: String })
  getFollowStats(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.followsService.getFollowStats(userId);
  }

 
  @Get('suggestions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get suggested users to follow' })
  @ApiResponse({ status: 200, description: 'Suggestions retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getSuggestedUsers(
    @CurrentUser('id') userId: string,
    @Query('limit') limit: number = 10,
  ) {
    return this.followsService.getSuggestedUsers(userId);
  }

  @Patch('settings/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update follow settings (mute, notifications)' })
  @ApiResponse({ status: 200, description: 'Follow settings updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Follow relationship not found' })
  @ApiParam({ name: 'userId', type: String })
  updateFollow(
    @CurrentUser('id') currentUserId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() updateFollowDto: UpdateFollowDto,
  ) {
    return this.followsService.updateFollow(currentUserId, userId, updateFollowDto);
  }

  @Get('status/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get follow status with a user' })
  @ApiResponse({ status: 200, description: 'Follow status retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ name: 'userId', type: String })
  getFollowStatus(
    @CurrentUser('id') currentUserId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.followsService.getFollowStatus(currentUserId, userId);
  }

  @Post('block')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Block a user' })
  @ApiResponse({ status: 200, description: 'User blocked successfully' })
  @ApiResponse({ status: 400, description: 'Already blocked or invalid request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  blockUser(
    @CurrentUser('id') userId: string,
    @Body() blockUserDto: BlockUserDto,
  ) {
    return this.followsService.blockUser(userId, blockUserDto);
  }

  @Delete('unblock/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unblock a user' })
  @ApiResponse({ status: 200, description: 'User unblocked successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User is not blocked' })
  @ApiParam({ name: 'userId', type: String })
  unblockUser(
    @CurrentUser('id') currentUserId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.followsService.unblockUser(currentUserId, userId);
  }

  @Get('blocked')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get blocked users' })
  @ApiResponse({ status: 200, description: 'Blocked users retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getBlockedUsers(
    @CurrentUser('id') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.followsService.getBlockedUsers(userId, page, limit);
  }
}