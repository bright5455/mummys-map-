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
import { LikeableType } from 'src/enums/likeable-type.enum';

@Entity('likes')
@Index(['likeableType', 'likeableId', 'userId'], { unique: true })
export class Like {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'userId' })
  user: User;

 
  @Column({
    type: 'enum',
    enum: LikeableType,
  })
  @Index()
  likeableType: LikeableType;

  @Column({ type: 'uuid' })
  @Index()
  likeableId: string;

  
  @Column({ type: 'uuid', nullable: true })
  @Index()
  contentOwnerId: string;

  @ManyToOne(() => User, { eager: false, nullable: true })
  @JoinColumn({ name: 'contentOwnerId' })
  contentOwner: User;

  @CreateDateColumn()
  createdAt: Date;
}