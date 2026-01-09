import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { StoryView } from './story-view.entity';
import { StoryReply } from './story-reply.entity';
import { StoryType } from 'src/enums/story-type.enum';
import { StoryPrivacy } from 'src/enums/story-privacy.enum';

@Entity('stories')
export class Story {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({
    type: 'enum',
    enum: StoryType,
    default: StoryType.IMAGE,
  })
  type: StoryType;

  @Column({ type: 'varchar' })
  mediaUrl: string;

  @Column({ type: 'varchar', nullable: true })
  thumbnailUrl: string | null;

  @Column({ type: 'int', nullable: true })
  duration: number | null;

  @Column({ type: 'int', nullable: true })
  width: number | null;

  @Column({ type: 'int', nullable: true })
  height: number | null;

  @Column({ type: 'text', nullable: true })
  caption: string | null;

  @Column({ type: 'text', nullable: true })
  textOverlay: string | null;

  @Column({ type: 'varchar', nullable: true })
  backgroundColor: string | null;

  @Column({
    type: 'enum',
    enum: StoryPrivacy,
    default: StoryPrivacy.PUBLIC,
  })
  @Index()
  privacy: StoryPrivacy;

  @Column({ type: 'int', default: 0 })
  viewsCount: number;

  @Column({ type: 'int', default: 0 })
  repliesCount: number;

  @Column({ type: 'boolean', default: false })
  isMuted: boolean;

  @Column({ type: 'boolean', default: true })
  allowReplies: boolean;

  @Column({ type: 'boolean', default: true })
  showViewers: boolean;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  highlightId: string | null;

  @Column({ type: 'boolean', default: false })
  isHighlight: boolean;

  @OneToMany(() => StoryView, (view) => view.story, { cascade: true })
  views?: StoryView[];

  @OneToMany(() => StoryReply, (reply) => reply.story, { cascade: true })
  replies?: StoryReply[];

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp' })
  @Index()
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}