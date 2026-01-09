import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, In, IsNull } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Story } from './entities/story.entity';
import { StoryView } from './entities/story-view.entity';
import { StoryReply } from './entities/story-reply.entity';
import { StoryHighlight } from './entities/story-highlight.entity';
import { User } from '../user/entity/user.entity';
import { CreateStoryDto } from './dtos/create-story.dto';
import { ReplyStoryDto } from './dtos/reply-story.dto';
import { CreateHighlightDto } from './dtos/create-highlight.dto';
import { UpdateHighlightDto } from './dtos/update-highlight.dto';
import { StoryType } from 'src/enums/story-type.enum';
import { MediaService } from '../media/media.service';

@Injectable()
export class StoriesService {
  private readonly logger = new Logger(StoriesService.name);

  constructor(
    @InjectRepository(Story)
    private readonly storyRepository: Repository<Story>,
    @InjectRepository(StoryView)
    private readonly storyViewRepository: Repository<StoryView>,
    @InjectRepository(StoryReply)
    private readonly storyReplyRepository: Repository<StoryReply>,
    @InjectRepository(StoryHighlight)
    private readonly highlightRepository: Repository<StoryHighlight>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly mediaService: MediaService,
  ) {}

  async createStory(
    userId: string,
    file: Express.Multer.File,
    createStoryDto: CreateStoryDto,
  ): Promise<Story> {
    const { caption, textOverlay, backgroundColor, privacy, allowReplies, showViewers, expiresInHours = 24 } = createStoryDto;

    const media = await this.mediaService.uploadSingle(userId, file, {
      context: 'story' as any,
      isPublic: false,
    });
    const storyType = media.mediaType === 'video' ? StoryType.VIDEO : StoryType.IMAGE;

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    const story = this.storyRepository.create({
      userId,
      type: storyType,
      mediaUrl: media.url,
      thumbnailUrl: media.thumbnailUrl,
      duration: media.duration,
      width: media.width,
      height: media.height,
      caption,
      textOverlay,
      backgroundColor,
      privacy,
      allowReplies: allowReplies ?? true,
      showViewers: showViewers ?? true,
      expiresAt,
    });

    const savedStory = await this.storyRepository.save(story);

    this.logger.log(`Story created: ${savedStory.id} by user: ${userId}`);

    return savedStory;
  }

