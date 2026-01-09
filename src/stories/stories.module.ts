import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { StoriesService } from './stories.service';
import { StoriesController } from './stories.controller';
import { Story } from './entities/story.entity';
import { StoryView } from './entities/story-view.entity';
import { StoryReply } from './entities/story-reply.entity';
import { StoryHighlight } from './entities/story-highlight.entity';
import { User } from '../user/entity/user.entity';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Story,
      StoryView,
      StoryReply,
      StoryHighlight,
      User,
    ]),
    ScheduleModule.forRoot(),
    MediaModule,
  ],
  controllers: [StoriesController],
  providers: [StoriesService],
  exports: [StoriesService],
})
export class StoriesModule {}