import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GroupPostsService } from './groupposts.service';
import { CreateGroupPostRequestDto } from './dtos/create-group-post-request.dto';
import { UpdateGroupPostRequestDto } from './dtos/update-group-post-request.dto';
import { GroupPostQueryDto } from './dtos/group-post-query.dto';
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

@ApiTags('group-posts')
@Controller('groups/:groupId/posts')
export class GroupPostsController {
  constructor(private readonly groupPostsService: GroupPostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a post in a group' })
  @ApiResponse({ status: 201, description: 'Post created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'No permission to post' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  @ApiParam({ name: 'groupId', type: String })
  createPost(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @CurrentUser('id') userId: string,
    @Body() createGroupPostRequestDto: CreateGroupPostRequestDto,
  ) {
    return this.groupPostsService.createPost(groupId, userId, createGroupPostRequestDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all posts in a group' })
  @ApiResponse({ status: 200, description: 'Posts retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  @ApiParam({ name: 'groupId', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  getGroupPosts(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Query() query: GroupPostQueryDto,
    @CurrentUser('id') currentUserId?: string,
  ) {
    return this.groupPostsService.getGroupPosts(groupId, query, currentUserId);
  }

  @Post(':postId/pin')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Pin a post in a group' })
  @ApiResponse({ status: 200, description: 'Post pinned successfully' })
  @ApiParam({ name: 'groupId', type: String })
  getPinnedPosts(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @CurrentUser('id') currentUserId?: string,
  ) {
    return this.groupPostsService.getPinnedPosts(groupId, currentUserId);
  }

  @Get(':postId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a single post' })
  @ApiResponse({ status: 200, description: 'Post retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiParam({ name: 'groupId', type: String })
  @ApiParam({ name: 'postId', type: String })
  getPost(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('postId', ParseUUIDPipe) postId: string,
    @CurrentUser('id') currentUserId?: string,
  ) {
    return this.groupPostsService.findOne(groupId, postId, currentUserId);
  }

  @Patch(':postId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a post' })
  @ApiResponse({ status: 200, description: 'Post updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Can only edit own posts' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiParam({ name: 'groupId', type: String })
  @ApiParam({ name: 'postId', type: String })
  updatePost(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('postId', ParseUUIDPipe) postId: string,
    @CurrentUser('id') userId: string,
    @Body() updateGroupPostRequestDto: UpdateGroupPostRequestDto,
  ) {
    return this.groupPostsService.updatePost(groupId, postId, userId, updateGroupPostRequestDto);
  }

  @Delete(':postId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a post' })
  @ApiResponse({ status: 204, description: 'Post deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'No permission to delete' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiParam({ name: 'groupId', type: String })
  @ApiParam({ name: 'postId', type: String })
  deletePost(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('postId', ParseUUIDPipe) postId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.groupPostsService.deletePost(groupId, postId, userId);
  }

  @Post(':postId/pin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pin a post (admin/moderator only)' })
  @ApiResponse({ status: 200, description: 'Post pinned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only admin/moderator can pin' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiParam({ name: 'groupId', type: String })
  @ApiParam({ name: 'postId', type: String })
  pinPost(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('postId', ParseUUIDPipe) postId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.groupPostsService.pinPost(groupId, postId, userId);
  }

  @Delete(':postId/pin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unpin a post (admin/moderator only)' })
  @ApiResponse({ status: 200, description: 'Post unpinned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only admin/moderator can unpin' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiParam({ name: 'groupId', type: String })
  @ApiParam({ name: 'postId', type: String })
  unpinPost(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('postId', ParseUUIDPipe) postId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.groupPostsService.unpinPost(groupId, postId, userId);
  }

  @Get(':postId/stats')
  @ApiOperation({ summary: 'Get post statistics' })
  @ApiResponse({ status: 200, description: 'Stats retrieved successfully' })
  @ApiParam({ name: 'groupId', type: String })
  @ApiParam({ name: 'postId', type: String })
  getPostStats(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('postId', ParseUUIDPipe) postId: string,
  ) {
    return this.groupPostsService.getPostStats(groupId, postId);
  }
}
