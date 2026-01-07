import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from 'src/user/entity/user.entity';
import { Child } from './child.entity';
import { Interest } from './interest.entity';
import { Gender } from 'src/enums/gender.enum';
import { ParentingStage } from 'src/enums/parenting-stage.enum';
import { ProfileVisibility } from 'src/enums/profile-visibility.enum';
import { ProfileInterest } from './profile-interest.entity';

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  displayName: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({
    type: 'enum',
    enum: Gender,
    nullable: true,
  })
  gender: Gender;

  @Column({ nullable: true })
  profilePhotoUrl: string;

  @Column({ nullable: true })
  coverPhotoUrl: string;

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  country: string;

  @Column({ type: 'int', default: 0 })
  numberOfChildren: number;

  @Column({
    type: 'enum',
    enum: ParentingStage,
    nullable: true,
  })
  parentingStage: ParentingStage;

  @Column({
    type: 'enum',
    enum: ProfileVisibility,
    default: ProfileVisibility.PUBLIC,
  })
  visibility: ProfileVisibility;

  @Column({ default: false })
  showLocation: boolean;

  @Column({ default: true })
  showAge: boolean;

  @Column({ default: true })
  showChildren: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ type: 'int', default: 0 })
  completionPercentage: number;

  @OneToMany(() => Child, (child) => child.profile, { cascade: true })
  children: Child[];

  @ManyToMany(() => Interest)
  @JoinTable({
    name: 'profile_interests',
    joinColumn: { name: 'profileId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'interestId', referencedColumnName: 'id' },
  })
  interests: Interest[];

  @OneToMany(() => ProfileInterest, (pi) => pi.profile)
  profileInterests: ProfileInterest[];

  @OneToMany(() => Child, (child) => child.profile, { cascade: true })
  childrenProfiles: Child[];



  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}