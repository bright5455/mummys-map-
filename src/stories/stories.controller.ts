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
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StoriesService } from './stories.service';
import { CreateStoryDto } from './dtos/create-story.dto';
import { ReplyStoryDto } from './dtos/reply-story.dto';
import { CreateHighlightDto } from './dtos/create-highlight.dto';
import { UpdateHighlightDto } from './dtos/update-highlight.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('stories')
@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new story' })
  @ApiResponse({ status: 201, description: 'Story created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        caption: { type: 'string' },
        textOverlay: { type: 'string' },
        backgroundColor: { type: 'string' },
        privacy: {
          type: 'string',
          enum: ['public', 'followers', 'close_friends', 'custom'],
        },
        allowReplies: { type: 'boolean' },
        showViewers: { type: 'boolean' },
        expiresInHours: { type: 'number' },
      },
    },
  })
  createStory(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() createStoryDto: CreateStoryDto,
  ) {
    return this.storiesService.createStory(userId, file, createStoryDto);
  }

  @Get('active')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users with active stories' })
  @ApiResponse({ status: 200, description: 'Active stories retrieved successfully' })
  getActiveStories(@CurrentUser('id') currentUserId?: string) {
    return this.storiesService.getActiveStories(currentUserId);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get a user's active stories" })
  @ApiResponse({ status: 200, description: 'User stories retrieved successfully' })
  @ApiResponse({ status: 404, description: 'No active stories found' })
  @ApiParam({ name: 'userId', type: String })
  getUserStories(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser('id') currentUserId?: string,
  ) {
    return this.storiesService.getUserStories(userId, currentUserId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a single story by ID' })
  @ApiResponse({ status: 200, description: 'Story retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Story not found or expired' })
  @ApiParam({ name: 'id', type: String })
  getStory(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') currentUserId?: string,
  ) {
    return this.storiesService.getStory(id, currentUserId);
  }

  @Post(':id/view')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark story as viewed' })
  @ApiResponse({ status: 200, description: 'Story viewed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Story not found or expired' })
  @ApiParam({ name: 'id', type: String })
  viewStory(
    @Param('id', ParseUUIDPipe) storyId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.storiesService.viewStory(storyId, userId);
  }

  @Get(':id/viewers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get story viewers (story owner only)' })
  @ApiResponse({ status: 200, description: 'Viewers retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only story owner can see viewers' })
  @ApiResponse({ status: 404, description: 'Story not found' })
  @ApiParam({ name: 'id', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getStoryViewers(
    @Param('id', ParseUUIDPipe) storyId: string,
    @CurrentUser('id') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    return this.storiesService.getStoryViewers(storyId, userId, page, limit);
  }

  @Post(':id/reply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reply to a story' })
  @ApiResponse({ status: 200, description: 'Reply sent successfully' })
  @ApiResponse({ status: 400, description: 'Cannot reply to expired story' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Replies not allowed' })
  @ApiResponse({ status: 404, description: 'Story not found' })
  @ApiParam({ name: 'id', type: String })
  replyToStory(
    @Param('id', ParseUUIDPipe) storyId: string,
    @CurrentUser('id') userId: string,
    @Body() replyStoryDto: ReplyStoryDto,
  ) {
    return this.storiesService.replyToStory(storyId, userId, replyStoryDto);
  }

  @Get(':id/replies')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get story replies (story owner only)' })
  @ApiResponse({ status: 200, description: 'Replies retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only story owner can see replies' })
  @ApiResponse({ status: 404, description: 'Story not found' })
  @ApiParam({ name: 'id', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getStoryReplies(
    @Param('id', ParseUUIDPipe) storyId: string,
    @CurrentUser('id') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    return this.storiesService.getStoryReplies(storyId, userId, page, limit);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a story' })
  @ApiResponse({ status: 204, description: 'Story deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Can only delete own stories' })
  @ApiResponse({ status: 404, description: 'Story not found' })
  @ApiParam({ name: 'id', type: String })
  deleteStory(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.storiesService.deleteStory(id, userId);
  }

  @Post('highlights')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a story highlight' })
  @ApiResponse({ status: 201, description: 'Highlight created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  createHighlight(
    @CurrentUser('id') userId: string,
    @Body() createHighlightDto: CreateHighlightDto,
  ) {
    return this.storiesService.createHighlight(userId, createHighlightDto);
  }

  @Post('highlights/:highlightId/stories/:storyId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add story to highlight' })
  @ApiResponse({ status: 200, description: 'Story added to highlight successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Story or highlight not found' })
  @ApiParam({ name: 'highlightId', type: String })
  @ApiParam({ name: 'storyId', type: String })
  addStoryToHighlight(
    @Param('highlightId', ParseUUIDPipe) highlightId: string,
    @Param('storyId', ParseUUIDPipe) storyId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.storiesService.addStoryToHighlight(storyId, highlightId, userId);
  }

  @Delete('highlights/stories/:storyId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove story from highlight' })
  @ApiResponse({ status: 200, description: 'Story removed from highlight successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Story not found' })
  @ApiParam({ name: 'storyId', type: String })
  removeStoryFromHighlight(
    @Param('storyId', ParseUUIDPipe) storyId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.storiesService.removeStoryFromHighlight(storyId, userId);
  }

  @Get('highlights/user/:userId')
  @ApiOperation({ summary: "Get user's story highlights" })
  @ApiResponse({ status: 200, description: 'Highlights retrieved successfully' })
  @ApiParam({ name: 'userId', type: String })
  getUserHighlights(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.storiesService.getUserHighlights(userId);
  }

  @Get('highlights/:highlightId/stories')
  @ApiOperation({ summary: 'Get stories in a highlight' })
  @ApiResponse({ status: 200, description: 'Highlight stories retrieved successfully' })
  @ApiParam({ name: 'highlightId', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getHighlightStories(
    @Param('highlightId', ParseUUIDPipe) highlightId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    return this.storiesService.getHighlightStories(highlightId, page, limit);
  }

  @Patch('highlights/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a highlight' })
  @ApiResponse({ status: 200, description: 'Highlight updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Highlight not found' })
  @ApiParam({ name: 'id', type: String })
  updateHighlight(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() updateHighlightDto: UpdateHighlightDto,
  ) {
    return this.storiesService.updateHighlight(id, userId, updateHighlightDto);
  }

  @Delete('highlights/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a highlight' })
  @ApiResponse({ status: 200, description: 'Highlight deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Highlight not found' })
  @ApiParam({ name: 'id', type: String })
  deleteHighlight(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.storiesService.deleteHighlight(id, userId);
  }
}