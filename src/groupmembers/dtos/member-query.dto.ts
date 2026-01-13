import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { GroupMemberRole } from 'src/enums/group-member-role.enum';
import { GroupMemberStatus } from 'src/enums/group-member-status.enum';

export class MemberQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsEnum(GroupMemberRole)
  role?: GroupMemberRole;

  @IsOptional()
  @IsEnum(GroupMemberStatus)
  status?: GroupMemberStatus;

  @IsOptional()
  @IsString()
  search?: string;
}