  async getActiveStories(currentUserId?: string) {
    const now = new Date();
    const usersWithStories = await this.storyRepository
      .createQueryBuilder('story')
      .select('story.userId', 'userId')
      .addSelect('COUNT(story.id)', 'storiesCount')
      .addSelect('MAX(story.createdAt)', 'lastStoryAt')
      .where('story.expiresAt > :now', { now })
      .andWhere('story.deletedAt IS NULL')
      .groupBy('story.userId')
       .orderBy('MAX(story.createdAt)', 'DESC')
      .getRawMany();

    if (usersWithStories.length === 0) {
      return { data: [] };
    }

    const userIds = usersWithStories.map((u) => u.userId);
    const users = await this.userRepository.find({
      where: { id: In(userIds) },
    });
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        const userStoryData = usersWithStories.find((u) => u.userId === user.id);
        const hasViewed = currentUserId
          ? await this.hasViewedUserStories(currentUserId, user.id)
          : false;

        return {
          ...user,
          storiesCount: parseInt(userStoryData.storiesCount),
          lastStoryAt: userStoryData.lastStoryAt,
          hasViewed,
        };
      }),
    );
    if (currentUserId) {
      enrichedUsers.sort((a, b) => {
        if (a.id === currentUserId) return -1;
        if (b.id === currentUserId) return 1;
        if (!a.hasViewed && b.hasViewed) return -1;
        if (a.hasViewed && !b.hasViewed) return 1;
        return 0;
      });
    }

    return { data: enrichedUsers };
  }

  async getUserStories(userId: string, currentUserId?: string) {
    const now = new Date();

    const stories = await this.storyRepository.find({
      where: {
        userId,
        expiresAt: MoreThan(now),
        deletedAt: IsNull(),
      },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });

    if (stories.length === 0) {
      throw new NotFoundException('No active stories found for this user');
    }
    const enrichedStories = await Promise.all(
      stories.map(async (story) => {
        const hasViewed = currentUserId
          ? await this.hasViewedStory(story.id, currentUserId)
          : false;

        return {
          ...story,
          hasViewed,
          isOwner: currentUserId === story.userId,
        };
      }),
    );

    return { data: enrichedStories };
  }

  async getStory(id: string, currentUserId?: string): Promise<Story> {
    const story = await this.storyRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['user'],
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }
    if (new Date() > story.expiresAt) {
      throw new NotFoundException('Story has expired');
    }

    return story;
  }

  async viewStory(storyId: string, userId: string) {
    const story = await this.storyRepository.findOne({
      where: { id: storyId, deletedAt: IsNull() },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    if (new Date() > story.expiresAt) {
      throw new NotFoundException('Story has expired');
    }
    if (story.userId === userId) {
      return { message: 'Story viewed' };
    }
    const existingView = await this.storyViewRepository.findOne({
      where: { storyId, userId },
    });

    if (existingView) {
      return { message: 'Story already viewed' };
    }
    const view = this.storyViewRepository.create({ storyId, userId });
    await this.storyViewRepository.save(view);
    await this.storyRepository.increment({ id: storyId }, 'viewsCount', 1);

    this.logger.log(`Story ${storyId} viewed by user ${userId}`);

    return { message: 'Story viewed successfully' };
  }

  async getStoryViewers(storyId: string, userId: string, page: number = 1, limit: number = 50) {
    const story = await this.storyRepository.findOne({
      where: { id: storyId, deletedAt: IsNull() },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }
    if (story.userId !== userId) {
      throw new ForbiddenException('Only story owner can see viewers');
    }

    if (!story.showViewers) {
      throw new ForbiddenException('Story viewers are hidden');
    }

    const skip = (page - 1) * limit;

    const [views, total] = await this.storyViewRepository.findAndCount({
      where: { storyId },
      relations: ['user'],
      skip,
      take: limit,
      order: { viewedAt: 'DESC' },
    });

    return {
      data: views,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async replyToStory(storyId: string, userId: string, replyStoryDto: ReplyStoryDto) {
    const story = await this.storyRepository.findOne({
      where: { id: storyId, deletedAt: IsNull() },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    if (new Date() > story.expiresAt) {
      throw new BadRequestException('Cannot reply to expired story');
    }

    if (!story.allowReplies) {
      throw new ForbiddenException('Replies are not allowed for this story');
    }

    const reply = this.storyReplyRepository.create({
      storyId,
      userId,
      message: replyStoryDto.message,
    });

    await this.storyReplyRepository.save(reply);

    await this.storyRepository.increment({ id: storyId }, 'repliesCount', 1);

    this.logger.log(`User ${userId} replied to story ${storyId}`);

    return { message: 'Reply sent successfully', reply };
  }

  async getStoryReplies(storyId: string, userId: string, page: number = 1, limit: number = 50) {
    const story = await this.storyRepository.findOne({
      where: { id: storyId, deletedAt: IsNull() },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }
    if (story.userId !== userId) {
      throw new ForbiddenException('Only story owner can see replies');
    }

    const skip = (page - 1) * limit;

    const [replies, total] = await this.storyReplyRepository.findAndCount({
      where: { storyId, deletedAt: IsNull() },
      relations: ['user'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: replies,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async deleteStory(id: string, userId: string): Promise<void> {
    const story = await this.storyRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    if (story.userId !== userId) {
      throw new ForbiddenException('You can only delete your own stories');
    }

    
    story.deletedAt = new Date();
    await this.storyRepository.save(story);

    this.logger.log(`Story deleted: ${id}`);
  }

  async createHighlight(userId: string, createHighlightDto: CreateHighlightDto) {
    const highlight = this.highlightRepository.create({
      userId,
      ...createHighlightDto,
    });

    const savedHighlight = await this.highlightRepository.save(highlight);

    this.logger.log(`Highlight created: ${savedHighlight.id} by user: ${userId}`);

    return savedHighlight;
  }

  async addStoryToHighlight(storyId: string, highlightId: string, userId: string) {
    const story = await this.storyRepository.findOne({
      where: { id: storyId, userId },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    const highlight = await this.highlightRepository.findOne({
      where: { id: highlightId, userId, deletedAt: IsNull() },
    });

    if (!highlight) {
      throw new NotFoundException('Highlight not found');
    }

    story.highlightId = highlightId;
    story.isHighlight = true;

    await this.storyRepository.save(story);
    await this.highlightRepository.increment({ id: highlightId }, 'storiesCount', 1);

    this.logger.log(`Story ${storyId} added to highlight ${highlightId}`);

    return { message: 'Story added to highlight successfully' };
  }

  async removeStoryFromHighlight(storyId: string, userId: string) {
    const story = await this.storyRepository.findOne({
      where: { id: storyId, userId },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    const highlightId = story.highlightId;

    story.highlightId = null;
    story.isHighlight = false;

    await this.storyRepository.save(story);
    if (highlightId) {
      await this.highlightRepository.decrement({ id: highlightId }, 'storiesCount', 1);
    }

    this.logger.log(`Story ${storyId} removed from highlight`);

    return { message: 'Story removed from highlight successfully' };
  }

  async getUserHighlights(userId: string) {
    const highlights = await this.highlightRepository.find({
      where: { userId, deletedAt: IsNull() },
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
    });

    return { data: highlights };
  }

  async getHighlightStories(highlightId: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [stories, total] = await this.storyRepository.findAndCount({
      where: { highlightId, deletedAt: IsNull() },
      relations: ['user'],
      skip,
      take: limit,
      order: { createdAt: 'ASC' },
    });

    return {
      data: stories,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateHighlight(id: string, userId: string, updateHighlightDto: UpdateHighlightDto) {
    const highlight = await this.highlightRepository.findOne({
      where: { id, userId, deletedAt: IsNull() },
    });

    if (!highlight) {
      throw new NotFoundException('Highlight not found');
    }

    Object.assign(highlight, updateHighlightDto);

    await this.highlightRepository.save(highlight);

    return highlight;
  }

  async deleteHighlight(id: string, userId: string) {
    const highlight = await this.highlightRepository.findOne({
      where: { id, userId, deletedAt: IsNull() },
    });

    if (!highlight) {
      throw new NotFoundException('Highlight not found');
    }
    highlight.deletedAt = new Date();
    await this.highlightRepository.save(highlight);
    await this.storyRepository.update(
      { highlightId: id },
      { highlightId: null, isHighlight: false },
    );

    this.logger.log(`Highlight deleted: ${id}`);

    return { message: 'Highlight deleted successfully' };
  }
  private async hasViewedStory(storyId: string, userId: string): Promise<boolean> {
    const view = await this.storyViewRepository.findOne({
      where: { storyId, userId },
    });
    return !!view;
  }

  private async hasViewedUserStories(viewerId: string, userId: string): Promise<boolean> {
    const now = new Date();
    const stories = await this.storyRepository.find({
      where: {
        userId,
        expiresAt: MoreThan(now),
        deletedAt: IsNull(),
      },
      select: ['id'],
    });

    if (stories.length === 0) {
      return false;
    }

    const storyIds = stories.map((s) => s.id);
    const viewedCount = await this.storyViewRepository.count({
      where: {
        storyId: In(storyIds),
        userId: viewerId,
      },
    });

    return viewedCount === stories.length;
  }
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredStories() {
    const now = new Date();

    const expiredStories = await this.storyRepository.find({
      where: {
        expiresAt: LessThan(now),
        deletedAt: IsNull(),
        isHighlight: false,
      },
    });

    if (expiredStories.length > 0) {
      await this.storyRepository.update(
        { id: In(expiredStories.map((s) => s.id)) },
        { deletedAt: now },
      );

      this.logger.log(`Cleaned up ${expiredStories.length} expired stories`);
    }
  }
}