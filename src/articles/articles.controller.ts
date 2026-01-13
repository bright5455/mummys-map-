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
  Req,
  Ip,
  Headers,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ArticlesService } from './articles.service';
import {
  CreateArticleDto,
  UpdateArticleDto,
  CreateArticleCommentDto,
  UpdateArticleCommentDto,
  QueryArticlesDto,
  QueryCommentsDto,
  TrackArticleViewDto,
  ShareArticleDto,
} from '../articles/dtos/article.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Articles')
@Controller('articles')
@Throttle({ default: { limit: 100, ttl: 60000 } })
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Create a new article' })
  @ApiResponse({ status: 201, description: 'Article created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() createArticleDto: CreateArticleDto,
  ) {
    return await this.articlesService.create(userId, createArticleDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Get all articles' })
  @ApiResponse({ status: 200, description: 'Articles retrieved successfully' })
  async findAll(
    @Query() query: QueryArticlesDto,
    @CurrentUser('id') userId?: string,
  ) {
    return await this.articlesService.findAll(query, userId);
  }

  @Get('my-articles')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Get my articles' })
  @ApiResponse({ status: 200, description: 'My articles retrieved successfully' })
  async getMyArticles(
    @CurrentUser('id') userId: string,
    @Query() query: QueryArticlesDto,
  ) {
    return await this.articlesService.findAll({ ...query, authorId: userId }, userId);
  }

  @Get('bookmarks')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Get bookmarked articles' })
  @ApiResponse({ status: 200, description: 'Bookmarks retrieved successfully' })
  async getBookmarks(
    @CurrentUser('id') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return await this.articlesService.getUserBookmarks(userId, page, limit);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Get article by ID or slug' })
  @ApiResponse({ status: 200, description: 'Article retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId?: string,
  ) {
    return await this.articlesService.findOne(id, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Update article' })
  @ApiResponse({ status: 200, description: 'Article updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateArticleDto: UpdateArticleDto,
  ) {
    return await this.articlesService.update(id, userId, updateArticleDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Delete article' })
  @ApiResponse({ status: 200, description: 'Article deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return await this.articlesService.remove(id, userId);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Like or unlike an article' })
  @ApiResponse({ status: 200, description: 'Article like toggled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async likeArticle(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return await this.articlesService.likeArticle(id, userId);
  }

  @Post(':id/bookmark')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Bookmark or unbookmark an article' })
  @ApiResponse({ status: 200, description: 'Article bookmark toggled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async bookmarkArticle(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('collectionName') collectionName?: string,
  ) {
    return await this.articlesService.bookmarkArticle(id, userId, collectionName);
  }

  @Post(':id/view')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Track article view' })
  @ApiResponse({ status: 200, description: 'View tracked successfully' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async trackView(
    @Param('id') id: string,
    @CurrentUser('id') userId: string | null,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
    @Body() dto?: TrackArticleViewDto,
  ) {
    return await this.articlesService.trackView(id, userId, ip, userAgent, dto);
  }

  @Post(':id/share')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Track article share' })
  @ApiResponse({ status: 200, description: 'Share tracked successfully' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async shareArticle(
    @Param('id') id: string,
    @CurrentUser('id') userId: string | null,
    @Body() dto: ShareArticleDto,
  ) {
    return await this.articlesService.shareArticle(id, userId, dto);
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Create a comment on an article' })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Comments disabled' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async createComment(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() createCommentDto: CreateArticleCommentDto,
  ) {
    return await this.articlesService.createComment(id, userId, createCommentDto);
  }

  @Get(':id/comments')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Get comments for an article' })
  @ApiResponse({ status: 200, description: 'Comments retrieved successfully' })
  async getComments(
    @Param('id') id: string,
    @Query() query: QueryCommentsDto,
    @CurrentUser('id') userId?: string,
  ) {
    return await this.articlesService.findComments(id, query, userId);
  }

  @Patch('comments/:commentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Update a comment' })
  @ApiResponse({ status: 200, description: 'Comment updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async updateComment(
    @Param('commentId') commentId: string,
    @CurrentUser('id') userId: string,
    @Body() updateCommentDto: UpdateArticleCommentDto,
  ) {
    return await this.articlesService.updateComment(commentId, userId, updateCommentDto);
  }

  @Delete('comments/:commentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiResponse({ status: 200, description: 'Comment deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async deleteComment(
    @Param('commentId') commentId: string,
    @CurrentUser('id') userId: string,
  ) {
    return await this.articlesService.deleteComment(commentId, userId);
  }

  @Post('comments/:commentId/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Like or unlike a comment' })
  @ApiResponse({ status: 200, description: 'Comment like toggled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async likeComment(
    @Param('commentId') commentId: string,
    @CurrentUser('id') userId: string,
  ) {
    return await this.articlesService.likeComment(commentId, userId);
  }
}