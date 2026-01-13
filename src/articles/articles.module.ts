import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { Article } from '../articles/entities/article.entity';
import {
  ArticleComment,
  ArticleLike,
  ArticleCommentLike,
  ArticleBookmark,
  ArticleView,
  ArticleShare,
} from '../entity/article-related.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Article,
      ArticleComment,
      ArticleLike,
      ArticleCommentLike,
      ArticleBookmark,
      ArticleView,
      ArticleShare,
    ]),
  ],
  controllers: [ArticlesController],
  providers: [ArticlesService],
  exports: [ArticlesService],
})
export class ArticlesModule {}