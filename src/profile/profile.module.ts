import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfilesService } from 'src/profile/profile.service';
import { ProfilesController } from 'src/profile/profile.controller';
import { Profile } from './entities/profile.entity';
import { Child } from './entities/child.entity';
import { Interest } from './entities/interest.entity';
import { AuthModule } from '../auth/auth.module';
import { ProfileInterest } from './entities/profile-interest.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Profile, Child, Interest, ProfileInterest]),
    AuthModule,
  ],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfileModule {}