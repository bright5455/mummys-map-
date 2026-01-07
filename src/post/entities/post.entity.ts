import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { PostLike } from './post-like.entity';
import { PostMedia } from './post-media.entity';
import { PostBookmark } from './post-bookmark.entity';
import { PostType } from 'src/enums/post-type.enum';
import { PostVisibility } from 'src/enums/post-visibility.enum';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({
    type: 'enum',
    enum: PostType,
    default: PostType.TEXT,
  })
  type: PostType;

  @Column({
    type: 'enum',
    enum: PostVisibility,
    default: PostVisibility.PUBLIC,
  })
  visibility: PostVisibility;

  @Column({ type: 'uuid', nullable: true })
  sharedPostId: string;

  @ManyToOne(() => Post, { nullable: true })
  @JoinColumn({ name: 'sharedPostId' })
  sharedPost: Post;

  @Column({ type: 'simple-array', nullable: true })
  hashtags: string[];

  @Column({ type: 'simple-array', nullable: true })
  mentions: string[];

  @Column({ type: 'int', default: 0 })
  likesCount: number;

  @Column({ type: 'int', default: 0 })
  commentsCount: number;

  @Column({ type: 'int', default: 0 })
  sharesCount: number;

  @Column({ type: 'int', default: 0 })
  bookmarksCount: number;

  @Column({ default: false })
  isPinned: boolean;

  @Column({ default: false })
  isEdited: boolean;

  @Column({ nullable: true })
  editedAt: Date;

  @OneToMany(() => PostLike, (like) => like.post, { cascade: true })
  likes: PostLike[];

  @OneToMany(() => PostMedia, (media) => media.post, { cascade: true })
  media: PostMedia[];

  @OneToMany(() => PostBookmark, (bookmark) => bookmark.post, { cascade: true })
  bookmarks: PostBookmark[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  deletedAt: Date;
}