import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseEnumPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LikesService } from './likes.service';
import { CreateLikeDto } from './dtos/create-like.dto';
import { LikeQueryDto } from './dtos/like-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LikeableType } from 'src/enums/likeable-type.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('likes')
@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Like any content (post, comment, article, etc.)' })
  @ApiResponse({ status: 200, description: 'Content liked successfully' })
  @ApiResponse({ status: 400, description: 'Content already liked' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({ type: CreateLikeDto })
  likeContent(
    @CurrentUser('id') userId: string,
    @Body() createLikeDto: CreateLikeDto,
  ) {
    return this.likesService.likeContent(userId, createLikeDto);
  }

  @Delete(':likeableType/:likeableId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unlike content' })
  @ApiResponse({ status: 200, description: 'Content unliked successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Like not found' })
  @ApiParam({
    name: 'likeableType',
    enum: LikeableType,
    description: 'Type of content',
  })
  @ApiParam({ name: 'likeableId', type: String, description: 'Content ID' })
  unlikeContent(
    @CurrentUser('id') userId: string,
    @Param('likeableType', new ParseEnumPipe(LikeableType))
    likeableType: LikeableType,
    @Param('likeableId', ParseUUIDPipe) likeableId: string,
  ) {
    return this.likesService.unlikeContent(userId, likeableType, likeableId);
  }


  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get likes with filters' })
  @ApiResponse({ status: 200, description: 'Likes retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'likeableType', required: false, enum: LikeableType })
  @ApiQuery({ name: 'likeableId', required: false, type: String })
  findAll(@Query() query: LikeQueryDto) {
    return this.likesService.findAll(query);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: "Get all likes by a specific user" })
  @ApiResponse({ status: 200, description: 'User likes retrieved successfully' })
  @ApiParam({ name: 'userId', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getUserLikes(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.likesService.getUserLikes(userId, page, limit);
  }

  @Get('user/:userId/:likeableType')
  @ApiOperation({ summary: "Get user's likes by content type" })
  @ApiResponse({
    status: 200,
    description: 'User likes by type retrieved successfully',
  })
  @ApiParam({ name: 'userId', type: String })
  @ApiParam({ name: 'likeableType', enum: LikeableType })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getUserLikesByType(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('likeableType', new ParseEnumPipe(LikeableType))
    likeableType: LikeableType,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.likesService.getUserLikesByType(
      userId,
      likeableType,
      page,
      limit,
    );
  }

  @Get('content/:likeableType/:likeableId')
  @ApiOperation({ summary: 'Get all likes for specific content' })
  @ApiResponse({
    status: 200,
    description: 'Content likes retrieved successfully',
  })
  @ApiParam({ name: 'likeableType', enum: LikeableType })
  @ApiParam({ name: 'likeableId', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getContentLikes(
    @Param('likeableType', new ParseEnumPipe(LikeableType))
    likeableType: LikeableType,
    @Param('likeableId', ParseUUIDPipe) likeableId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.likesService.getContentLikes(
      likeableType,
      likeableId,
      page,
      limit,
    );
  }

  @Get('content/:likeableType/:likeableId/count')
  @ApiOperation({ summary: 'Get like count for specific content' })
  @ApiResponse({ status: 200, description: 'Like count retrieved successfully' })
  @ApiParam({ name: 'likeableType', enum: LikeableType })
  @ApiParam({ name: 'likeableId', type: String })
  async getLikesCount(
    @Param('likeableType', new ParseEnumPipe(LikeableType))
    likeableType: LikeableType,
    @Param('likeableId', ParseUUIDPipe) likeableId: string,
  ) {
    const count = await this.likesService.getLikesCount(
      likeableType,
      likeableId,
    );
    return { count };
  }

  @Get('content/:likeableType/:likeableId/check')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if current user has liked content' })
  @ApiResponse({ status: 200, description: 'Like status retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ name: 'likeableType', enum: LikeableType })
  @ApiParam({ name: 'likeableId', type: String })
  async checkUserLiked(
    @CurrentUser('id') userId: string,
    @Param('likeableType', new ParseEnumPipe(LikeableType))
    likeableType: LikeableType,
    @Param('likeableId', ParseUUIDPipe) likeableId: string,
  ) {
    const isLiked = await this.likesService.hasUserLiked(
      userId,
      likeableType,
      likeableId,
    );
    return { isLiked };
  }

  @Get('stats/user/:userId')
  @ApiOperation({ summary: "Get user's like statistics" })
  @ApiResponse({
    status: 200,
    description: 'User like statistics retrieved successfully',
  })
  @ApiParam({ name: 'userId', type: String })
  getUserLikesStats(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.likesService.getUserLikesStats(userId);
  }

  @Get('stats/trending/:likeableType')
  @ApiOperation({ summary: 'Get most liked content by type' })
  @ApiResponse({
    status: 200,
    description: 'Trending content retrieved successfully',
  })
  @ApiParam({ name: 'likeableType', enum: LikeableType })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  getMostLikedContent(
    @Param('likeableType', new ParseEnumPipe(LikeableType))
    likeableType: LikeableType,
    @Query('limit') limit: number = 10,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
  ) {
    return this.likesService.getMostLikedContent(
      likeableType,
      limit,
      startDate,
      endDate,
    );
  }

  @Get('received/:contentOwnerId')
  @ApiOperation({ summary: 'Get likes received by content owner' })
  @ApiResponse({
    status: 200,
    description: 'Likes received retrieved successfully',
  })
  @ApiParam({ name: 'contentOwnerId', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getContentOwnerLikesReceived(
    @Param('contentOwnerId', ParseUUIDPipe) contentOwnerId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.likesService.getContentOwnerLikesReceived(
      contentOwnerId,
      page,
      limit,
    );
  }

  @Post('bulk-check')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bulk check if user has liked multiple items',
    description:
      'Useful for checking like status of multiple posts/comments at once',
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk check completed successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  bulkCheckLikes(
    @CurrentUser('id') userId: string,
    @Body()
    body: {
      items: Array<{ likeableType: LikeableType; likeableId: string }>;
    },
  ) {
    return this.likesService.bulkCheckLikes(userId, body.items);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single like by ID' })
  @ApiResponse({ status: 200, description: 'Like retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Like not found' })
  @ApiParam({ name: 'id', type: String })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.likesService.findOne(id);
  }
}