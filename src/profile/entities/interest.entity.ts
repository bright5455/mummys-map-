import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  OneToMany,
  Index,
} from 'typeorm';
import { Profile } from './profile.entity';
import { ProfileInterest } from './profile-interest.entity';


@Entity('interests')
export class Interest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  name: string;

  @Column({ nullable: true, default: null })
  description: string;

  @Column({ nullable: true, default: null })
  iconUrl: string;

  @Column({ nullable: true, default: null })
  category: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => ProfileInterest, (profileInterest) => profileInterest.interest)
  profileInterests: ProfileInterest[];
  

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}