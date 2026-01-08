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
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { UploadMediaDto } from './dtos/upload-media.dto';
import { UpdateMediaDto } from './dtos/update-media.dto';
import { MediaQueryDto } from './dtos/media-query.dto';
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

@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a single media file' })
  @ApiResponse({ status: 201, description: 'Media uploaded successfully' })
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
        context: {
          type: 'string',
          enum: [
            'post',
            'comment',
            'profile_picture',
            'cover_photo',
            'article',
            'product',
            'story',
            'message',
            'group',
            'tracking',
            'medical_record',
            'prescription',
            'document',
            'other',
          ],
        },
        contextId: { type: 'string' },
        altText: { type: 'string' },
        caption: { type: 'string' },
        isPublic: { type: 'boolean' },
        displayOrder: { type: 'number' },
      },
    },
  })
  async uploadSingle(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadMediaDto: UploadMediaDto,
  ) {
    return this.mediaService.uploadSingle(userId, file, uploadMediaDto);
  }

  @Post('upload/multiple')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload multiple media files (max 10)' })
  @ApiResponse({ status: 201, description: 'Media uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid files or bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        context: { type: 'string' },
        contextId: { type: 'string' },
        isPublic: { type: 'boolean' },
      },
    },
  })
  async uploadMultiple(
    @CurrentUser('id') userId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() uploadMediaDto: UploadMediaDto,
  ) {
    return this.mediaService.uploadMultiple(userId, files, uploadMediaDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get media with filters' })
  @ApiResponse({ status: 200, description: 'Media retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'mediaType', required: false, enum: ['image', 'video', 'audio', 'document', 'other'] })
  @ApiQuery({ name: 'context', required: false, type: String })
  @ApiQuery({ name: 'contextId', required: false, type: String })
  @ApiQuery({ name: 'isPublic', required: false, type: Boolean })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  findAll(@Query() query: MediaQueryDto) {
    return this.mediaService.findAll(query);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all media uploaded by a specific user' })
  @ApiResponse({ status: 200, description: 'User media retrieved successfully' })
  @ApiParam({ name: 'userId', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getUserMedia(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.mediaService.getUserMedia(userId, page, limit);
  }

  @Get('context/:context/:contextId')
  @ApiOperation({ summary: 'Get media by context (e.g., all images for a post)' })
  @ApiResponse({ status: 200, description: 'Context media retrieved successfully' })
  @ApiParam({ name: 'context', type: String })
  @ApiParam({ name: 'contextId', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMediaByContext(
    @Param('context') context: string,
    @Param('contextId', ParseUUIDPipe) contextId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.mediaService.getMediaByContext(context, contextId, page, limit);
  }

  @Get('stats/storage')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get user's storage statistics" })
  @ApiResponse({ status: 200, description: 'Storage stats retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getStorageStats(@CurrentUser('id') userId: string) {
    return this.mediaService.getStorageStats(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a single media by ID' })
  @ApiResponse({ status: 200, description: 'Media retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Access denied to private media' })
  @ApiResponse({ status: 404, description: 'Media not found' })
  @ApiParam({ name: 'id', type: String })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.mediaService.findOne(id, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update media metadata' })
  @ApiResponse({ status: 200, description: 'Media updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Media not found' })
  @ApiParam({ name: 'id', type: String })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() updateMediaDto: UpdateMediaDto,
  ) {
    return this.mediaService.update(id, userId, updateMediaDto);
  }

  @Patch('bulk/reorder')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bulk update display order of media',
    description: 'Useful for reordering images in galleries',
  })
  @ApiResponse({ status: 200, description: 'Display orders updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        updates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              displayOrder: { type: 'number' },
            },
          },
        },
      },
    },
  })
  bulkUpdateOrder(
    @CurrentUser('id') userId: string,
    @Body() body: { updates: Array<{ id: string; displayOrder: number }> },
  ) {
    return this.mediaService.bulkUpdateOrder(userId, body.updates);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a media file' })
  @ApiResponse({ status: 204, description: 'Media deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Media not found' })
  @ApiParam({ name: 'id', type: String })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.mediaService.remove(id, userId);
  }

  @Post('bulk/delete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk delete multiple media files' })
  @ApiResponse({ status: 200, description: 'Media deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        mediaIds: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  })
  bulkDelete(
    @CurrentUser('id') userId: string,
    @Body() body: { mediaIds: string[] },
  ) {
    return this.mediaService.bulkDelete(userId, body.mediaIds);
  }
}
