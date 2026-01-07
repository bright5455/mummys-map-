import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dtos/create-comment.dto';
import { UpdateCommentDto } from './dtos/update-comment.dto';
import { CommentQueryDto } from './dtos/comment-query.dto';
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

@ApiTags('comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

 
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new comment or reply' })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Post or parent comment not found' })
  create(
    @CurrentUser('id') userId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentsService.create(userId, createCommentDto);
  }

  

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get comments with filters' })
  @ApiResponse({ status: 200, description: 'Comments retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'postId', required: false, type: String })
  @ApiQuery({ name: 'parentCommentId', required: false, type: String })
  findAll(
    @Query() query: CommentQueryDto,
    @CurrentUser('id') currentUserId?: string,
  ) {
    return this.commentsService.findAll(query, currentUserId);
  }

  @Get('post/:postId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get comments for a specific post' })
  @ApiResponse({ status: 200, description: 'Comments retrieved successfully' })
  @ApiParam({ name: 'postId', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getPostComments(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @CurrentUser('id') currentUserId?: string,
  ) {
    return this.commentsService.getPostComments(
      postId,
      page,
      limit,
      currentUserId,
    );
  }

  @Get(':id/replies')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get replies for a specific comment' })
  @ApiResponse({ status: 200, description: 'Replies retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiParam({ name: 'id', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getCommentReplies(
    @Param('id', ParseUUIDPipe) commentId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @CurrentUser('id') currentUserId?: string,
  ) {
    return this.commentsService.getCommentReplies(
      commentId,
      page,
      limit,
      currentUserId,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a single comment by ID' })
  @ApiResponse({ status: 200, description: 'Comment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiParam({ name: 'id', type: String })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') currentUserId?: string,
  ) {
    return this.commentsService.findOne(id, currentUserId);
  }

  
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a comment' })
  @ApiResponse({ status: 200, description: 'Comment updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiParam({ name: 'id', type: String })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentsService.update(id, userId, updateCommentDto);
  }

  

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiResponse({ status: 204, description: 'Comment deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiParam({ name: 'id', type: String })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.commentsService.remove(id, userId);
  }


  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Like a comment' })
  @ApiResponse({ status: 200, description: 'Comment liked successfully' })
  @ApiResponse({ status: 400, description: 'Comment already liked' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiParam({ name: 'id', type: String })
  likeComment(
    @Param('id', ParseUUIDPipe) commentId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.commentsService.likeComment(commentId, userId);
  }

  @Delete(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unlike a comment' })
  @ApiResponse({ status: 200, description: 'Comment unliked successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Like not found' })
  @ApiParam({ name: 'id', type: String })
  unlikeComment(
    @Param('id', ParseUUIDPipe) commentId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.commentsService.unlikeComment(commentId, userId);
  }

  @Get(':id/likes')
  @ApiOperation({ summary: 'Get users who liked a comment' })
  @ApiResponse({ status: 200, description: 'Likes retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiParam({ name: 'id', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getCommentLikes(
    @Param('id', ParseUUIDPipe) commentId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.commentsService.getCommentLikes(commentId, page, limit);
  }
}