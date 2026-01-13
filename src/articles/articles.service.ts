import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In, Not } from 'typeorm';
import { Article, ArticleStatus } from '../articles/entities/article.entity';
import {
  ArticleComment,
  ArticleLike,
  ArticleCommentLike,
  ArticleBookmark,
  ArticleView,
  ArticleShare,
} from '../entity/article-related.entity';
import {
  CreateArticleDto,
  UpdateArticleDto,
  CreateArticleCommentDto,
  UpdateArticleCommentDto,
  QueryArticlesDto,
  QueryCommentsDto,
  TrackArticleViewDto,
  ShareArticleDto,
} from '../articles/dtos/article.dto';
@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(ArticleComment)
    private readonly commentRepository: Repository<ArticleComment>,
    @InjectRepository(ArticleLike)
    private readonly likeRepository: Repository<ArticleLike>,
    @InjectRepository(ArticleCommentLike)
    private readonly commentLikeRepository: Repository<ArticleCommentLike>,
    @InjectRepository(ArticleBookmark)
    private readonly bookmarkRepository: Repository<ArticleBookmark>,
    @InjectRepository(ArticleView)
    private readonly viewRepository: Repository<ArticleView>,
    @InjectRepository(ArticleShare)
    private readonly shareRepository: Repository<ArticleShare>,
  ) {}

  async create(userId: string, dto: CreateArticleDto) {
    const slug = await this.generateUniqueSlug(dto.title);
    const readingTime = this.calculateReadingTime(dto.content);

    const article = this.articleRepository.create({
      ...dto,
      slug,
      readingTime,
      authorId: userId,
    });

    if (dto.status === ArticleStatus.PUBLISHED) {
      article.publishedAt = new Date();
    }

    return await this.articleRepository.save(article);
  }

  async findAll(query: QueryArticlesDto, currentUserId?: string) {
    const { page = 1, limit = 20, search, status, category, tag, authorId, sortBy, isFeatured } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author')
      .leftJoinAndSelect('author.profile', 'profile')
      .where('article.status = :status', { status: status || ArticleStatus.PUBLISHED });

    if (search) {
      queryBuilder.andWhere(
        '(article.title ILIKE :search OR article.content ILIKE :search OR article.excerpt ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (category) {
      queryBuilder.andWhere('article.category = :category', { category });
    }

    if (tag) {
      queryBuilder.andWhere(':tag = ANY(article.tags)', { tag });
    }

    if (authorId) {
      queryBuilder.andWhere('article.authorId = :authorId', { authorId });
    }

    if (isFeatured !== undefined) {
      queryBuilder.andWhere('article.isFeatured = :isFeatured', { isFeatured });
    }

    switch (sortBy) {
      case 'popular':
        queryBuilder.orderBy('article.viewCount', 'DESC');
        break;
      case 'trending':
        queryBuilder.orderBy('article.likeCount', 'DESC');
        break;
      case 'oldest':
        queryBuilder.orderBy('article.publishedAt', 'ASC');
        break;
      default:
        queryBuilder.orderBy('article.publishedAt', 'DESC');
    }

    const [articles, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    if (currentUserId) {
      await this.enrichArticlesWithUserData(articles, currentUserId);
    }

    return {
      data: articles,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

async findOne(identifier: string, currentUserId?: string) {
  const queryBuilder = this.articleRepository
    .createQueryBuilder('article')
    .leftJoinAndSelect('article.author', 'author')
    .leftJoinAndSelect('author.profile', 'profile');

  if (this.isUuid(identifier)) {
    queryBuilder.where('article.id = :uuidIdentifier::uuid OR article.slug = :slugIdentifier', {
      uuidIdentifier: identifier,
      slugIdentifier: identifier,
    });
  } else {
    queryBuilder.where('article.slug = :slugIdentifier', { slugIdentifier: identifier });
  }

  const article = await queryBuilder.getOne();

  if (!article) throw new NotFoundException('Article not found');

  if (currentUserId) {
    await this.enrichArticlesWithUserData([article], currentUserId);
  }

  return article;
}
private isUuid(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

 async update(id: string, userId: string, dto: UpdateArticleDto) {
    const article = await this.articleRepository.findOne({
      where: { id },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (article.authorId !== userId) {
      throw new ForbiddenException('You can only update your own articles');
    }

    if (dto.title && dto.title !== article.title) {
      article.slug = await this.generateUniqueSlug(dto.title);
    }

    if (dto.content) {
      article.readingTime = this.calculateReadingTime(dto.content);
    }

    if (
      dto.status === ArticleStatus.PUBLISHED &&
      article.status !== ArticleStatus.PUBLISHED
    ) {
      article.publishedAt = new Date();
    }

    Object.assign(article, dto);
    return await this.articleRepository.save(article);
  }

 async remove(id: string, userId: string) {
    const article = await this.articleRepository.findOne({ where: { id } });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (article.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own articles');
    }

    await this.articleRepository.remove(article);
    return { message: 'Article deleted successfully' };
  }

  async likeArticle(articleId: string, userId: string) {
    const article = await this.articleRepository.findOne({
      where: { id: articleId },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const existingLike = await this.likeRepository.findOne({
      where: { articleId, userId },
    });

    if (existingLike) {
      await this.likeRepository.remove(existingLike);
      article.likeCount = Math.max(0, article.likeCount - 1);
      await this.articleRepository.save(article);
      return { liked: false, likeCount: article.likeCount };
    }

    const like = this.likeRepository.create({ articleId, userId });
    await this.likeRepository.save(like);

    article.likeCount += 1;
    await this.articleRepository.save(article);

    return { liked: true, likeCount: article.likeCount };
  }

  async bookmarkArticle(articleId: string, userId: string, collectionName?: string) {
    const article = await this.articleRepository.findOne({
      where: { id: articleId },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const existingBookmark = await this.bookmarkRepository.findOne({
      where: { articleId, userId },
    });

    if (existingBookmark) {
      await this.bookmarkRepository.remove(existingBookmark);
      article.bookmarkCount = Math.max(0, article.bookmarkCount - 1);
      await this.articleRepository.save(article);
      return { bookmarked: false, bookmarkCount: article.bookmarkCount };
    }

    const bookmark = this.bookmarkRepository.create({
      articleId,
      userId,
      collectionName,
    });
    await this.bookmarkRepository.save(bookmark);

    article.bookmarkCount += 1;
    await this.articleRepository.save(article);

    return { bookmarked: true, bookmarkCount: article.bookmarkCount };
  }

  async trackView(
    articleId: string,
    userId: string | null,
    ipAddress: string,
    userAgent: string,
    dto?: TrackArticleViewDto,
  ) {
    const article = await this.articleRepository.findOne({
      where: { id: articleId },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const view = this.viewRepository.create({
      articleId,
      userId: userId || undefined,
      ipAddress,
      userAgent,
      readPercentage: dto?.readPercentage || 0,
      timeSpent: dto?.timeSpent || 0,
    });

    await this.viewRepository.save(view);

    article.viewCount += 1;
    await this.articleRepository.save(article);

    return { viewCount: article.viewCount };
  }

  async shareArticle(
    articleId: string,
    userId: string | null,
    dto: ShareArticleDto,
  ) {
    const article = await this.articleRepository.findOne({
      where: { id: articleId },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const share = this.shareRepository.create({
      articleId,
      userId: userId || undefined,
      platform: dto.platform,
    });

    await this.shareRepository.save(share);

    article.shareCount += 1;
    await this.articleRepository.save(article);

    return { shareCount: article.shareCount };
  }

  async createComment(
    articleId: string,
    userId: string,
    dto: CreateArticleCommentDto,
  ) {
    const article = await this.articleRepository.findOne({
      where: { id: articleId },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (!article.allowComments) {
      throw new ForbiddenException('Comments are disabled for this article');
    }

    if (dto.parentId) {
      const parentComment = await this.commentRepository.findOne({
        where: { id: dto.parentId, articleId },
      });

      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    const comment = this.commentRepository.create({
      ...dto,
      articleId,
      userId,
    });

    await this.commentRepository.save(comment);

    if (dto.parentId) {
      await this.commentRepository.increment(
        { id: dto.parentId },
        'replyCount',
        1,
      );
    }

    article.commentCount += 1;
    await this.articleRepository.save(article);

    return await this.commentRepository.findOne({
      where: { id: comment.id },
      relations: ['user', 'user.profile'],
    });
  }

  async findComments(articleId: string, query: QueryCommentsDto, currentUserId?: string) {
    const { page = 1, limit = 20, parentId, sortBy } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('comment.articleId = :articleId', { articleId });

    if (parentId !== undefined) {
      queryBuilder.andWhere(
        parentId === null
          ? 'comment.parentId IS NULL'
          : 'comment.parentId = :parentId',
        { parentId },
      );
    }

    switch (sortBy) {
      case 'oldest':
        queryBuilder.orderBy('comment.createdAt', 'ASC');
        break;
      case 'popular':
        queryBuilder.orderBy('comment.likeCount', 'DESC');
        break;
      default:
        queryBuilder.orderBy('comment.createdAt', 'DESC');
    }

    const [comments, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    if (currentUserId) {
      await this.enrichCommentsWithUserData(comments, currentUserId);
    }

    return {
      data: comments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateComment(
    commentId: string,
    userId: string,
    dto: UpdateArticleCommentDto,
  ) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only update your own comments');
    }

    comment.content = dto.content;
    comment.isEdited = true;

    return await this.commentRepository.save(comment);
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['article'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    if (comment.parentId) {
      await this.commentRepository.decrement(
        { id: comment.parentId },
        'replyCount',
        1,
      );
    }

    await this.commentRepository.remove(comment);

    await this.articleRepository.decrement(
      { id: comment.articleId },
      'commentCount',
      1,
    );

    return { message: 'Comment deleted successfully' };
  }

  async likeComment(commentId: string, userId: string) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const existingLike = await this.commentLikeRepository.findOne({
      where: { commentId, userId },
    });

    if (existingLike) {
      await this.commentLikeRepository.remove(existingLike);
      comment.likeCount = Math.max(0, comment.likeCount - 1);
      await this.commentRepository.save(comment);
      return { liked: false, likeCount: comment.likeCount };
    }

    const like = this.commentLikeRepository.create({ commentId, userId });
    await this.commentLikeRepository.save(like);

    comment.likeCount += 1;
    await this.commentRepository.save(comment);

    return { liked: true, likeCount: comment.likeCount };
  }

  async getUserBookmarks(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [bookmarks, total] = await this.bookmarkRepository.findAndCount({
      where: { userId },
      relations: ['article', 'article.author', 'article.author.profile'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: bookmarks.map((b) => b.article),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async enrichArticlesWithUserData(
    articles: Article[],
    userId: string,
  ) {
    const articleIds = articles.map((a) => a.id);

    const [likes, bookmarks] = await Promise.all([
      this.likeRepository.find({
        where: { userId, articleId: In(articleIds) },
      }),
      this.bookmarkRepository.find({
        where: { userId, articleId: In(articleIds) },
      }),
    ]);

    const likedIds = new Set(likes.map((l) => l.articleId));
    const bookmarkedIds = new Set(bookmarks.map((b) => b.articleId));

    articles.forEach((article: any) => {
      article.isLiked = likedIds.has(article.id);
      article.isBookmarked = bookmarkedIds.has(article.id);
    });
  }

  private async enrichCommentsWithUserData(
    comments: ArticleComment[],
    userId: string,
  ) {
    const commentIds = comments.map((c) => c.id);

    const likes = await this.commentLikeRepository.find({
      where: { userId, commentId: In(commentIds) },
    });

    const likedIds = new Set(likes.map((l) => l.commentId));

    comments.forEach((comment: any) => {
      comment.isLiked = likedIds.has(comment.id);
    });
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    let slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let uniqueSlug = slug;
    let counter = 1;

    while (
      await this.articleRepository.findOne({ where: { slug: uniqueSlug } })
    ) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    return uniqueSlug;
  }

  private calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }
}