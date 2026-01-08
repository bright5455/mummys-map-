import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Media } from './entities/media.entity';
import { UploadMediaDto } from './dtos/upload-media.dto';
import { UpdateMediaDto } from './dtos/update-media.dto';
import { MediaQueryDto } from './dtos/media-query.dto';
import { MediaType } from 'src/enums/media-type.enum';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly uploadPath: string;
  private readonly maxFileSize: number;
  private readonly allowedImageTypes: string[];
  private readonly allowedVideoTypes: string[];
  private readonly allowedDocumentTypes: string[];

  constructor(
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    private readonly configService: ConfigService,
  ) {
    this.uploadPath = this.configService.get<string>('UPLOAD_PATH') || './uploads';
    this.maxFileSize = this.configService.get<number>('MAX_FILE_SIZE') || 10 * 1024 * 1024; // 10MB
    this.allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    this.allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm'];
    this.allowedDocumentTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory() {
    try {
      await fs.access(this.uploadPath);
    } catch {
      await fs.mkdir(this.uploadPath, { recursive: true });
      this.logger.log(`Created upload directory: ${this.uploadPath}`);
    }
  }

  
  async uploadSingle(
    userId: string,
    file: Express.Multer.File,
    uploadMediaDto: UploadMediaDto,
  ): Promise<Media> {
    this.validateFile(file);

    const mediaType = this.determineMediaType(file.mimetype);
    const filename = this.generateFilename(file.originalname);
    const filePath = path.join(this.uploadPath, filename);

    
    await fs.writeFile(filePath, file.buffer);

    
    let thumbnailUrl: string | null = null;
    let mediumUrl: string | null = null;
    let smallUrl: string | null = null;
    let width: number | null = null;
    let height: number | null = null;

    if (mediaType === MediaType.IMAGE) {
      const imageInfo = await this.processImage(filePath, filename);
      thumbnailUrl = imageInfo.thumbnailUrl;
      mediumUrl = imageInfo.mediumUrl;
      smallUrl = imageInfo.smallUrl;
      width = imageInfo.width;
      height = imageInfo.height;
    }

    const media = this.mediaRepository.create({
      userId,
      originalName: file.originalname,
      filename,
      url: this.getFileUrl(filename),
      thumbnailUrl,
      mediumUrl,
      smallUrl,
      mediaType,
      context: uploadMediaDto.context || null,
      contextId: uploadMediaDto.contextId || null,
      fileSize: file.size, 
      mimeType: file.mimetype,
      width,
      height,
      duration: null,
      aspectRatio: null,
      storageProvider: 'local',
      publicId: null,
      bucket: null,
      metadata: {
        uploadedAt: new Date().toISOString(),
      },
      altText: uploadMediaDto.altText || null,
      caption: uploadMediaDto.caption || null,
      isPublic: uploadMediaDto.isPublic ?? false,
      isActive: true,
      displayOrder: uploadMediaDto.displayOrder ?? 0,
    });

    
    const savedMedia = await this.mediaRepository.save(media);

    this.logger.log(`Media uploaded: ${savedMedia.id} by user: ${userId}`);

    return savedMedia;
  }

  async uploadMultiple(
    userId: string,
    files: Express.Multer.File[],
    uploadMediaDto: UploadMediaDto,
  ): Promise<Media[]> {
    const uploadPromises = files.map((file, index) =>
      this.uploadSingle(userId, file, {
        ...uploadMediaDto,
        displayOrder: uploadMediaDto.displayOrder ?? index,
      }),
    );

    return Promise.all(uploadPromises);
  }


  private async processImage(
    filePath: string,
    filename: string,
  ): Promise<{
    thumbnailUrl: string;
    mediumUrl: string;
    smallUrl: string;
    width: number;
    height: number;
  }> {
    const image = sharp(filePath);
    const metadata = await image.metadata();

    const baseFilename = path.parse(filename).name;
    const ext = path.parse(filename).ext;

    
    const thumbnailFilename = `${baseFilename}_thumb${ext}`;
    const thumbnailPath = path.join(this.uploadPath, thumbnailFilename);
    await image
      .clone()
      .resize(150, 150, { fit: 'cover' })
      .toFile(thumbnailPath);

    
    const smallFilename = `${baseFilename}_small${ext}`;
    const smallPath = path.join(this.uploadPath, smallFilename);
    await image
      .clone()
      .resize(300, null, { withoutEnlargement: true })
      .toFile(smallPath);

    
    const mediumFilename = `${baseFilename}_medium${ext}`;
    const mediumPath = path.join(this.uploadPath, mediumFilename);
    await image
      .clone()
      .resize(800, null, { withoutEnlargement: true })
      .toFile(mediumPath);

    return {
      thumbnailUrl: this.getFileUrl(thumbnailFilename),
      mediumUrl: this.getFileUrl(mediumFilename),
      smallUrl: this.getFileUrl(smallFilename),
      width: metadata.width!,
      height: metadata.height!,
    };
  }

  async findAll(query: MediaQueryDto) {
    const {
      page = 1,
      limit = 20,
      userId,
      mediaType,
      context,
      contextId,
      isPublic,
      isActive,
    } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.mediaRepository
      .createQueryBuilder('media')
      .leftJoinAndSelect('media.user', 'user')
      .where('media.deletedAt IS NULL');

    if (userId) {
      queryBuilder.andWhere('media.userId = :userId', { userId });
    }

    if (mediaType) {
      queryBuilder.andWhere('media.mediaType = :mediaType', { mediaType });
    }

    if (context) {
      queryBuilder.andWhere('media.context = :context', { context });
    }

    if (contextId) {
      queryBuilder.andWhere('media.contextId = :contextId', { contextId });
    }

    if (isPublic !== undefined) {
      queryBuilder.andWhere('media.isPublic = :isPublic', { isPublic });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('media.isActive = :isActive', { isActive });
    }

    queryBuilder
      .orderBy('media.displayOrder', 'ASC')
      .addOrderBy('media.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [media, total] = await queryBuilder.getManyAndCount();

    return {
      data: media,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId?: string): Promise<Media> {
    const media = await this.mediaRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['user'],
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    
    if (!media.isPublic && userId && media.userId !== userId) {
      throw new ForbiddenException('You do not have access to this media');
    }

    return media;
  }

  async getUserMedia(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    return this.findAll({ page, limit, userId });
  }

  async getMediaByContext(
    context: string,
    contextId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    return this.findAll({ page, limit, context: context as any, contextId });
  }

  async update(
    id: string,
    userId: string,
    updateMediaDto: UpdateMediaDto,
  ): Promise<Media> {
    const media = await this.mediaRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    if (media.userId !== userId) {
      throw new ForbiddenException('You can only update your own media');
    }

    Object.assign(media, updateMediaDto);

    await this.mediaRepository.save(media);

    this.logger.log(`Media updated: ${id}`);

    return this.findOne(id, userId);
  }

  async bulkUpdateOrder(
    userId: string,
    updates: Array<{ id: string; displayOrder: number }>,
  ): Promise<{ message: string }> {
    const mediaIds = updates.map((u) => u.id);

    const media = await this.mediaRepository.find({
      where: { 
        id: In(mediaIds),
        userId,
        deletedAt: IsNull() 
      },
      select: ['id'],
    });

    const userMediaIds = new Set(media.map((m) => m.id));
    const invalidIds = mediaIds.filter((id) => !userMediaIds.has(id));

    if (invalidIds.length > 0) {
      throw new ForbiddenException(
        'You can only update your own media',
      );
    }

    const updatePromises = updates.map((update) =>
      this.mediaRepository.update(
        { id: update.id },
        { displayOrder: update.displayOrder },
      ),
    );

    await Promise.all(updatePromises);

    this.logger.log(`Bulk updated ${updates.length} media display orders`);

    return { message: 'Display orders updated successfully' };
  }

  async remove(id: string, userId: string): Promise<void> {
    const media = await this.mediaRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    if (media.userId !== userId) {
      throw new ForbiddenException('You can only delete your own media');
    }

    media.deletedAt = new Date();
    await this.mediaRepository.save(media);

    this.logger.log(`Media deleted: ${id}`);
  }

  async bulkDelete(
    userId: string,
    mediaIds: string[],
  ): Promise<{ message: string; deleted: number }> {
    const media = await this.mediaRepository.find({
      where: { 
        id: In(mediaIds),
        userId,
        deletedAt: IsNull() 
      },
      select: ['id'],
    });

    const validIds = media.map((m) => m.id);

    if (validIds.length === 0) {
      throw new BadRequestException('No valid media IDs to delete');
    }

    await this.mediaRepository.update(
      { id: In(validIds) },
      { deletedAt: new Date() },
    );

    this.logger.log(`Bulk deleted ${validIds.length} media files`);

    return {
      message: 'Media deleted successfully',
      deleted: validIds.length,
    };
  }


  async getStorageStats(userId: string) {
    const result = await this.mediaRepository
      .createQueryBuilder('media')
      .select('SUM(media.fileSize)', 'totalSize')
      .addSelect('COUNT(media.id)', 'totalFiles')
      .addSelect('media.mediaType', 'mediaType')
      .where('media.userId = :userId', { userId })
      .andWhere('media.deletedAt IS NULL')
      .groupBy('media.mediaType')
      .getRawMany();

    const totalSize = await this.mediaRepository
      .createQueryBuilder('media')
      .select('SUM(media.fileSize)', 'total')
      .where('media.userId = :userId', { userId })
      .andWhere('media.deletedAt IS NULL')
      .getRawOne();

    return {
      totalSize: parseInt(totalSize?.total || '0'),
      byType: result.map((r) => ({
        mediaType: r.mediaType,
        totalSize: parseInt(r.totalSize),
        totalFiles: parseInt(r.totalFiles),
      })),
    };
  }

  private validateFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.maxFileSize / (1024 * 1024)}MB`,
      );
    }

    const allAllowedTypes = [
      ...this.allowedImageTypes,
      ...this.allowedVideoTypes,
      ...this.allowedDocumentTypes,
    ];

    if (!allAllowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed`,
      );
    }
  }

  private determineMediaType(mimeType: string): MediaType {
    if (this.allowedImageTypes.includes(mimeType)) {
      return MediaType.IMAGE;
    }
    if (this.allowedVideoTypes.includes(mimeType)) {
      return MediaType.VIDEO;
    }
    if (this.allowedDocumentTypes.includes(mimeType)) {
      return MediaType.DOCUMENT;
    }
    if (mimeType.startsWith('audio/')) {
      return MediaType.AUDIO;
    }
    return MediaType.OTHER;
  }

  private generateFilename(originalName: string): string {
    const ext = path.extname(originalName);
    const uuid = uuidv4();
    const timestamp = Date.now();
    return `${uuid}-${timestamp}${ext}`;
  }

  private getFileUrl(filename: string): string {
    const baseUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3000';
    return `${baseUrl}/uploads/${filename}`;
  }

  private async deletePhysicalFiles(media: Media): Promise<void> {
    try {
      const filePath = path.join(this.uploadPath, media.filename);
      await fs.unlink(filePath);

      if (media.thumbnailUrl) {
        const thumbFilename = path.basename(media.thumbnailUrl);
        await fs.unlink(path.join(this.uploadPath, thumbFilename));
      }

      if (media.mediumUrl) {
        const mediumFilename = path.basename(media.mediumUrl);
        await fs.unlink(path.join(this.uploadPath, mediumFilename));
      }

      if (media.smallUrl) {
        const smallFilename = path.basename(media.smallUrl);
        await fs.unlink(path.join(this.uploadPath, smallFilename));
      }
    } catch (error) {
      this.logger.error(`Error deleting physical files: ${error.message}`);
    }
  }
}