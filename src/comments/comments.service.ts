import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CommentLike } from './entities/comment-like.entity';
import { Post } from '../post/entities/post.entity';
import { CreateCommentDto } from './dtos/create-comment.dto';
import { UpdateCommentDto } from './dtos/update-comment.dto';
import { CommentQueryDto } from './dtos/comment-query.dto';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(CommentLike)
    private readonly commentLikeRepository: Repository<CommentLike>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async create(userId: string, createCommentDto: CreateCommentDto): Promise<Comment> {
    const { content, postId, parentCommentId } = createCommentDto;

    const post = await this.postRepository.findOne({
      where: { id: postId, deletedAt: IsNull() },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (parentCommentId) {
      const parentComment = await this.commentRepository.findOne({
        where: { id: parentCommentId, deletedAt: IsNull() },
      });

      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }

      
      if (parentComment.postId !== postId) {
        throw new BadRequestException('Parent comment does not belong to this post');
      }
    }

    const mentions = this.extractMentions(content);

    const comment = this.commentRepository.create({
      userId,
      postId,
      parentCommentId,
      content,
      mentions,
    });

    const savedComment = await this.commentRepository.save(comment);
    
    await this.postRepository.increment({ id: postId }, 'commentsCount', 1);

    if (parentCommentId) {
      await this.commentRepository.increment(
        { id: parentCommentId },
        'repliesCount',
        1,
      );
    }

    this.logger.log(`Comment created: ${savedComment.id} by user: ${userId}`);

    return this.findOne(savedComment.id, userId);
  }

  async findAll(query: CommentQueryDto, currentUserId?: string) {
    const { page = 1, limit = 20, postId, parentCommentId } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .where('comment.deletedAt IS NULL');

    
    if (postId) {
      queryBuilder.andWhere('comment.postId = :postId', { postId });
    }

    
    if (parentCommentId) {
      queryBuilder.andWhere('comment.parentCommentId = :parentCommentId', {
        parentCommentId,
      });
    } else {
      
      queryBuilder.andWhere('comment.parentCommentId IS NULL');
    }

    queryBuilder
      .orderBy('comment.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [comments, total] = await queryBuilder.getManyAndCount();

   
    const commentsWithInteractions = await Promise.all(
      comments.map(async (comment) => ({
        ...comment,
        isLiked: currentUserId
          ? await this.isCommentLikedByUser(comment.id, currentUserId)
          : false,
      })),
    );

    return {
      data: commentsWithInteractions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, currentUserId?: string): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['user'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return {
      ...comment,
      isLiked: currentUserId
        ? await this.isCommentLikedByUser(id, currentUserId)
        : false,
    } as any;
  }

  async getPostComments(
    postId: string,
    page: number = 1,
    limit: number = 20,
    currentUserId?: string,
  ) {
    return this.findAll({ page, limit, postId }, currentUserId);
  }

  async getCommentReplies(
    commentId: string,
    page: number = 1,
    limit: number = 10,
    currentUserId?: string,
  ) {
   
    const parentComment = await this.commentRepository.findOne({
      where: { id: commentId, deletedAt: IsNull() },
    });

    if (!parentComment) {
      throw new NotFoundException('Comment not found');
    }

    return this.findAll(
      { page, limit, parentCommentId: commentId },
      currentUserId,
    );
  }

 

  async update(
    id: string,
    userId: string,
    updateCommentDto: UpdateCommentDto,
  ): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    
    comment.content = updateCommentDto.content;
    comment.mentions = this.extractMentions(updateCommentDto.content);
    comment.isEdited = true;
    comment.editedAt = new Date();

    await this.commentRepository.save(comment);

    this.logger.log(`Comment updated: ${id}`);

    return this.findOne(id, userId);
  }

  
  async remove(id: string, userId: string): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    comment.deletedAt = new Date();
    await this.commentRepository.save(comment);

    
    await this.postRepository.decrement(
      { id: comment.postId },
      'commentsCount',
      1,
    );

    if (comment.parentCommentId) {
      await this.commentRepository.decrement(
        { id: comment.parentCommentId },
        'repliesCount',
        1,
      );
    }

    this.logger.log(`Comment deleted: ${id}`);
  }

 
  async likeComment(
    commentId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId, deletedAt: IsNull() },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const existingLike = await this.commentLikeRepository.findOne({
      where: { commentId, userId },
    });

    if (existingLike) {
      throw new BadRequestException('Comment already liked');
    }

    const like = this.commentLikeRepository.create({ commentId, userId });
    await this.commentLikeRepository.save(like);

    
    await this.commentRepository.increment({ id: commentId }, 'likesCount', 1);

    this.logger.log(`Comment liked: ${commentId} by user: ${userId}`);

    return { message: 'Comment liked successfully' };
  }

  async unlikeComment(
    commentId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const like = await this.commentLikeRepository.findOne({
      where: { commentId, userId },
    });

    if (!like) {
      throw new NotFoundException('Like not found');
    }

    await this.commentLikeRepository.remove(like);

    
    await this.commentRepository.decrement({ id: commentId }, 'likesCount', 1);

    this.logger.log(`Comment unliked: ${commentId} by user: ${userId}`);

    return { message: 'Comment unliked successfully' };
  }

  async getCommentLikes(
    commentId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;

    const [likes, total] = await this.commentLikeRepository.findAndCount({
      where: { commentId },
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

 

  private async isCommentLikedByUser(
    commentId: string,
    userId: string,
  ): Promise<boolean> {
    const like = await this.commentLikeRepository.findOne({
      where: { commentId, userId },
    });
    return !!like;
  }

  private extractMentions(content: string): string[] {
    const mentionRegex = /@[\w]+/g;
    const matches = content.match(mentionRegex);
    return matches ? matches.map((mention) => mention.slice(1)) : [];
  }
}