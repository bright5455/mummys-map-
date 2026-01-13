import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupPostsService } from './groupposts.service';
import { GroupPostsController } from './groupposts.controller';
import { GroupPost } from '../groupchat/entities/group-post.entity';
import { Group } from '../groupchat/entities/group.entity';
import { GroupMember } from '../groupchat/entities/group-member.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GroupPost,
      Group,
      GroupMember,
    ]),
  ],
  controllers: [GroupPostsController],
  providers: [GroupPostsService],
  exports: [GroupPostsService],
})
export class GroupPostsModule {}