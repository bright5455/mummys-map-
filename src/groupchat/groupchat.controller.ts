import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GroupsService } from './groupchat.service';
import { CreateGroupDto } from './dtos/create-group.dto';
import { UpdateGroupDto } from './dtos/update-group.dto';
import { GroupQueryDto } from './dtos/group-query.dto';
import { CreateGroupPostDto } from './dtos/create-group-post.dto';
import { UpdateGroupPostDto } from './dtos/update-group-post.dto';
import { InviteMemberDto } from './dtos/invite-member.dto';
import { UpdateMemberRoleDto } from './dtos/update-member-role.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new group' })
  @ApiResponse({ status: 201, description: 'Group created successfully' })
  create(
    @GetUser('id') userId: string,
    @Body() createGroupDto: CreateGroupDto,
  ) {
    return this.groupsService.create(userId, createGroupDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all groups with filters' })
  @ApiResponse({ status: 200, description: 'Groups retrieved successfully' })
  findAll(@Query() query: GroupQueryDto) {
    return this.groupsService.findAll(query);
  }

  @Get('my-groups')
  @ApiOperation({ summary: "Get current user's groups" })
  @ApiResponse({ status: 200, description: 'User groups retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMyGroups(
    @GetUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.groupsService.getMyGroups(userId, page, limit);
  }

  @Get('invitations')
  @ApiOperation({ summary: 'Get my group invitations' })
  @ApiResponse({ status: 200, description: 'Invitations retrieved successfully' })
  getMyInvitations(@GetUser('id') userId: string) {
    return this.groupsService.getMyInvitations(userId);
  }

  @Post('invitations/:id/accept')
  @ApiOperation({ summary: 'Accept a group invitation' })
  @ApiResponse({ status: 200, description: 'Invitation accepted successfully' })
  @ApiParam({ name: 'id', description: 'Invitation ID' })
  @HttpCode(HttpStatus.OK)
  acceptInvitation(
    @Param('id') invitationId: string,
    @GetUser('id') userId: string,
  ) {
    return this.groupsService.acceptInvitation(invitationId, userId);
  }

  @Post('invitations/:id/reject')
  @ApiOperation({ summary: 'Reject a group invitation' })
  @ApiResponse({ status: 200, description: 'Invitation rejected successfully' })
  @ApiParam({ name: 'id', description: 'Invitation ID' })
  @HttpCode(HttpStatus.OK)
  rejectInvitation(
    @Param('id') invitationId: string,
    @GetUser('id') userId: string,
  ) {
    return this.groupsService.rejectInvitation(invitationId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single group by ID' })
  @ApiResponse({ status: 200, description: 'Group retrieved successfully' })
  @ApiParam({ name: 'id', description: 'Group ID' })
  findOne(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.groupsService.findOne(id, userId);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get group statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiParam({ name: 'id', description: 'Group ID' })
  getGroupStats(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.groupsService.getGroupStats(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a group' })
  @ApiResponse({ status: 200, description: 'Group updated successfully' })
  @ApiParam({ name: 'id', description: 'Group ID' })
  update(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body() updateGroupDto: UpdateGroupDto,
  ) {
    return this.groupsService.update(id, userId, updateGroupDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a group' })
  @ApiResponse({ status: 204, description: 'Group deleted successfully' })
  @ApiParam({ name: 'id', description: 'Group ID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.groupsService.remove(id, userId);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Join a group' })
  @ApiResponse({ status: 200, description: 'Group joined successfully' })
  @ApiParam({ name: 'id', description: 'Group ID' })
  @HttpCode(HttpStatus.OK)
  joinGroup(@Param('id') groupId: string, @GetUser('id') userId: string) {
    return this.groupsService.joinGroup(groupId, userId);
  }

  @Delete(':id/leave')
  @ApiOperation({ summary: 'Leave a group' })
  @ApiResponse({ status: 200, description: 'Left group successfully' })
  @ApiParam({ name: 'id', description: 'Group ID' })
  @HttpCode(HttpStatus.OK)
  leaveGroup(@Param('id') groupId: string, @GetUser('id') userId: string) {
    return this.groupsService.leaveGroup(groupId, userId);
  }

  @Post(':id/invite')
  inviteMember(
    @Param('id') groupId: string,
    @GetUser('id') userId: string,
    @Body() inviteMemberDto: InviteMemberDto,
  ) {
    return this.groupsService.inviteMember(groupId, userId, inviteMemberDto);
  }

  @Get(':id/requests')
  getPendingRequests(
    @Param('id') groupId: string,
    @GetUser('id') userId: string,
  ) {
    return this.groupsService.getPendingRequests(groupId, userId);
  }

  @Post(':id/requests/:userId/approve')
  approveJoinRequest(
    @Param('id') groupId: string,
    @GetUser('id') userId: string,
    @Param('userId') requestUserId: string,
  ) {
    return this.groupsService.approveJoinRequest(
      groupId,
      userId,
      requestUserId,
    );
  }

  @Post(':id/requests/:userId/reject')
  rejectJoinRequest(
    @Param('id') groupId: string,
    @GetUser('id') userId: string,
    @Param('userId') requestUserId: string,
  ) {
    return this.groupsService.rejectJoinRequest(
      groupId,
      userId,
      requestUserId,
    );
  }

  @Get(':id/members')
  getMembers(
    @Param('id') groupId: string,
    @GetUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.groupsService.getMembers(groupId, userId, page, limit);
  }

  @Delete(':id/members/:userId')
  removeMember(
    @Param('id') groupId: string,
    @GetUser('id') adminUserId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.groupsService.removeMember(
      groupId,
      adminUserId,
      targetUserId,
    );
  }

  @Post(':id/members/:userId/ban')
  banMember(
    @Param('id') groupId: string,
    @GetUser('id') adminUserId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.groupsService.banMember(
      groupId,
      adminUserId,
      targetUserId,
    );
  }

  @Patch(':id/members/:userId/role')
  updateMemberRole(
    @Param('id') groupId: string,
    @GetUser('id') adminUserId: string,
    @Param('userId') targetUserId: string,
    @Body() updateMemberRoleDto: UpdateMemberRoleDto,
  ) {
    return this.groupsService.updateMemberRole(
      groupId,
      adminUserId,
      targetUserId,
      updateMemberRoleDto,
    );
  }

  @Post(':id/posts')
  createPost(
    @Param('id') groupId: string,
    @GetUser('id') userId: string,
    @Body() createGroupPostDto: CreateGroupPostDto,
  ) {
    return this.groupsService.createPost(
      groupId,
      userId,
      createGroupPostDto,
    );
  }

  @Get(':id/posts')
  getPosts(
    @Param('id') groupId: string,
    @GetUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.groupsService.getPosts(groupId, userId, page, limit);
  }

  @Get(':id/posts/:postId')
  getPost(
    @Param('id') groupId: string,
    @Param('postId') postId: string,
    @GetUser('id') userId: string,
  ) {
    return this.groupsService.getPost(groupId, postId, userId);
  }

  @Patch(':id/posts/:postId')
  updatePost(
    @Param('id') groupId: string,
    @Param('postId') postId: string,
    @GetUser('id') userId: string,
    @Body() updateGroupPostDto: UpdateGroupPostDto,
  ) {
    return this.groupsService.updatePost(
      groupId,
      postId,
      userId,
      updateGroupPostDto,
    );
  }

  @Delete(':id/posts/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deletePost(
    @Param('id') groupId: string,
    @Param('postId') postId: string,
    @GetUser('id') userId: string,
  ) {
    return this.groupsService.deletePost(groupId, postId, userId);
  }

  @Post(':id/posts/:postId/pin')
  pinPost(
    @Param('id') groupId: string,
    @Param('postId') postId: string,
    @GetUser('id') userId: string,
  ) {
    return this.groupsService.pinPost(groupId, postId, userId);
  }

  @Delete(':id/posts/:postId/pin')
  unpinPost(
    @Param('id') groupId: string,
    @Param('postId') postId: string,
    @GetUser('id') userId: string,
  ) {
    return this.groupsService.unpinPost(groupId, postId, userId);
  }
}
