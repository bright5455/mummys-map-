import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { FollowStatus } from 'src/enums/follow-status.enum';

@Entity('follows')
@Index(['followerId', 'followingId'], { unique: true })
export class Follow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  followerId: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'followerId' })
  follower: User;

  @Column({ type: 'uuid' })
  @Index()
  followingId: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'followingId' })
  following: User;

  @Column({
    type: 'enum',
    enum: FollowStatus,
    default: FollowStatus.ACCEPTED,
  })
  @Index()
  status: FollowStatus;
  
  @Column({ default: false })
  isMuted: boolean;

  @Column({ default: false })
  showNotifications: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  acceptedAt: Date;
}