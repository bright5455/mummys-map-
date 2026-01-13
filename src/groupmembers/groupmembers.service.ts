import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, IsNull } from 'typeorm';
import { GroupMember } from 'src/groupchat/entities/group-member.entity';
import { Group } from 'src/groupchat/entities/group.entity';
import { User } from '../user/entity/user.entity';
import { GroupInvitation } from 'src/groupchat/entities/group-invitation.entity';
import { GroupMemberRole } from 'src/enums/group-member-role.enum';
import { GroupMemberStatus } from 'src/enums/group-member-status.enum';
import { InvitationStatus } from 'src/enums/invitation-status.enum';
import { UpdateMemberRoleDto } from 'src/groupmembers/dtos/update-member-role.dto';
import { InviteMemberDto } from './dtos/invite-member.dto';
import { MemberQueryDto } from './dtos/member-query.dto';

@Injectable()
export class GroupMembersService {
  private readonly logger = new Logger(GroupMembersService.name);

  constructor(
    @InjectRepository(GroupMember)
    private readonly memberRepository: Repository<GroupMember>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(GroupInvitation)
    private readonly invitationRepository: Repository<GroupInvitation>,
  ) {}


  async joinGroup(groupId: string, userId: string) {
    const group = await this.groupRepository.findOne({
      where: { id: groupId, deletedAt: IsNull() },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (!group.isActive) {
      throw new BadRequestException('Group is not active');
    }
    const existingMember = await 
   this.memberRepository.findOne({
      where: { groupId, userId },
    });

    if (existingMember) {
      if (existingMember.status === GroupMemberStatus.ACTIVE) {
        throw new BadRequestException('Already a member of this group');
      }
      if (existingMember.status === GroupMemberStatus.BANNED) {
        throw new ForbiddenException('You are banned from this group');
      }
    }
    const status = GroupMemberStatus.ACTIVE;

    const member = this.memberRepository.create({
      groupId,
      userId,
      role: GroupMemberRole.MEMBER,
      status,
      approvedAt: new Date(),
      approvedBy: userId,
    });

    await this.memberRepository.save(member);
    await this.groupRepository.increment({ id: groupId }, 'membersCount', 1);

    this.logger.log(`User ${userId} joined group ${groupId}`);

    return {
      message: 'Successfully joined the group',
      member,
    };
  }

  async leaveGroup(groupId: string, userId: string) {
    const member = await this.memberRepository.findOne({
      where: {
        groupId,
        userId,
        status: GroupMemberStatus.ACTIVE,
      },
    });

    if (!member) {
      throw new NotFoundException('You are not a member of this group');
    }
    if (member.role === GroupMemberRole.ADMIN) {
      const adminCount = await this.memberRepository.count({
        where: {
          groupId,
          role: GroupMemberRole.ADMIN,
          status: GroupMemberStatus.ACTIVE,
        },
      });

      if (adminCount === 1) {
        throw new BadRequestException(
          'Cannot leave group. You are the only admin. Please promote another member to admin first.',
        );
      }
    }
    await this.memberRepository.remove(member);

    await this.groupRepository.decrement({ id: groupId }, 'membersCount', 1);

    this.logger.log(`User ${userId} left group ${groupId}`);

    return { message: 'Successfully left the group' };
  }

  async getGroupMembers(
    groupId: string,
    query: MemberQueryDto,
    currentUserId?: string,
  ) {
    const {
      page = 1,
      limit = 50,
      role,
      status = GroupMemberStatus.ACTIVE,
      search,
    } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.memberRepository
      .createQueryBuilder('member')
      .leftJoinAndSelect('member.user', 'user')
      .where('member.groupId = :groupId', { groupId })
      .andWhere('member.status = :status', { status });

    if (role) {
      queryBuilder.andWhere('member.role = :role', { role });
    }

    if (search) {
      queryBuilder.andWhere(
        '(LOWER(user.firstName) LIKE LOWER(:search) OR LOWER(user.lastName) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    queryBuilder
      .orderBy('member.role', 'ASC') 
      .addOrderBy('member.joinedAt', 'ASC')
      .skip(skip)
      .take(limit);

    const [members, total] = await queryBuilder.getManyAndCount();

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

  async getMember(groupId: string, userId: string) {
    const member = await this.memberRepository.findOne({
      where: { groupId, userId },
      relations: ['user'],
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return member;
  }
  async getPendingRequests(groupId: string, adminId: string) {
    await this.verifyAdminOrModeratorAccess(groupId, adminId);

    const requests = await this.memberRepository.find({
      where: {
        groupId,
        status: GroupMemberStatus.ACTIVE,
      },
      relations: ['user'],
      order: { joinedAt: 'DESC' },
    });

    return { data: requests };
  }

  async approveJoinRequest(
    groupId: string,
    requestUserId: string,
    adminId: string,
  ) {
    await this.verifyAdminOrModeratorAccess(groupId, adminId);

    const member = await this.memberRepository.findOne({
      where: {
        groupId,
        userId: requestUserId,
        status: GroupMemberStatus.ACTIVE,
      },
    });

    if (!member) {
      throw new NotFoundException('Join request not found');
    }

    member.status = GroupMemberStatus.ACTIVE;
    member.approvedAt = new Date();
    member.approvedBy = adminId;
    await this.memberRepository.save(member);

    await this.groupRepository.increment({ id: groupId }, 'membersCount', 1);

    this.logger.log(
      `Admin ${adminId} approved join request for user ${requestUserId} in group ${groupId}`,
    );

    return { message: 'Join request approved successfully' };
  }

  async rejectJoinRequest(
    groupId: string,
    requestUserId: string,
    adminId: string,
  ) {
    await this.verifyAdminOrModeratorAccess(groupId, adminId);

    const member = await this.memberRepository.findOne({
      where: {
        groupId,
        userId: requestUserId,
        status: GroupMemberStatus.ACTIVE,
      },
    });

    if (!member) {
      throw new NotFoundException('Join request not found');
    }

    await this.memberRepository.remove(member);

    this.logger.log(
      `Admin ${adminId} rejected join request for user ${requestUserId} in group ${groupId}`,
    );

    return { message: 'Join request rejected successfully' };
  }

  async inviteMember(
    groupId: string,
    inviteMemberDto: InviteMemberDto,
    inviterId: string,
  ) {
    const { userId, message } = inviteMemberDto;
    const group = await this.groupRepository.findOne({
      where: { id: groupId, deletedAt: IsNull() },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }
    const inviterMember = await this.memberRepository.findOne({
      where: {
        groupId,
        userId: inviterId,
        status: GroupMemberStatus.ACTIVE,
      },
    });

    if (!inviterMember) {
      throw new ForbiddenException('You are not a member of this group');
    }

    if (
      ![GroupMemberRole.ADMIN, GroupMemberRole.MODERATOR].includes(
        inviterMember.role,
      )
    ) {
      throw new ForbiddenException(
        'Only admins and moderators can invite members',
      );
    }
    const userToInvite = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!userToInvite) {
      throw new NotFoundException('User not found');
    }
    const existingMember = await this.memberRepository.findOne({
      where: { groupId, userId },
    });

    if (existingMember) {
      throw new BadRequestException('User is already a member of this group');
    }
    const existingInvitation = await this.invitationRepository.findOne({
      where: {
        groupId,
        invitedUserId: userId,
        status: InvitationStatus.PENDING,
      },
    });

    if (existingInvitation) {
      throw new BadRequestException('User has already been invited');
    }
    const invitation = this.invitationRepository.create({
      groupId,
      invitedUserId: userId,
      invitedBy: inviterId,
      status: InvitationStatus.PENDING,
      message: message || null,
      respondedAt: null,
    });

    await this.invitationRepository.save(invitation);

    this.logger.log(
      `User ${inviterId} invited user ${userId} to group ${groupId}`,
    );

    return {
      message: 'Invitation sent successfully',
      invitation,
    };
  }

  async getUserInvitations(userId: string) {
    const invitations = await this.invitationRepository.find({
      where: {
        invitedUserId: userId,
        status: InvitationStatus.PENDING,
      },
      relations: ['group', 'inviter'],
      order: { createdAt: 'DESC' },
    });

    return { data: invitations };
  }

  async acceptInvitation(invitationId: string, userId: string) {
    const invitation = await this.invitationRepository.findOne({
      where: {
        id: invitationId,
        invitedUserId: userId,
        status: InvitationStatus.PENDING,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }
    invitation.status = InvitationStatus.ACCEPTED;
    invitation.respondedAt = new Date();
    await this.invitationRepository.save(invitation);
    const member = this.memberRepository.create({
      groupId: invitation.groupId,
      userId,
      role: GroupMemberRole.MEMBER,
      status: GroupMemberStatus.ACTIVE,
      approvedAt: new Date(),
      approvedBy: userId,
    });
    await this.memberRepository.save(member);

    await this.groupRepository.increment(
      { id: invitation.groupId },
      'membersCount',
      1,
    );

    this.logger.log(
      `User ${userId} accepted invitation to group ${invitation.groupId}`,
    );

    return { message: 'Invitation accepted. You have joined the group' };
  }

  async rejectInvitation(invitationId: string, userId: string) {
    const invitation = await this.invitationRepository.findOne({
      where: {
        id: invitationId,
        invitedUserId: userId,
        status: InvitationStatus.PENDING,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    invitation.status = InvitationStatus.REJECTED;
    invitation.respondedAt = new Date();
    await this.invitationRepository.save(invitation);

    this.logger.log(
      `User ${userId} rejected invitation to group ${invitation.groupId}`,
    );

    return { message: 'Invitation rejected' };
  }

  async removeMember(groupId: string, memberUserId: string, adminId: string) {
    const adminMember = await this.verifyAdminOrModeratorAccess(
      groupId,
      adminId,
    );

    const memberToRemove = await this.memberRepository.findOne({
      where: {
        groupId,
        userId: memberUserId,
        status: GroupMemberStatus.ACTIVE,
      },
    });

    if (!memberToRemove) {
      throw new NotFoundException('Member not found');
    }
    if (memberUserId === adminId) {
      throw new BadRequestException(
        'Cannot remove yourself. Use leave group instead.',
      );
    }
    if (
      adminMember.role === GroupMemberRole.MODERATOR &&
      memberToRemove.role === GroupMemberRole.ADMIN
    ) {
      throw new ForbiddenException('Moderators cannot remove admins');
    }
    if (memberToRemove.role === GroupMemberRole.ADMIN) {
      const adminCount = await this.memberRepository.count({
        where: {
          groupId,
          role: GroupMemberRole.ADMIN,
          status: GroupMemberStatus.ACTIVE,
        },
      });

      if (adminCount === 1) {
        throw new BadRequestException(
          'Cannot remove the only admin. Promote another member first.',
        );
      }
    }

    await this.memberRepository.remove(memberToRemove);

    await this.groupRepository.decrement({ id: groupId }, 'membersCount', 1);

    this.logger.log(
      `Admin ${adminId} removed member ${memberUserId} from group ${groupId}`,
    );

    return { message: 'Member removed successfully' };
  }

  async banMember(groupId: string, memberUserId: string, adminId: string) {
    await this.verifyAdminAccess(groupId, adminId);

    const memberToBan = await this.memberRepository.findOne({
      where: {
        groupId,
        userId: memberUserId,
      },
    });

    if (!memberToBan) {
      throw new NotFoundException('Member not found');
    }
    if (memberUserId === adminId) {
      throw new BadRequestException('Cannot ban yourself');
    }
    if (memberToBan.role === GroupMemberRole.ADMIN) {
      throw new ForbiddenException('Cannot ban another admin');
    }

    const wasMember = memberToBan.status === GroupMemberStatus.ACTIVE;

    memberToBan.status = GroupMemberStatus.BANNED;
    await this.memberRepository.save(memberToBan);
    if (wasMember) {
      await this.groupRepository.decrement({ id: groupId }, 'membersCount', 1);
    }

    this.logger.log(
      `Admin ${adminId} banned member ${memberUserId} from group ${groupId}`,
    );

    return { message: 'Member banned successfully' };
  }

  async unbanMember(groupId: string, memberUserId: string, adminId: string) {
    await this.verifyAdminAccess(groupId, adminId);

    const memberToUnban = await this.memberRepository.findOne({
      where: {
        groupId,
        userId: memberUserId,
        status: GroupMemberStatus.BANNED,
      },
    });

    if (!memberToUnban) {
      throw new NotFoundException('Banned member not found');
    }

    await this.memberRepository.remove(memberToUnban);

    this.logger.log(
      `Admin ${adminId} unbanned member ${memberUserId} from group ${groupId}`,
    );

    return {
      message: 'Member unbanned successfully. They can rejoin the group.',
    };
  }

  async updateMemberRole(
    groupId: string,
    memberUserId: string,
    updateMemberRoleDto: UpdateMemberRoleDto,
    adminId: string,
  ) {
    await this.verifyAdminAccess(groupId, adminId);

    const member = await this.memberRepository.findOne({
      where: {
        groupId,
        userId: memberUserId,
        status: GroupMemberStatus.ACTIVE,
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }
    if (memberUserId === adminId) {
      throw new BadRequestException('Cannot change your own role');
    }

    const oldRole = member.role;
    member.role = updateMemberRoleDto.role;
    await this.memberRepository.save(member);

    this.logger.log(
      `Admin ${adminId} changed member ${memberUserId} role from ${oldRole} to ${updateMemberRoleDto.role} in group ${groupId}`,
    );

    return {
      message: `Member role updated to ${updateMemberRoleDto.role}`,
      member,
    };
  }

  async updateMemberSettings(
    groupId: string,
    userId: string,
    settings: { receiveNotifications?: boolean; isMuted?: boolean },
  ) {
    const member = await this.memberRepository.findOne({
      where: {
        groupId,
        userId,
        status: GroupMemberStatus.ACTIVE,
      },
    });

    if (!member) {
      throw new NotFoundException('You are not a member of this group');
    }

    Object.assign(member, settings);
    await this.memberRepository.save(member);

    return { message: 'Settings updated successfully', member };
  }

  async isMember(groupId: string, userId: string): Promise<boolean> {
    const member = await this.memberRepository.findOne({
      where: {
        groupId,
        userId,
        status: GroupMemberStatus.ACTIVE,
      },
    });
    return !!member;
  }

  async getMemberRole(
    groupId: string,
    userId: string,
  ): Promise<GroupMemberRole | null> {
    const member = await this.memberRepository.findOne({
      where: {
        groupId,
        userId,
        status: GroupMemberStatus.ACTIVE,
      },
    });
    return member?.role || null;
  }

  async canManageMembers(groupId: string, userId: string): Promise<boolean> {
    const role = await this.getMemberRole(groupId, userId);
    if (!role) return false;
    return [GroupMemberRole.ADMIN, GroupMemberRole.MODERATOR].includes(role);
  }

  async getMembersCount(
    groupId: string,
    status?: GroupMemberStatus,
  ): Promise<number> {
    const where: any = { groupId };
    if (status) {
      where.status = status;
    }
    return this.memberRepository.count({ where });
  }

  private async verifyAdminAccess(
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

    if (member.role !== GroupMemberRole.ADMIN) {
      throw new ForbiddenException('Only admins can perform this action');
    }

    return member;
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

    if (
      ![GroupMemberRole.ADMIN, GroupMemberRole.MODERATOR].includes(member.role)
    ) {
      throw new ForbiddenException(
        'Only admins and moderators can perform this action',
      );
    }

    return member;
  }
}