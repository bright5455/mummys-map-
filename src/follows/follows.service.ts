import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { Follow } from './entities/follow.entity';
import { Block } from './entities/block.entity';
import { User } from '../user/entity/user.entity';
import { FollowUserDto } from './dtos/follow-user.dto';
import { BlockUserDto } from './dtos/block-user.dto';
import { UpdateFollowDto } from './dtos/update-follow.dto';
import { FollowStatus } from 'src/enums/follow-status.enum';

@Injectable()
export class FollowsService {
  private readonly logger = new Logger(FollowsService.name);

  constructor(
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async followUser(userId: string, followUserDto: FollowUserDto) {
    const { followingId, showNotifications = true } = followUserDto;

    if (userId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }
    const userToFollow = await this.userRepository.findOne({
      where: { id: followingId },
    });

    if (!userToFollow) {
      throw new NotFoundException('User not found');
    }
    const isBlocked = await this.isBlocked(userId, followingId);
    if (isBlocked) {
      throw new ForbiddenException('You cannot follow this user');
    }
    const existingFollow = await this.followRepository.findOne({
      where: { followerId: userId, followingId },
    });

    if (existingFollow) {
      throw new BadRequestException('You are already following this user');
    }
    const status = userToFollow.isPrivate
      ? FollowStatus.PENDING
      : FollowStatus.ACCEPTED;

    const followData: any = {
      followerId: userId,
      followingId,
      status,
      showNotifications,
    };

    if (status === FollowStatus.ACCEPTED) {
      followData.acceptedAt = new Date();
    }

    const follow = this.followRepository.create(followData);

    const savedFollow = await this.followRepository.save(follow);
    if (status === FollowStatus.ACCEPTED) {
      await this.updateFollowCounts(userId, followingId, 'increment');
    }

    this.logger.log(
      `User ${userId} ${status === FollowStatus.PENDING ? 'requested to follow' : 'followed'} user ${followingId}`,
    );

    return {
      message:
        status === FollowStatus.PENDING
          ? 'Follow request sent'
          : 'User followed successfully',
      follow: savedFollow,
    };
  }

  async unfollowUser(userId: string, followingId: string) {
    const follow = await this.followRepository.findOne({
      where: { followerId: userId, followingId },
    });

    if (!follow) {
      throw new NotFoundException('You are not following this user');
    }

    await this.followRepository.remove(follow);
    if (follow.status === FollowStatus.ACCEPTED) {
      await this.updateFollowCounts(userId, followingId, 'decrement');
    }

    this.logger.log(`User ${userId} unfollowed user ${followingId}`);

    return { message: 'User unfollowed successfully' };
  }

  async acceptFollowRequest(userId: string, followerId: string) {
    const follow = await this.followRepository.findOne({
      where: {
        followerId,
        followingId: userId,
        status: FollowStatus.PENDING,
      },
    });

    if (!follow) {
      throw new NotFoundException('Follow request not found');
    }

    follow.status = FollowStatus.ACCEPTED;
    follow.acceptedAt = new Date();

    await this.followRepository.save(follow);
    await this.updateFollowCounts(followerId, userId, 'increment');

    this.logger.log(`User ${userId} accepted follow request from ${followerId}`);

    return { message: 'Follow request accepted' };
  }

  async rejectFollowRequest(userId: string, followerId: string) {
    const follow = await this.followRepository.findOne({
      where: {
        followerId,
        followingId: userId,
        status: FollowStatus.PENDING,
      },
    });

    if (!follow) {
      throw new NotFoundException('Follow request not found');
    }

    await this.followRepository.remove(follow);

    this.logger.log(`User ${userId} rejected follow request from ${followerId}`);

    return { message: 'Follow request rejected' };
  }

  async getFollowRequests(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [requests, total] = await this.followRepository.findAndCount({
      where: {
        followingId: userId,
        status: FollowStatus.PENDING,
      },
      relations: ['follower'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: requests,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getFollowers(userId: string, page: number = 1, limit: number = 20, currentUserId?: string) {
    const skip = (page - 1) * limit;

    const [follows, total] = await this.followRepository.findAndCount({
      where: {
        followingId: userId,
        status: FollowStatus.ACCEPTED,
      },
      relations: ['follower'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const followers = await this.enrichFollowData(
      follows.map((f) => f.follower),
      currentUserId,
    );

    return {
      data: followers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getFollowing(userId: string, page: number = 1, limit: number = 20, currentUserId?: string) {
    const skip = (page - 1) * limit;

    const [follows, total] = await this.followRepository.findAndCount({
      where: {
        followerId: userId,
        status: FollowStatus.ACCEPTED,
      },
      relations: ['following'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const following = await this.enrichFollowData(
      follows.map((f) => f.following),
      currentUserId,
    );

    return {
      data: following,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMutualFollows(userId: string, targetUserId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const userFollowing = await this.followRepository.find({
      where: { followerId: userId, status: FollowStatus.ACCEPTED },
      select: ['followingId'],
    });

    const targetFollowing = await this.followRepository.find({
      where: { followerId: targetUserId, status: FollowStatus.ACCEPTED },
      select: ['followingId'],
    });

    const userFollowingIds = new Set(userFollowing.map((f) => f.followingId));
    const mutualIds = targetFollowing
      .filter((f) => userFollowingIds.has(f.followingId))
      .map((f) => f.followingId);

    if (mutualIds.length === 0) {
      return {
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 },
      };
    }

    const total = mutualIds.length;
    const paginatedIds = mutualIds.slice(skip, skip + limit);

    const mutualUsers = await this.userRepository.find({
      where: { id: In(paginatedIds) },
    });

    const enrichedUsers = await this.enrichFollowData(mutualUsers, userId);

    return {
      data: enrichedUsers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getFollowStats(userId: string) {
    const followersCount = await this.followRepository.count({
      where: { followingId: userId, status: FollowStatus.ACCEPTED },
    });

    const followingCount = await this.followRepository.count({
      where: { followerId: userId, status: FollowStatus.ACCEPTED },
    });

    const pendingRequestsCount = await this.followRepository.count({
      where: { followingId: userId, status: FollowStatus.PENDING },
    });

    return {
      followers: followersCount,
      following: followingCount,
      pendingRequests: pendingRequestsCount,
    };
  }

async getSuggestedUsers(currentUserId: string) {
  const following = await this.followRepository.find({
    where: {
      followerId: currentUserId,
      status: FollowStatus.ACCEPTED,
    },
    select: ['followingId'],
  });

  const followingIds = following.map(f => f.followingId);
  if (!followingIds.length) {
    return [];
  }
  const result = await this.followRepository
    .createQueryBuilder('follow')
    .select('follow.followingId', 'userId')
    .addSelect('COUNT(follow.id)', 'mutualCount')
    .where('follow.followerId IN (:...followingIds)', {
      followingIds,
    })
    .andWhere('follow.followingId != :currentUserId', {
      currentUserId,
    })
    .andWhere('follow.status = :status', {
      status: FollowStatus.ACCEPTED,
    })
    .andWhere(`
      follow.followingId NOT IN (
        SELECT "f"."followingId"
        FROM "follows" "f"
        WHERE "f"."followerId" = :currentUserId
      )
    `)
    .groupBy('follow.followingId')
    .orderBy('"mutualCount"', 'DESC')
    .limit(10)
    .getRawMany();

  return result;
}

  async updateFollow(userId: string, followingId: string, updateFollowDto: UpdateFollowDto) {
    const follow = await this.followRepository.findOne({
      where: { followerId: userId, followingId, status: FollowStatus.ACCEPTED },
    });

    if (!follow) {
      throw new NotFoundException('Follow relationship not found');
    }

    Object.assign(follow, updateFollowDto);

    await this.followRepository.save(follow);

    return { message: 'Follow settings updated successfully' };
  }

  async blockUser(userId: string, blockUserDto: BlockUserDto) {
    const { blockedId, reason } = blockUserDto;

    if (userId === blockedId) {
      throw new BadRequestException('You cannot block yourself');
    }
    const existingBlock = await this.blockRepository.findOne({
      where: { blockerId: userId, blockedId },
    });

    if (existingBlock) {
      throw new BadRequestException('User is already blocked');
    }
    await this.followRepository.delete({ followerId: userId, followingId: blockedId });
    await this.followRepository.delete({ followerId: blockedId, followingId: userId });
    const block = this.blockRepository.create({
      blockerId: userId,
      blockedId,
      reason,
    });

    await this.blockRepository.save(block);

    this.logger.log(`User ${userId} blocked user ${blockedId}`);

    return { message: 'User blocked successfully' };
  }

  async unblockUser(userId: string, blockedId: string) {
    const block = await this.blockRepository.findOne({
      where: { blockerId: userId, blockedId },
    });

    if (!block) {
      throw new NotFoundException('User is not blocked');
    }

    await this.blockRepository.remove(block);

    this.logger.log(`User ${userId} unblocked user ${blockedId}`);

    return { message: 'User unblocked successfully' };
  }

  async getBlockedUsers(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [blocks, total] = await this.blockRepository.findAndCount({
      where: { blockerId: userId },
      relations: ['blocked'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: blocks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await this.followRepository.findOne({
      where: { followerId, followingId, status: FollowStatus.ACCEPTED },
    });
    return !!follow;
  }

  async isBlocked(userId: string, targetUserId: string): Promise<boolean> {
    const block = await this.blockRepository.findOne({
      where: [
        { blockerId: userId, blockedId: targetUserId },
        { blockerId: targetUserId, blockedId: userId },
      ],
    });
    return !!block;
  }

  async getFollowStatus(
    currentUserId: string,
    targetUserId: string,
  ): Promise<{
    isFollowing: boolean;
    followsYou: boolean;
    isMutual: boolean;
    isPending: boolean;
  }> {
    const [following, followsYou] = await Promise.all([
      this.followRepository.findOne({
        where: { followerId: currentUserId, followingId: targetUserId },
      }),
      this.followRepository.findOne({
        where: { followerId: targetUserId, followingId: currentUserId },
      }),
    ]);

    return {
      isFollowing: following?.status === FollowStatus.ACCEPTED,
      followsYou: followsYou?.status === FollowStatus.ACCEPTED,
      isMutual:
        following?.status === FollowStatus.ACCEPTED &&
        followsYou?.status === FollowStatus.ACCEPTED,
      isPending: following?.status === FollowStatus.PENDING,
    };
  }

  private async enrichFollowData(users: User[], currentUserId?: string) {
    if (!currentUserId) {
      return users;
    }

    return Promise.all(
      users.map(async (user) => {
        const status = await this.getFollowStatus(currentUserId, user.id);
        return {
          ...user,
          ...status,
        };
      }),
    );
  }

  private async updateFollowCounts(
    followerId: string,
    followingId: string,
    action: 'increment' | 'decrement',
  ) {
    const amount = action === 'increment' ? 1 : -1;

    await this.userRepository.increment({ id: followerId }, 'followingCount', amount);
    await this.userRepository.increment({ id: followingId }, 'followersCount', amount);
  }
}