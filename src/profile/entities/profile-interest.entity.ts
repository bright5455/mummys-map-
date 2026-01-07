import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Profile } from './profile.entity';
import { Interest } from './interest.entity';


@Entity('profile_interests')
@Index(['profileId', 'interestId'], { unique: true })
export class ProfileInterest {

  @Column({ type: 'uuid', primary: true })
  profileId: string;

  @ManyToOne(() => Profile, (profile) => profile.profileInterests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'profileId' })
  profile: Profile;

  @Column({ type: 'uuid', primary: true })
  interestId: string;

  @ManyToOne(() => Interest, (interest) => interest.profileInterests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'interestId' })
  interest: Interest;

  @CreateDateColumn()
  createdAt: Date;
}
