import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { GroupMember } from './group-member.entity';
import { GroupPost } from './group-post.entity';
import { GroupPrivacy } from 'src/enums/group-privacy.enum';

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: GroupPrivacy,
    default: GroupPrivacy.PUBLIC,
  })
  @Index()
  privacy: GroupPrivacy;

  @Column({ type: 'varchar', nullable: true })
  coverImage: string | null;

  @Column({ type: 'varchar', nullable: true })
  avatarImage: string | null;

  @Column({ type: 'text', nullable: true })
  rules: string | null;

  @Column({ type: 'varchar', nullable: true })
  category: string | null;

  @Column({ type: 'varchar', nullable: true })
  location: string | null;

  @Column({ type: 'int', default: 0 })
  membersCount: number;

  @Column({ type: 'int', default: 0 })
  postsCount: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  requireApproval: boolean;

  @Column({ type: 'boolean', default: true })
  allowMemberInvites: boolean;

  @Column({ type: 'boolean', default: true })
  allowMemberPosts: boolean;

  @OneToMany(() => GroupMember, (member) => member.group)
  members?: GroupMember[];

  @OneToMany(() => GroupPost, (post) => post.group)
  posts?: GroupPost[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}
