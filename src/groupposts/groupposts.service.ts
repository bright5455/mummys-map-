import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { GroupPost } from '../groupchat/entities/group-post.entity';
import { Group } from '../groupchat/entities/group.entity';
import { GroupMember } from '../groupchat/entities/group-member.entity';
import { CreateGroupPostRequestDto } from './dtos/create-group-post-request.dto';
import { UpdateGroupPostRequestDto } from './dtos/update-group-post-request.dto';
import { GroupPostQueryDto } from './dtos/group-post-query.dto';
import { GroupMemberRole } from 'src/enums/group-member-role.enum';
import { GroupMemberStatus } from 'src/enums/group-member-status.enum';

@Injectable()
export class GroupPostsService {
  private readonly logger = new Logger(GroupPostsService.name);

  constructor(
    @InjectRepository(GroupPost)
    private readonly postRepository: Repository<GroupPost>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private readonly memberRepository: Repository<GroupMember>,
  ) {}
  async createPost(
    groupId: string,
    userId: string,
    createGroupPostRequestDto: CreateGroupPostRequestDto,
  ): Promise<GroupPost> {

    const group = await this.groupRepository.findOne({
      where: { id: groupId, deletedAt: IsNull() },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (!group.isActive) {
      throw new BadRequestException('Group is not active');
    }
    const member = await this.memberRepository.findOne({
      where: {
        groupId,
        userId,
        status: GroupMemberStatus.ACTIVE,
      },
    });

    if (!member) {
      throw new ForbiddenException('You must be a member to post in this group');
    }
    if (
      !group.allowMemberPosts &&
      ![GroupMemberRole.ADMIN, GroupMemberRole.MODERATOR].includes(member.role)
    ) {
      throw new ForbiddenException('Only admins and moderators can post in this group');
    }

    const { content, mediaUrls } = createGroupPostRequestDto;
    const hashtags = this.extractHashtags(content);
    const mentions = this.extractMentions(content);
    const post = this.postRepository.create({
      groupId,
      userId,
      content,
      mediaUrls,
      hashtags,
      mentions,
    });

    const savedPost = await this.postRepository.save(post);
    await this.groupRepository.increment({ id: groupId }, 'postsCount', 1);

    this.logger.log(`Post created in group ${groupId} by user ${userId}`);

    return this.findOne(groupId, savedPost.id, userId);
  }

  async getGroupPosts(
    groupId: string,
    query: GroupPostQueryDto,
    currentUserId?: string,
  ) {
    const group = await this.groupRepository.findOne({
      where: { id: groupId, deletedAt: IsNull() },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }
    if (currentUserId) {
      const member = await this.memberRepository.findOne({
        where: {
          groupId,
          userId: currentUserId,
          status: GroupMemberStatus.ACTIVE,
        },
      });

      if (!member && group.privacy !== 'public') {
        throw new ForbiddenException('You must be a member to view posts in this group');
      }
    }

    const { page = 1, limit = 20, search } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .where('post.groupId = :groupId', { groupId })
      .andWhere('post.deletedAt IS NULL');
    if (search) {
      queryBuilder.andWhere('LOWER(post.content) LIKE LOWER(:search)', {
        search: `%${search}%`,
      });
    }

    queryBuilder
      .orderBy('post.isPinned', 'DESC')
      .addOrderBy('post.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [posts, total] = await queryBuilder.getManyAndCount();
    const postsWithInteractions = await Promise.all(
      posts.map(async (post) => ({
        ...post,
        canEdit: currentUserId ? await this.canEditPost(groupId, post.id, currentUserId) : false,
        canDelete: currentUserId ? await this.canDeletePost(groupId, post.id, currentUserId) : false,
        canPin: currentUserId ? await this.canPinPost(groupId, currentUserId) : false,
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

  async findOne(groupId: string, postId: string, currentUserId?: string): Promise<GroupPost> {
    const post = await this.postRepository.findOne({
      where: { id: postId, groupId, deletedAt: IsNull() },
      relations: ['user', 'group'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }
if (currentUserId && post.group && post.group.privacy !== 'public') {
  const member = await this.memberRepository.findOne({
    where: {
      groupId,
      userId: currentUserId,
      status: GroupMemberStatus.ACTIVE,
    },
  });

  if (!member) {
    throw new ForbiddenException('You must be a member to view this post');
  }
}
    return {
      ...post,
      canEdit: currentUserId ? await this.canEditPost(groupId, postId, currentUserId) : false,
      canDelete: currentUserId ? await this.canDeletePost(groupId, postId, currentUserId) : false,
      canPin: currentUserId ? await this.canPinPost(groupId, currentUserId) : false,
    } as any;
  }

  async getPinnedPosts(groupId: string, currentUserId?: string) {
    if (currentUserId) {
      const member = await this.memberRepository.findOne({
        where: {
          groupId,
          userId: currentUserId,
          status: GroupMemberStatus.ACTIVE,
        },
      });

      if (!member) {
        throw new ForbiddenException('You must be a member to view posts');
      }
    }

    const posts = await this.postRepository.find({
      where: {
        groupId,
        isPinned: true,
        deletedAt: IsNull(),
      },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    return { data: posts };
  }

  async updatePost(
    groupId: string,
    postId: string,
    userId: string,
    updateGroupPostRequestDto: UpdateGroupPostRequestDto,
  ): Promise<GroupPost> {
    const post = await this.postRepository.findOne({
      where: { id: postId, groupId, deletedAt: IsNull() },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }
    if (post.userId !== userId) {
      throw new ForbiddenException('You can only edit your own posts');
    }
    if (updateGroupPostRequestDto.content !== undefined) {
      post.content = updateGroupPostRequestDto.content;
      post.hashtags = this.extractHashtags(updateGroupPostRequestDto.content);
      post.mentions = this.extractMentions(updateGroupPostRequestDto.content);
      post.isEdited = true;
      post.editedAt = new Date();
    }

    if (updateGroupPostRequestDto.mediaUrls !== undefined) {
      post.mediaUrls = updateGroupPostRequestDto.mediaUrls;
    }

    await this.postRepository.save(post);

    this.logger.log(`Post ${postId} updated in group ${groupId}`);

    return this.findOne(groupId, postId, userId);
  }
  async deletePost(groupId: string, postId: string, userId: string): Promise<void> {
    const post = await this.postRepository.findOne({
      where: { id: postId, groupId, deletedAt: IsNull() },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }
    const canDelete = await this.canDeletePost(groupId, postId, userId);
    if (!canDelete) {
      throw new ForbiddenException('You do not have permission to delete this post');
    }
    post.deletedAt = new Date();
    await this.postRepository.save(post);
    await this.groupRepository.decrement({ id: groupId }, 'postsCount', 1);

    this.logger.log(`Post ${postId} deleted from group ${groupId}`);
  }

  async pinPost(groupId: string, postId: string, userId: string): Promise<GroupPost> {
    await this.verifyAdminOrModeratorAccess(groupId, userId);

    const post = await this.postRepository.findOne({
      where: { id: postId, groupId, deletedAt: IsNull() },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.isPinned) {
      throw new BadRequestException('Post is already pinned');
    }

    post.isPinned = true;
    await this.postRepository.save(post);

    this.logger.log(`Post ${postId} pinned in group ${groupId}`);

    return this.findOne(groupId, postId, userId);
  }

  async unpinPost(groupId: string, postId: string, userId: string): Promise<GroupPost> {
    await this.verifyAdminOrModeratorAccess(groupId, userId);

    const post = await this.postRepository.findOne({
      where: { id: postId, groupId, deletedAt: IsNull() },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (!post.isPinned) {
      throw new BadRequestException('Post is not pinned');
    }

    post.isPinned = false;
    await this.postRepository.save(post);

    this.logger.log(`Post ${postId} unpinned in group ${groupId}`);

    return this.findOne(groupId, postId, userId);
  }

  private async canEditPost(
    groupId: string,
    postId: string,
    userId: string,
  ): Promise<boolean> {
    const post = await this.postRepository.findOne({
      where: { id: postId, groupId },
    });

    if (!post) return false;
    return post.userId === userId;
  }

  private async canDeletePost(
    groupId: string,
    postId: string,
    userId: string,
  ): Promise<boolean> {
    const post = await this.postRepository.findOne({
      where: { id: postId, groupId },
    });

    if (!post) return false;
    if (post.userId === userId) return true;
    const member = await this.memberRepository.findOne({
      where: {
        groupId,
        userId,
        status: GroupMemberStatus.ACTIVE,
      },
    });

    if (!member) return false;

    return [GroupMemberRole.ADMIN, GroupMemberRole.MODERATOR].includes(member.role);
  }

  private async canPinPost(groupId: string, userId: string): Promise<boolean> {
    const member = await this.memberRepository.findOne({
      where: {
        groupId,
        userId,
        status: GroupMemberStatus.ACTIVE,
      },
    });

    if (!member) return false;

    return [GroupMemberRole.ADMIN, GroupMemberRole.MODERATOR].includes(member.role);
  }

  private async verifyAdminOrModeratorAccess(
    groupId: string,
    userId: string,
  ): Promise<GroupMember> {
    const member = await this.memberRepository.findOne({
      where: {
        groupId,
        userId,
        status: GroupMemberStatus.ACTIVE,
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this group');
    }

    if (![GroupMemberRole.ADMIN, GroupMemberRole.MODERATOR].includes(member.role)) {
      throw new ForbiddenException('Only admins and moderators can perform this action');
    }

    return member;
  }

  async getPostStats(groupId: string, postId: string) {
    const post = await this.postRepository.findOne({
      where: { id: postId, groupId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return {
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      isPinned: post.isPinned,
    };
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