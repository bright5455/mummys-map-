import { Profile } from 'src/profile/entities/profile.entity';
import { Child } from 'src/profile/entities/child.entity';
import { Interest } from 'src/profile/entities/interest.entity';

export interface ProfileResponse {
  profile: Profile;
  age?: number;
  childrenAges?: number[];
}

export interface ProfileWithRelations extends Profile {
  children: Child[];
  interests: Interest[];
}