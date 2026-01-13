import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupMembersService } from './groupmembers.service';
import { GroupMembersController, GroupInvitationsController } from './groupmembers.controller';
import { GroupMember } from '../groupchat/entities/group-member.entity';
import { Group } from '../groupchat/entities/group.entity';
import { User } from '../user/entity/user.entity';
import { GroupInvitation } from '../groupchat/entities/group-invitation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GroupMember,
      Group,
      User,
      GroupInvitation,
    ]),
  ],
  controllers: [GroupMembersController, GroupInvitationsController],
  providers: [GroupMembersService],
  exports: [GroupMembersService],
})
export class GroupMembersModule {}