import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { MediaType } from 'src/enums/media-type.enum';
import { MediaContext } from 'src/enums/media-context.enum';

@Entity('media')
export class Media {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'userId' })
  user?: User;

  
  @Column({ type: 'varchar' })
  originalName: string;

  
  @Column({ type: 'varchar', unique: true })
  filename: string;

  
  @Column({ type: 'varchar' })
  url: string;

  
  @Column({ type: 'varchar', nullable: true })
  thumbnailUrl: string | null;

 
  @Column({ type: 'varchar', nullable: true })
  mediumUrl: string | null;

 
  @Column({ type: 'varchar', nullable: true })
  smallUrl: string | null;

  @Column({
    type: 'enum',
    enum: MediaType,
  })
  @Index()
  mediaType: MediaType;

  
  @Column({
    type: 'enum',
    enum: MediaContext,
    nullable: true,
  })
  @Index()
  context: MediaContext | null;

 
  @Column({ type: 'uuid', nullable: true })
  @Index()
  contextId: string | null;

  
  @Column({ type: 'bigint' })
  fileSize: number;

  @Column({ type: 'varchar' })
  mimeType: string;

  
  @Column({ type: 'int', nullable: true })
  width: number | null;

  @Column({ type: 'int', nullable: true })
  height: number | null;

 
  @Column({ type: 'int', nullable: true })
  duration: number | null;

  @Column({ type: 'varchar', nullable: true })
  aspectRatio: string | null;

  
  @Column({ type: 'varchar', nullable: true })
  storageProvider: string | null;

  @Column({ type: 'varchar', nullable: true })
  publicId: string | null;

  @Column({ type: 'varchar', nullable: true })
  bucket: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

 
  @Column({ type: 'boolean', default: false })
  isPublic: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  
  @Column({ type: 'varchar', nullable: true })
  altText: string | null;

  
  @Column({ type: 'text', nullable: true })
  caption: string | null;

 
  @Column({ type: 'int', default: 0 })
  displayOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}