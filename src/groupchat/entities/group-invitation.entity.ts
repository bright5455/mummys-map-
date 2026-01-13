import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Group } from './group.entity';
import { User } from '../../user/entity/user.entity';
import { InvitationStatus } from 'src/enums/invitation-status.enum';

@Entity('group_invitations')
export class GroupInvitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  groupId: string;

  @ManyToOne(() => Group)
  @JoinColumn({ name: 'groupId' })
  group?: Group;

  @Column({ type: 'uuid' })
  @Index()
  invitedUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'invitedUserId' })
  invitedUser?: User;

  @Column({ type: 'uuid' })
  invitedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'invitedBy' })
  inviter?: User;

  @Column({
    type: 'enum',
    enum: InvitationStatus,
    default: InvitationStatus.PENDING,
  })
  @Index()
  status: InvitationStatus;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  respondedAt: Date | null;
}
