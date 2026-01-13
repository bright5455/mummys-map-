import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, IsNull } from 'typeorm';
import { Group } from './entities/group.entity';
import { GroupMember } from './entities/group-member.entity';
import { GroupPost } from './entities/group-post.entity';
import { GroupInvitation } from './entities/group-invitation.entity';
import { GroupJoinRequest } from './entities/group-join-request.entity';
import { CreateGroupDto } from './dtos/create-group.dto';
import { UpdateGroupDto } from './dtos/update-group.dto';
import { GroupQueryDto } from './dtos/group-query.dto';
import { CreateGroupPostDto } from './dtos/create-group-post.dto';
import { UpdateGroupPostDto } from './dtos/update-group-post.dto';
import { InviteMemberDto } from './dtos/invite-member.dto';
import { UpdateMemberRoleDto } from './dtos/update-member-role.dto';
import { GroupMemberRole } from 'src/enums/group-member-role.enum';
import { GroupMemberStatus } from 'src/enums/group-member-status.enum';
import { GroupPrivacy } from 'src/enums/group-privacy.enum';
import { InvitationStatus } from 'src/enums/invitation-status.enum';

@Injectable()
export class GroupsService {
  private readonly logger = new Logger(GroupsService.name);

  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private readonly memberRepository: Repository<GroupMember>,
    @InjectRepository(GroupPost)
    private readonly postRepository: Repository<GroupPost>,
    @InjectRepository(GroupInvitation)
    private readonly invitationRepository: Repository<GroupInvitation>,
    @InjectRepository(GroupJoinRequest)
    private readonly joinRequestRepository: Repository<GroupJoinRequest>,
  ) {}

  async create(userId: string, createGroupDto: CreateGroupDto): Promise<Group> {
    const group = this.groupRepository.create({
      name: createGroupDto.name,
      description: createGroupDto.description || null,
      privacy: createGroupDto.privacy || GroupPrivacy.PUBLIC,
      coverImage: createGroupDto.coverImage || null,
      avatarImage: createGroupDto.avatarImage || null,
      rules: createGroupDto.rules || null,
      category: createGroupDto.category || null,
      location: createGroupDto.location || null,
      membersCount: 1,
      postsCount: 0,
      isActive: true,
    });

    const savedGroup = await this.groupRepository.save(group);

    // Add creator as admin
    const member = this.memberRepository.create({
      groupId: savedGroup.id,
      userId,
      role: GroupMemberRole.ADMIN,
      status: GroupMemberStatus.ACTIVE,
      approvedAt: new Date(),
      approvedBy: userId,
    });

    await this.memberRepository.save(member);

    this.logger.log(`Group created: ${savedGroup.id} by user: ${userId}`);

    return savedGroup;
  }

  async findAll(query: GroupQueryDto) {
    const { page = 1, limit = 20, search, privacy, category, userId } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.groupRepository
      .createQueryBuilder('group')
      .where('group.deletedAt IS NULL')
      .andWhere('group.isActive = :isActive', { isActive: true });

    if (search) {
      queryBuilder.andWhere(
        '(group.name ILIKE :search OR group.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (privacy) {
      queryBuilder.andWhere('group.privacy = :privacy', { privacy });
    }

    if (category) {
      queryBuilder.andWhere('group.category = :category', { category });
    }

    if (userId) {
      queryBuilder
        .innerJoin('group.members', 'member')
        .andWhere('member.userId = :userId', { userId })
        .andWhere('member.status = :status', { status: GroupMemberStatus.ACTIVE });
    }

    queryBuilder
      .orderBy('group.membersCount', 'DESC')
      .addOrderBy('group.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [groups, total] = await queryBuilder.getManyAndCount();

    return {
      data: groups,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId?: string): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['members', 'members.user'],
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }
    if (group.privacy === GroupPrivacy.PRIVATE && userId) {
      const isMember = await this.isMember(id, userId);
      if (!isMember) {
        throw new ForbiddenException('You do not have access to this group');
      }
    }

    return group;
  }

  async update(id: string, userId: string, updateGroupDto: UpdateGroupDto): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    await this.checkAdminPermission(id, userId);

    Object.assign(group, updateGroupDto);
    await this.groupRepository.save(group);

    this.logger.log(`Group updated: ${id}`);

    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string): Promise<void> {
    const group = await this.groupRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    await this.checkAdminPermission(id, userId);

    group.deletedAt = new Date();
    await this.groupRepository.save(group);

    this.logger.log(`Group deleted: ${id}`);
  }

  async getMyGroups(userId: string, page: number = 1, limit: number = 20) {
    return this.findAll({ page, limit, userId });
  }

  async getGroupStats(id: string, userId: string) {
    await this.checkMemberPermission(id, userId);

    const group = await this.groupRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const activeMembers = await this.memberRepository.count({
      where: { groupId: id, status: GroupMemberStatus.ACTIVE },
    });

    const pendingRequests = await this.joinRequestRepository.count({
      where: { groupId: id, status: InvitationStatus.PENDING },
    });

    const postsThisMonth = await this.postRepository
      .createQueryBuilder('post')
      .where('post.groupId = :groupId', { groupId: id })
      .andWhere('post.deletedAt IS NULL')
      .andWhere('post.createdAt >= :startDate', {
        startDate: new Date(new Date().setDate(1)),
      })
      .getCount();

    return {
      membersCount: activeMembers,
      postsCount: group.postsCount,
      pendingRequests,
      postsThisMonth,
    };
  }

  async joinGroup(groupId: string, userId: string): Promise<{ message: string }> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId, deletedAt: IsNull() },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const existingMember = await this.memberRepository.findOne({
      where: { groupId, userId },
    });

    if (existingMember && existingMember.status === GroupMemberStatus.ACTIVE) {
      throw new ConflictException('You are already a member of this group');
    }

    if (existingMember && existingMember.status === GroupMemberStatus.BANNED) {
      throw new ForbiddenException('You are banned from this group');
    }
    if (group.privacy === GroupPrivacy.PRIVATE) {
      const existingRequest = await this.joinRequestRepository.findOne({
        where: { groupId, userId, status: InvitationStatus.PENDING },
      });

      if (existingRequest) {
        throw new ConflictException('You already have a pending join request');
      }

      const request = this.joinRequestRepository.create({
        groupId,
        userId,
        status: InvitationStatus.PENDING,
        message: null,
        respondedAt: null,
        respondedBy: null,
      });

      await this.joinRequestRepository.save(request);

      return { message: 'Join request sent successfully' };
    }
    const member = this.memberRepository.create({
      groupId,
      userId,
      role: GroupMemberRole.MEMBER,
      status: GroupMemberStatus.ACTIVE,
      approvedAt: new Date(),
      approvedBy: userId,
    });

    await this.memberRepository.save(member);
    await this.groupRepository.increment({ id: groupId }, 'membersCount', 1);

    this.logger.log(`User ${userId} joined group ${groupId}`);

    return { message: 'Successfully joined group' };
  }

  async leaveGroup(groupId: string, userId: string): Promise<{ message: string }> {
    const member = await this.memberRepository.findOne({
      where: { groupId, userId, status: GroupMemberStatus.ACTIVE },
    });

    if (!member) {
      throw new NotFoundException('You are not a member of this group');
    }

    if (member.role === GroupMemberRole.ADMIN) {
      const adminCount = await this.memberRepository.count({
        where: { groupId, role: GroupMemberRole.ADMIN, status: GroupMemberStatus.ACTIVE },
      });

      if (adminCount === 1) {
        throw new BadRequestException(
          'Cannot leave group. You are the last admin. Please assign another admin first.',
        );
      }
    }

    await this.memberRepository.remove(member);
    await this.groupRepository.decrement({ id: groupId }, 'membersCount', 1);

    this.logger.log(`User ${userId} left group ${groupId}`);

    return { message: 'Successfully left group' };
  }

  async inviteMember(
    groupId: string,
    userId: string,
    inviteMemberDto: InviteMemberDto,
  ): Promise<GroupInvitation> {
    await this.checkAdminPermission(groupId, userId);

    const existingMember = await this.memberRepository.findOne({
      where: { groupId, userId: inviteMemberDto.userId },
    });

    if (existingMember && existingMember.status === GroupMemberStatus.ACTIVE) {
      throw new ConflictException('User is already a member of this group');
    }

    const existingInvitation = await this.invitationRepository.findOne({
      where: {
        groupId,
        invitedUserId: inviteMemberDto.userId,
        status: InvitationStatus.PENDING,
      },
    });

    if (existingInvitation) {
      throw new ConflictException('User already has a pending invitation');
    }

    const invitation = this.invitationRepository.create({
      groupId,
      invitedUserId: inviteMemberDto.userId,
      invitedBy: userId,
      status: InvitationStatus.PENDING,
      message: inviteMemberDto.message || null,
      respondedAt: null,
    });

    const savedInvitation = await this.invitationRepository.save(invitation);

    this.logger.log(`User ${inviteMemberDto.userId} invited to group ${groupId}`);

    return savedInvitation;
  }

  async approveJoinRequest(
    groupId: string,
    userId: string,
    requestUserId: string,
  ): Promise<{ message: string }> {
    await this.checkAdminPermission(groupId, userId);

    const request = await this.joinRequestRepository.findOne({
      where: { groupId, userId: requestUserId, status: InvitationStatus.PENDING },
    });

    if (!request) {
      throw new NotFoundException('Join request not found');
    }

    const member = this.memberRepository.create({
      groupId,
      userId: requestUserId,
      role: GroupMemberRole.MEMBER,
      status: GroupMemberStatus.ACTIVE,
      approvedAt: new Date(),
      approvedBy: userId,
    });

    await this.memberRepository.save(member);

    request.status = InvitationStatus.ACCEPTED;
    request.respondedAt = new Date();
    request.respondedBy = userId;
    await this.joinRequestRepository.save(request);

    await this.groupRepository.increment({ id: groupId }, 'membersCount', 1);

    this.logger.log(`Join request approved for user ${requestUserId} in group ${groupId}`);

    return { message: 'Join request approved successfully' };
  }

  async rejectJoinRequest(
    groupId: string,
    userId: string,
    requestUserId: string,
  ): Promise<{ message: string }> {
    await this.checkAdminPermission(groupId, userId);

    const request = await this.joinRequestRepository.findOne({
      where: { groupId, userId: requestUserId, status: InvitationStatus.PENDING },
    });

    if (!request) {
      throw new NotFoundException('Join request not found');
    }

    request.status = InvitationStatus.REJECTED;
    request.respondedAt = new Date();
    request.respondedBy = userId;
    await this.joinRequestRepository.save(request);

    this.logger.log(`Join request rejected for user ${requestUserId} in group ${groupId}`);

    return { message: 'Join request rejected successfully' };
  }

  async getPendingRequests(groupId: string, userId: string) {
    await this.checkAdminPermission(groupId, userId);

    const requests = await this.joinRequestRepository.find({
      where: { groupId, status: InvitationStatus.PENDING },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    return { data: requests };
  }

  async getMembers(groupId: string, userId: string, page: number = 1, limit: number = 20) {
    await this.checkMemberPermission(groupId, userId);

    const skip = (page - 1) * limit;

    const [members, total] = await this.memberRepository.findAndCount({
      where: { groupId, status: GroupMemberStatus.ACTIVE },
      relations: ['user'],
      order: { joinedAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: members,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async removeMember(
    groupId: string,
    adminUserId: string,
    targetUserId: string,
  ): Promise<{ message: string }> {
    await this.checkAdminPermission(groupId, adminUserId);

    if (adminUserId === targetUserId) {
      throw new BadRequestException('Cannot remove yourself. Use leave group instead.');
    }

    const member = await this.memberRepository.findOne({
      where: { groupId, userId: targetUserId, status: GroupMemberStatus.ACTIVE },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }
    if (member.role === GroupMemberRole.ADMIN) {
      throw new ForbiddenException('Cannot remove another admin');
    }

    await this.memberRepository.remove(member);

    await this.groupRepository.decrement({ id: groupId }, 'membersCount', 1);

    this.logger.log(`User ${targetUserId} removed from group ${groupId}`);

    return { message: 'Member removed successfully' };
  }

  async banMember(
    groupId: string,
    adminUserId: string,
    targetUserId: string,
  ): Promise<{ message: string }> {
    await this.checkAdminPermission(groupId, adminUserId);

    if (adminUserId === targetUserId) {
      throw new BadRequestException('Cannot ban yourself');
    }

    const member = await this.memberRepository.findOne({
      where: { groupId, userId: targetUserId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.role === GroupMemberRole.ADMIN) {
      throw new ForbiddenException('Cannot ban another admin');
    }

    const wasActive = member.status === GroupMemberStatus.ACTIVE;

    member.status = GroupMemberStatus.BANNED;
    await this.memberRepository.save(member);

    if (wasActive) {
      await this.groupRepository.decrement({ id: groupId }, 'membersCount', 1);
    }

    this.logger.log(`User ${targetUserId} banned from group ${groupId}`);

    return { message: 'Member banned successfully' };
  }

  async updateMemberRole(
    groupId: string,
    adminUserId: string,
    targetUserId: string,
    updateMemberRoleDto: UpdateMemberRoleDto,
  ): Promise<GroupMember> {
    await this.checkAdminPermission(groupId, adminUserId);

    const member = await this.memberRepository.findOne({
      where: { groupId, userId: targetUserId, status: GroupMemberStatus.ACTIVE },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    member.role = updateMemberRoleDto.role;
    await this.memberRepository.save(member);

    this.logger.log(`Member role updated for user ${targetUserId} in group ${groupId}`);

    return member;
  }

  async createPost(
    groupId: string,
    userId: string,
    createGroupPostDto: CreateGroupPostDto,
  ): Promise<GroupPost> {
    await this.checkMemberPermission(groupId, userId);

    const post = this.postRepository.create({
      groupId,
      userId,
      content: createGroupPostDto.content,
      mediaUrls: createGroupPostDto.mediaUrls || null,
      isPinned: false,
      likesCount: 0,
      commentsCount: 0,
    });

    const savedPost = await this.postRepository.save(post);

    await this.groupRepository.increment({ id: groupId }, 'postsCount', 1);

    this.logger.log(`Post created in group ${groupId} by user ${userId}`);

    return savedPost;
  }

  async getPosts(groupId: string, userId: string, page: number = 1, limit: number = 20) {
    await this.checkMemberPermission(groupId, userId);

    const skip = (page - 1) * limit;

    const [posts, total] = await this.postRepository.findAndCount({
      where: { groupId, deletedAt: IsNull() },
      relations: ['user'],
      order: { isPinned: 'DESC', createdAt: 'DESC' },
      skip,
      take: limit,
    });

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

  async getPost(groupId: string, postId: string, userId: string): Promise<GroupPost> {
    await this.checkMemberPermission(groupId, userId);

    const post = await this.postRepository.findOne({
      where: { id: postId, groupId, deletedAt: IsNull() },
      relations: ['user'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  async updatePost(
    groupId: string,
    postId: string,
    userId: string,
    updateGroupPostDto: UpdateGroupPostDto,
  ): Promise<GroupPost> {
    const post = await this.postRepository.findOne({
      where: { id: postId, groupId, userId, deletedAt: IsNull() },
    });

    if (!post) {
      throw new NotFoundException('Post not found or you do not have permission');
    }

    Object.assign(post, updateGroupPostDto);
    await this.postRepository.save(post);

    this.logger.log(`Post updated: ${postId}`);

    return this.getPost(groupId, postId, userId);
  }

  async deletePost(groupId: string, postId: string, userId: string): Promise<void> {
    const post = await this.postRepository.findOne({
      where: { id: postId, groupId, deletedAt: IsNull() },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const isAdmin = await this.isAdmin(groupId, userId);
    if (post.userId !== userId && !isAdmin) {
      throw new ForbiddenException('You do not have permission to delete this post');
    }

    post.deletedAt = new Date();
    await this.postRepository.save(post);

    await this.groupRepository.decrement({ id: groupId }, 'postsCount', 1);

    this.logger.log(`Post deleted: ${postId}`);
  }

  async pinPost(groupId: string, postId: string, userId: string): Promise<{ message: string }> {
    await this.checkAdminPermission(groupId, userId);

    const post = await this.postRepository.findOne({
      where: { id: postId, groupId, deletedAt: IsNull() },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    post.isPinned = true;
    await this.postRepository.save(post);

    this.logger.log(`Post pinned: ${postId}`);

    return { message: 'Post pinned successfully' };
  }

  async unpinPost(groupId: string, postId: string, userId: string): Promise<{ message: string }> {
    await this.checkAdminPermission(groupId, userId);

    const post = await this.postRepository.findOne({
      where: { id: postId, groupId, deletedAt: IsNull() },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    post.isPinned = false;
    await this.postRepository.save(post);

    this.logger.log(`Post unpinned: ${postId}`);

    return { message: 'Post unpinned successfully' };
  }
async getMyInvitations(userId: string) {
  this.logger.log(`Fetching invitations for user: ${userId}`);
  
  const invitations = await this.invitationRepository.find({
    where: { 
      invitedUserId: userId, 
      status: InvitationStatus.PENDING 
    },
    relations: ['group', 'inviter'],
    order: { createdAt: 'DESC' },
  });

  this.logger.log(`Found ${invitations.length} pending invitations for user: ${userId}`);

  return { 
    data: invitations,
    count: invitations.length 
  };
}

async acceptInvitation(invitationId: string, userId: string): Promise<{ message: string; group: any }> {
  this.logger.log(`User ${userId} attempting to accept invitation ${invitationId}`);
  
  const invitation = await this.invitationRepository.findOne({
    where: { 
      id: invitationId, 
      invitedUserId: userId, 
      status: InvitationStatus.PENDING 
    },
    relations: ['group'],
  });

  if (!invitation) {
    this.logger.warn(`Invitation not found or not pending: ${invitationId} for user ${userId}`);
    
    const anyInvitation = await this.invitationRepository.findOne({
      where: { id: invitationId },
    });
    
    if (!anyInvitation) {
      throw new NotFoundException(`Invitation with ID ${invitationId} does not exist`);
    }
    
    if (anyInvitation.invitedUserId !== userId) {
      throw new ForbiddenException('This invitation does not belong to you');
    }
    
    if (anyInvitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(`This invitation has already been ${anyInvitation.status.toLowerCase()}`);
    }
    
    throw new NotFoundException('Invitation not found');
  }
  const existingMember = await this.memberRepository.findOne({
    where: { 
      groupId: invitation.groupId, 
      userId,
      status: GroupMemberStatus.ACTIVE 
    },
  });

  if (existingMember) {
    throw new ConflictException('You are already a member of this group');
  }
  const member = this.memberRepository.create({
    groupId: invitation.groupId,
    userId,
    role: GroupMemberRole.MEMBER,
    status: GroupMemberStatus.ACTIVE,
    approvedAt: new Date(),
    approvedBy: userId,
  });

  await this.memberRepository.save(member);

  invitation.status = InvitationStatus.ACCEPTED;
  invitation.respondedAt = new Date();
  await this.invitationRepository.save(invitation);

  await this.groupRepository.increment({ id: invitation.groupId }, 'membersCount', 1);

  this.logger.log(`Invitation ${invitationId} accepted by user ${userId}. Added to group ${invitation.groupId}`);

  return { 
    message: 'Invitation accepted successfully',
    group: invitation.group 
  };
}

async rejectInvitation(invitationId: string, userId: string): Promise<{ message: string }> {
  this.logger.log(`User ${userId} attempting to reject invitation ${invitationId}`);
  
  const invitation = await this.invitationRepository.findOne({
    where: { 
      id: invitationId, 
      invitedUserId: userId, 
      status: InvitationStatus.PENDING 
    },
  });

  if (!invitation) {
    this.logger.warn(`Invitation not found or not pending: ${invitationId} for user ${userId}`);
    
    const anyInvitation = await this.invitationRepository.findOne({
      where: { id: invitationId },
    });
    
    if (!anyInvitation) {
      throw new NotFoundException(`Invitation with ID ${invitationId} does not exist`);
    }
    
    if (anyInvitation.invitedUserId !== userId) {
      throw new ForbiddenException('This invitation does not belong to you');
    }
    
    if (anyInvitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(`This invitation has already been ${anyInvitation.status.toLowerCase()}`);
    }
    
    throw new NotFoundException('Invitation not found');
  }

  invitation.status = InvitationStatus.REJECTED;
  invitation.respondedAt = new Date();
  await this.invitationRepository.save(invitation);

  this.logger.log(`Invitation ${invitationId} rejected by user ${userId}`);

  return { message: 'Invitation rejected successfully' };
}

  private async isMember(groupId: string, userId: string): Promise<boolean> {
    const member = await this.memberRepository.findOne({
      where: { groupId, userId, status: GroupMemberStatus.ACTIVE },
    });
    return !!member;
  }

  private async isAdmin(groupId: string, userId: string): Promise<boolean> {
    const member = await this.memberRepository.findOne({
      where: { groupId, userId, role: GroupMemberRole.ADMIN, status: GroupMemberStatus.ACTIVE },
    });
    return !!member;
  }

  private async checkMemberPermission(groupId: string, userId: string): Promise<void> {
    const isMember = await this.isMember(groupId, userId);
    if (!isMember) {
      throw new ForbiddenException('You must be a member to access this resource');
    }
  }

  private async checkAdminPermission(groupId: string, userId: string): Promise<void> {
    const isAdmin = await this.isAdmin(groupId, userId);
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can perform this action');
    }
  }
}