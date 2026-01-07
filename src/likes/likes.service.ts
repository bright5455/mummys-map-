import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from './entities/like.entity';
import { CreateLikeDto } from './dtos/create-like.dto';
import { LikeQueryDto } from './dtos/like-query.dto';
import { LikeableType } from 'src/enums/likeable-type.enum';

@Injectable()
export class LikesService {
  private readonly logger = new Logger(LikesService.name);

  constructor(
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
  ) {}

  async likeContent(userId: string, createLikeDto: CreateLikeDto) {
    const { likeableType, likeableId, contentOwnerId } = createLikeDto;

    const existingLike = await this.likeRepository.findOne({
      where: {
        userId,
        likeableType,
        likeableId,
      },
    });

    if (existingLike) {
      throw new BadRequestException(
        `${this.getContentTypeName(likeableType)} already liked`,
      );
    }

    const like = this.likeRepository.create({
      userId,
      likeableType,
      likeableId,
      contentOwnerId,
    });

    const savedLike = await this.likeRepository.save(like);

    this.logger.log(
      `${this.getContentTypeName(likeableType)} liked: ${likeableId} by user: ${userId}`,
    );

    return {
      message: `${this.getContentTypeName(likeableType)} liked successfully`,
      like: savedLike,
    };
  }

  async unlikeContent(
    userId: string,
    likeableType: LikeableType,
    likeableId: string,
  ) {
    const like = await this.likeRepository.findOne({
      where: {
        userId,
        likeableType,
        likeableId,
      },
    });

    if (!like) {
      throw new NotFoundException('Like not found');
    }

    await this.likeRepository.remove(like);

    this.logger.log(
      `${this.getContentTypeName(likeableType)} unliked: ${likeableId} by user: ${userId}`,
    );

    return {
      message: `${this.getContentTypeName(likeableType)} unliked successfully`,
    };
  }

  async findAll(query: LikeQueryDto) {
    const {
      page = 1,
      limit = 20,
      userId,
      likeableType,
      likeableId,
    } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.likeRepository
      .createQueryBuilder('like')
      .leftJoinAndSelect('like.user', 'user');
    if (userId) {
      queryBuilder.andWhere('like.userId = :userId', { userId });
    }

    if (likeableType) {
      queryBuilder.andWhere('like.likeableType = :likeableType', {
        likeableType,
      });
    }

    if (likeableId) {
      queryBuilder.andWhere('like.likeableId = :likeableId', { likeableId });
    }

    queryBuilder
      .orderBy('like.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [likes, total] = await queryBuilder.getManyAndCount();

    return {
      data: likes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Like> {
    const like = await this.likeRepository.findOne({
      where: { id },
      relations: ['user', 'contentOwner'],
    });

    if (!like) {
      throw new NotFoundException('Like not found');
    }

    return like;
  }

  async getUserLikes(userId: string, page: number = 1, limit: number = 20) {
    return this.findAll({ page, limit, userId });
  }

  async getUserLikesByType(
    userId: string,
    likeableType: LikeableType,
    page: number = 1,
    limit: number = 20,
  ) {
    return this.findAll({ page, limit, userId, likeableType });
  }

  async getContentLikes(
    likeableType: LikeableType,
    likeableId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    return this.findAll({ page, limit, likeableType, likeableId });
  }

  async getLikesCount(
    likeableType: LikeableType,
    likeableId: string,
  ): Promise<number> {
    return this.likeRepository.count({
      where: {
        likeableType,
        likeableId,
      },
    });
  }

  async hasUserLiked(
    userId: string,
    likeableType: LikeableType,
    likeableId: string,
  ): Promise<boolean> {
    const like = await this.likeRepository.findOne({
      where: {
        userId,
        likeableType,
        likeableId,
      },
    });

    return !!like;
  }

  async getMostLikedContent(
    likeableType: LikeableType,
    limit: number = 10,
    startDate?: Date,
    endDate?: Date,
  ) {
    const queryBuilder = this.likeRepository
      .createQueryBuilder('like')
      .select('like.likeableId', 'contentId')
      .addSelect('COUNT(like.id)', 'likesCount')
      .where('like.likeableType = :likeableType', { likeableType })
      .groupBy('like.likeableId')

    .orderBy('COUNT(like.id)', 'DESC') 
      .limit(limit);

    if (startDate) {
      queryBuilder.andWhere('like.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('like.createdAt <= :endDate', { endDate });
    }

    return queryBuilder.getRawMany();
  }

  async getUserLikesStats(userId: string) {
    const stats = await this.likeRepository
      .createQueryBuilder('like')
      .select('like.likeableType', 'type')
      .addSelect('COUNT(like.id)', 'count')
      .where('like.userId = :userId', { userId })
      .groupBy('like.likeableType')
      .getRawMany();

    const totalLikes = await this.likeRepository.count({
      where: { userId },
    });

    return {
      totalLikes,
      byType: stats.reduce((acc, stat) => {
        acc[stat.type] = parseInt(stat.count);
        return acc;
      }, {}),
    };
  }

  async getContentOwnerLikesReceived(
    contentOwnerId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;

    const [likes, total] = await this.likeRepository.findAndCount({
      where: { contentOwnerId },
      relations: ['user'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: likes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async bulkCheckLikes(
    userId: string,
    items: Array<{ likeableType: LikeableType; likeableId: string }>,
  ): Promise<Record<string, boolean>> {
    if (items.length === 0) {
      return {};
    }

    const conditions = items.map(
      (item) =>
        `(like.likeableType = '${item.likeableType}' AND like.likeableId = '${item.likeableId}')`,
    );

    const likes = await this.likeRepository
      .createQueryBuilder('like')
      .where(`like.userId = :userId`, { userId })
      .andWhere(`(${conditions.join(' OR ')})`)
      .getMany();

    const likeMap: Record<string, boolean> = {};

    items.forEach((item) => {
      const key = `${item.likeableType}:${item.likeableId}`;
      likeMap[key] = false;
    });

    likes.forEach((like) => {
      const key = `${like.likeableType}:${like.likeableId}`;
      likeMap[key] = true;
    });

    return likeMap;
  }

  private getContentTypeName(type: LikeableType): string {
    const typeNames = {
      [LikeableType.POST]: 'Post',
      [LikeableType.COMMENT]: 'Comment',
      [LikeableType.ARTICLE]: 'Article',
      [LikeableType.PRODUCT]: 'Product',
      [LikeableType.STORY]: 'Story',
      [LikeableType.GROUP_POST]: 'Group Post',
    };

    return typeNames[type] || 'Content';
  }
}