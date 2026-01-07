import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Post } from './entities/post.entity';
import { PostLike } from './entities/post-like.entity';
import { PostMedia } from './entities/post-media.entity';
import { PostBookmark } from './entities/post-bookmark.entity';
import { CreatePostDto } from './dtos/create-post.dto';
import { UpdatePostDto } from './dtos/update-post.dto';
import { PostQueryDto } from './dtos/post-query.dto';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(PostLike)
    private readonly postLikeRepository: Repository<PostLike>,
    @InjectRepository(PostMedia)
    private readonly postMediaRepository: Repository<PostMedia>,
    @InjectRepository(PostBookmark)
    private readonly postBookmarkRepository: Repository<PostBookmark>,
  ) {}

 
  async create(userId: string, createPostDto: CreatePostDto): Promise<Post> {
    const { content, type, visibility, media, sharedPostId } = createPostDto;

    
    if (type === 'text' && !content && !media?.length) {
      throw new BadRequestException('Text posts must have content or media');
    }

    
    if (sharedPostId) {
      const sharedPost = await this.postRepository.findOne({
        where: { id: sharedPostId, deletedAt: IsNull() },
      });

      if (!sharedPost) {
        throw new NotFoundException('Shared post not found');
      }
    }

    
    const hashtags = this.extractHashtags(content || '');
    const mentions = this.extractMentions(content || '');

    
    const post = this.postRepository.create({
      userId,
      content,
      type,
      visibility,
      sharedPostId,
      hashtags,
      mentions,
    });

    const savedPost = await this.postRepository.save(post);

    
    if (media && media.length > 0) {
      const postMedia = media.map((m, index) =>
        this.postMediaRepository.create({
          postId: savedPost.id,
          mediaUrl: m.mediaUrl,
          thumbnailUrl: m.thumbnailUrl,
          mediaType: m.mediaType as any,
          width: m.width,
          height: m.height,
          duration: m.duration,
          order: index,
        }),
      );

      await this.postMediaRepository.save(postMedia);
    }

    
    if (sharedPostId) {
      await this.postRepository.increment({ id: sharedPostId }, 'sharesCount', 1);
    }

    this.logger.log(`Post created: ${savedPost.id} by user: ${userId}`);

    return this.findOne(savedPost.id, userId);
  }

  async findAll(query: PostQueryDto, currentUserId?: string) {
    const { page = 1, limit = 10, userId, type, visibility, hashtag } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.media', 'media')
      .leftJoinAndSelect('post.sharedPost', 'sharedPost')
      .leftJoinAndSelect('sharedPost.user', 'sharedPostUser')
      .leftJoinAndSelect('sharedPost.media', 'sharedPostMedia')
      .where('post.deletedAt IS NULL')
      .orderBy('post.isPinned', 'DESC')
      .addOrderBy('post.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    
    if (userId) {
      queryBuilder.andWhere('post.userId = :userId', { userId });
    }

    
    if (type) {
      queryBuilder.andWhere('post.type = :type', { type });
    }

   
    if (visibility) {
      queryBuilder.andWhere('post.visibility = :visibility', { visibility });
    } else {
      
      queryBuilder.andWhere('post.visibility = :visibility', {
        visibility: 'public',
      });
    }

    
    if (hashtag) {
      queryBuilder.andWhere(':hashtag = ANY(post.hashtags)', { hashtag });
    }

    const [posts, total] = await queryBuilder.getManyAndCount();

    
    const postsWithInteractions = await Promise.all(
      posts.map(async (post) => ({
        ...post,
        isLiked: currentUserId
          ? await this.isPostLikedByUser(post.id, currentUserId)
          : false,
        isBookmarked: currentUserId
          ? await this.isPostBookmarkedByUser(post.id, currentUserId)
          : false,
      })),
    );

    return {
      data: postsWithInteractions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, currentUserId?: string): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: [
        'user',
        'media',
        'sharedPost',
        'sharedPost.user',
        'sharedPost.media',
      ],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return {
      ...post,
      isLiked: currentUserId
        ? await this.isPostLikedByUser(id, currentUserId)
        : false,
      isBookmarked: currentUserId
        ? await this.isPostBookmarkedByUser(id, currentUserId)
        : false,
    } as any;
  }

  async getUserPosts(userId: string, page: number = 1, limit: number = 10) {
    return this.findAll({ page, limit, userId });
  }

  async getFeed(userId: string, page: number = 1, limit: number = 10) {
    
    return this.findAll({ page, limit, visibility: 'public' as any }, userId);
  }

  

  async update(
    id: string,
    userId: string,
    updatePostDto: UpdatePostDto,
  ): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.userId !== userId) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    if (updatePostDto.content !== undefined) {
      post.content = updatePostDto.content;
      post.hashtags = this.extractHashtags(updatePostDto.content || '');
      post.mentions = this.extractMentions(updatePostDto.content || '');
      post.isEdited = true;
      post.editedAt = new Date();
    }

    if (updatePostDto.visibility) {
      post.visibility = updatePostDto.visibility;
    }

    
    if (updatePostDto.media) {
      
      await this.postMediaRepository.delete({ postId: id });

      
      const newMedia = updatePostDto.media.map((m, index) =>
        this.postMediaRepository.create({
          postId: id,
          mediaUrl: m.mediaUrl,
          thumbnailUrl: m.thumbnailUrl,
          mediaType: m.mediaType as any,
          width: m.width,
          height: m.height,
          duration: m.duration,
          order: index,
        }),
      );

      await this.postMediaRepository.save(newMedia);
    }

    await this.postRepository.save(post);

    this.logger.log(`Post updated: ${id}`);

    return this.findOne(id, userId);
  }

 

  async remove(id: string, userId: string): Promise<void> {
    const post = await this.postRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.userId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    
    post.deletedAt = new Date();
    await this.postRepository.save(post);

    this.logger.log(`Post deleted: ${id}`);
  }

  

  async togglePin(id: string, userId: string): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id, userId, deletedAt: IsNull() },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    post.isPinned = !post.isPinned;
    await this.postRepository.save(post);

    this.logger.log(`Post pin toggled: ${id} - ${post.isPinned}`);

    return this.findOne(id, userId);
  }

  async likePost(postId: string, userId: string): Promise<{ message: string }> {
    const post = await this.postRepository.findOne({
      where: { id: postId, deletedAt: IsNull() },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    
    const existingLike = await this.postLikeRepository.findOne({
      where: { postId, userId },
    });

    if (existingLike) {
      throw new BadRequestException('Post already liked');
    }

    
    const like = this.postLikeRepository.create({ postId, userId });
    await this.postLikeRepository.save(like);

    
    await this.postRepository.increment({ id: postId }, 'likesCount', 1);

    this.logger.log(`Post liked: ${postId} by user: ${userId}`);

    return { message: 'Post liked successfully' };
  }

  async unlikePost(postId: string, userId: string): Promise<{ message: string }> {
    const like = await this.postLikeRepository.findOne({
      where: { postId, userId },
    });

    if (!like) {
      throw new NotFoundException('Like not found');
    }

    await this.postLikeRepository.remove(like);

   
    await this.postRepository.decrement({ id: postId }, 'likesCount', 1);

    this.logger.log(`Post unliked: ${postId} by user: ${userId}`);

    return { message: 'Post unliked successfully' };
  }

  async getPostLikes(postId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [likes, total] = await this.postLikeRepository.findAndCount({
      where: { postId },
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

 

  async bookmarkPost(postId: string, userId: string): Promise<{ message: string }> {
    const post = await this.postRepository.findOne({
      where: { id: postId, deletedAt: IsNull() },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

   
    const existingBookmark = await this.postBookmarkRepository.findOne({
      where: { postId, userId },
    });

    if (existingBookmark) {
      throw new BadRequestException('Post already bookmarked');
    }

    
    const bookmark = this.postBookmarkRepository.create({ postId, userId });
    await this.postBookmarkRepository.save(bookmark);

    
    await this.postRepository.increment({ id: postId }, 'bookmarksCount', 1);

    this.logger.log(`Post bookmarked: ${postId} by user: ${userId}`);

    return { message: 'Post bookmarked successfully' };
  }

  async unbookmarkPost(postId: string, userId: string): Promise<{ message: string }> {
    const bookmark = await this.postBookmarkRepository.findOne({
      where: { postId, userId },
    });

    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }

    await this.postBookmarkRepository.remove(bookmark);

    
    await this.postRepository.decrement({ id: postId }, 'bookmarksCount', 1);

    this.logger.log(`Post unbookmarked: ${postId} by user: ${userId}`);

    return { message: 'Post unbookmarked successfully' };
  }

  async getUserBookmarks(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [bookmarks, total] = await this.postBookmarkRepository.findAndCount({
      where: { userId },
      relations: ['post', 'post.user', 'post.media'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const posts = bookmarks.map((b) => b.post);

    return {
      data: posts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  

  private async isPostLikedByUser(postId: string, userId: string): Promise<boolean> {
    const like = await this.postLikeRepository.findOne({
      where: { postId, userId },
    });
    return !!like;
  }

  private async isPostBookmarkedByUser(
    postId: string,
    userId: string,
  ): Promise<boolean> {
    const bookmark = await this.postBookmarkRepository.findOne({
      where: { postId, userId },
    });
    return !!bookmark;
  }

  private extractHashtags(content: string): string[] {
    const hashtagRegex = /#[\w]+/g;
    const matches = content.match(hashtagRegex);
    return matches ? matches.map((tag) => tag.slice(1)) : [];
  }

  private extractMentions(content: string): string[] {
    const mentionRegex = /@[\w]+/g;
    const matches = content.match(mentionRegex);
    return matches ? matches.map((mention) => mention.slice(1)) : [];
  }
}