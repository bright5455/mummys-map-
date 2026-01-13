import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GroupMembersService } from './groupmembers.service';
import { UpdateMemberRoleDto } from 'src/groupchat/dtos/update-member-role.dto';
import { InviteMemberDto } from 'src/groupchat/dtos/invite-member.dto';
import { MemberQueryDto } from 'src/groupmembers/dtos/member-query.dto';
import { UpdateMemberSettingsDto } from 'src/groupmembers/dtos/update-member-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('group-members')
@Controller('groups/:groupId/members')
export class GroupMembersController {
  constructor(private readonly groupMembersService: GroupMembersService) {}

  @Post('join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Join a group' })
  @ApiResponse({ status: 200, description: 'Successfully joined or request sent' })
  @ApiResponse({ status: 400, description: 'Already a member or banned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  @ApiParam({ name: 'groupId', type: String })
  joinGroup(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.groupMembersService.joinGroup(groupId, userId);
  }

  @Post('leave')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Leave a group' })
  @ApiResponse({ status: 200, description: 'Successfully left the group' })
  @ApiResponse({ status: 400, description: 'Cannot leave (only admin)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not a member' })
  @ApiParam({ name: 'groupId', type: String })
  leaveGroup(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.groupMembersService.leaveGroup(groupId, userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get group members' })
  @ApiResponse({ status: 200, description: 'Members retrieved successfully' })
  @ApiParam({ name: 'groupId', type: String })
  getGroupMembers(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Query() query: MemberQueryDto,
    @CurrentUser('id') currentUserId?: string,
  ) {
    return this.groupMembersService.getGroupMembers(groupId, query, currentUserId);
  }

  @Get(':userId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get specific member details' })
  @ApiResponse({ status: 200, description: 'Member retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  @ApiParam({ name: 'groupId', type: String })
  @ApiParam({ name: 'userId', type: String })
  getMember(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.groupMembersService.getMember(groupId, userId);
  }

  @Get('requests/pending')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pending join requests (admin/moderator only)' })
  @ApiResponse({ status: 200, description: 'Requests retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not admin/moderator' })
  @ApiParam({ name: 'groupId', type: String })
  getPendingRequests(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.groupMembersService.getPendingRequests(groupId, adminId);
  }

  @Post('requests/:userId/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve join request (admin/moderator only)' })
  @ApiResponse({ status: 200, description: 'Request approved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not admin/moderator' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  @ApiParam({ name: 'groupId', type: String })
  @ApiParam({ name: 'userId', type: String })
  approveJoinRequest(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.groupMembersService.approveJoinRequest(groupId, userId, adminId);
  }

  @Post('requests/:userId/reject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject join request (admin/moderator only)' })
  @ApiResponse({ status: 200, description: 'Request rejected successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not admin/moderator' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  @ApiParam({ name: 'groupId', type: String })
  @ApiParam({ name: 'userId', type: String })
  rejectJoinRequest(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.groupMembersService.rejectJoinRequest(groupId, userId, adminId);
  }

  @Post('invite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Invite a user to the group' })
  @ApiResponse({ status: 200, description: 'Invitation sent successfully' })
  @ApiResponse({ status: 400, description: 'Already member or invited' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'No permission to invite' })
  @ApiParam({ name: 'groupId', type: String })
  inviteMember(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() inviteMemberDto: InviteMemberDto,
    @CurrentUser('id') inviterId: string,
  ) {
    return this.groupMembersService.inviteMember(groupId, inviteMemberDto, inviterId);
  }

  @Delete(':userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a member (admin/moderator only)' })
  @ApiResponse({ status: 200, description: 'Member removed successfully' })
  @ApiResponse({ status: 400, description: 'Cannot remove only admin' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not admin/moderator' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  @ApiParam({ name: 'groupId', type: String })
  @ApiParam({ name: 'userId', type: String })
  removeMember(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.groupMembersService.removeMember(groupId, userId, adminId);
  }

  @Post(':userId/ban')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ban a member (admin only)' })
  @ApiResponse({ status: 200, description: 'Member banned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only admins can ban' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  @ApiParam({ name: 'groupId', type: String })
  @ApiParam({ name: 'userId', type: String })
  banMember(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.groupMembersService.banMember(groupId, userId, adminId);
  }

  @Post(':userId/unban')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unban a member (admin only)' })
  @ApiResponse({ status: 200, description: 'Member unbanned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only admins can unban' })
  @ApiResponse({ status: 404, description: 'Banned member not found' })
  @ApiParam({ name: 'groupId', type: String })
  @ApiParam({ name: 'userId', type: String })
  unbanMember(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.groupMembersService.unbanMember(groupId, userId, adminId);
  }

  @Patch(':userId/role')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update member role (admin only)' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only admins can change roles' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  @ApiParam({ name: 'groupId', type: String })
  @ApiParam({ name: 'userId', type: String })
  updateMemberRole(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() updateMemberRoleDto: UpdateMemberRoleDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.groupMembersService.updateMemberRole(
      groupId,
      userId,
      updateMemberRoleDto,
      adminId,
    );
  }

  @Patch('settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update your membership settings' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not a member' })
  @ApiParam({ name: 'groupId', type: String })
  updateMemberSettings(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @CurrentUser('id') userId: string,
    @Body() settings: UpdateMemberSettingsDto,
  ) {
    return this.groupMembersService.updateMemberSettings(groupId, userId, settings);
  }
}

@ApiTags('group-invitations')
@Controller('group-invitations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GroupInvitationsController {
  constructor(private readonly groupMembersService: GroupMembersService) {}

  @Get()
  @ApiOperation({ summary: 'Get my group invitations' })
  @ApiResponse({ status: 200, description: 'Invitations retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getUserInvitations(@CurrentUser('id') userId: string) {
    return this.groupMembersService.getUserInvitations(userId);
  }

  @Post(':id/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept group invitation' })
  @ApiResponse({ status: 200, description: 'Invitation accepted, joined group' })
  @ApiResponse({ status: 400, description: 'Invitation expired' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  @ApiParam({ name: 'id', type: String })
  acceptInvitation(
    @Param('id', ParseUUIDPipe) invitationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.groupMembersService.acceptInvitation(invitationId, userId);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject group invitation' })
  @ApiResponse({ status: 200, description: 'Invitation rejected' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  @ApiParam({ name: 'id', type: String })
  rejectInvitation(
    @Param('id', ParseUUIDPipe) invitationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.groupMembersService.rejectInvitation(invitationId, userId);
  }
}