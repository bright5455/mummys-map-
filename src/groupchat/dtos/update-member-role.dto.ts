import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { GroupMemberRole } from 'src/enums/group-member-role.enum';

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: GroupMemberRole })
  @IsEnum(GroupMemberRole)
  @IsNotEmpty()
  role: GroupMemberRole;
}