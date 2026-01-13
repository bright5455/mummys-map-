import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupsController } from './groupchat.controller';
import { GroupsService } from './groupchat.service';
import { Group } from './entities/group.entity';
import { GroupMember } from './entities/group-member.entity';
import { GroupPost } from './entities/group-post.entity';
import { GroupInvitation } from './entities/group-invitation.entity';
import { GroupJoinRequest } from 'src/groupchat/entities/group-join-request.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Group,
      GroupMember,
      GroupPost,
      GroupInvitation,
      GroupJoinRequest,
    ]),
  ],
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}