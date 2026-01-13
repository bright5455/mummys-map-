import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateArticlesTables1768307132391 implements MigrationInterface {
    name = 'CreateArticlesTables1768307132391'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP CONSTRAINT "FK_b9646a3cc684392216280e681cd"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP CONSTRAINT "FK_64120749f6a5112519085584acb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b9646a3cc684392216280e681c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_64120749f6a5112519085584ac"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7d15e2f1610e51b3862b378be3"`);
        await queryRunner.query(`CREATE TYPE "public"."articles_status_enum" AS ENUM('draft', 'published', 'archived')`);
        await queryRunner.query(`CREATE TYPE "public"."articles_visibility_enum" AS ENUM('public', 'private', 'followers_only')`);
        await queryRunner.query(`CREATE TABLE "articles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(255) NOT NULL, "slug" character varying(300) NOT NULL, "subtitle" text, "content" text NOT NULL, "excerpt" text, "coverImage" character varying(500), "images" text, "tags" text, "category" character varying(100), "status" "public"."articles_status_enum" NOT NULL DEFAULT 'draft', "visibility" "public"."articles_visibility_enum" NOT NULL DEFAULT 'public', "readingTime" integer NOT NULL DEFAULT '0', "viewCount" integer NOT NULL DEFAULT '0', "likeCount" integer NOT NULL DEFAULT '0', "commentCount" integer NOT NULL DEFAULT '0', "bookmarkCount" integer NOT NULL DEFAULT '0', "shareCount" integer NOT NULL DEFAULT '0', "allowComments" boolean NOT NULL DEFAULT true, "isFeatured" boolean NOT NULL DEFAULT false, "isPinned" boolean NOT NULL DEFAULT false, "publishedAt" TIMESTAMP, "authorId" uuid NOT NULL, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_1123ff6815c5b8fec0ba9fec370" UNIQUE ("slug"), CONSTRAINT "PK_0a6e2c450d83e0b6052c2793334" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1123ff6815c5b8fec0ba9fec37" ON "articles" ("slug") `);
        await queryRunner.query(`CREATE INDEX "IDX_984104028066f528546262fc99" ON "articles" ("authorId", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_2fb68780b633fcb42bd2838628" ON "articles" ("status", "visibility", "publishedAt") `);
        await queryRunner.query(`CREATE TABLE "article_comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "articleId" uuid NOT NULL, "userId" uuid NOT NULL, "content" text NOT NULL, "parentId" uuid, "likeCount" integer NOT NULL DEFAULT '0', "replyCount" integer NOT NULL DEFAULT '0', "isEdited" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_76305985dc2ec48641fdbd44c76" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0aba8573a3ef1c38c8b8ace97c" ON "article_comments" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_a0ffb580b5f83e775d194a4a1b" ON "article_comments" ("articleId", "createdAt") `);
        await queryRunner.query(`CREATE TABLE "article_likes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "articleId" uuid NOT NULL, "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_c4e059efc60309ca50dc2e82247" UNIQUE ("articleId", "userId"), CONSTRAINT "PK_c08c251499af785bf0ecf9d5d94" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_cb61d50f9cb3380e28b44312f1" ON "article_likes" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_846944317a442b36888c2a6f48" ON "article_likes" ("articleId") `);
        await queryRunner.query(`CREATE TABLE "article_comment_likes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "commentId" uuid NOT NULL, "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_6b4457d347332cae89a1028eeea" UNIQUE ("commentId", "userId"), CONSTRAINT "PK_a4fe428d2b75047632d20035ff0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7af128a294e52f8698f516fe5e" ON "article_comment_likes" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_6e632cd8cfacd594c9f6bb765f" ON "article_comment_likes" ("commentId") `);
        await queryRunner.query(`CREATE TABLE "article_bookmarks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "articleId" uuid NOT NULL, "userId" uuid NOT NULL, "collectionName" character varying(100), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_447651ce2a01b7e0e291ba053fe" UNIQUE ("articleId", "userId"), CONSTRAINT "PK_250b325640d4f923f9b7284ed10" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_400bc6f81b56a474c7eb0f03d6" ON "article_bookmarks" ("userId", "createdAt") `);
        await queryRunner.query(`CREATE TABLE "article_views" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "articleId" uuid NOT NULL, "userId" uuid, "ipAddress" character varying(45), "userAgent" character varying(500), "readPercentage" integer NOT NULL DEFAULT '0', "timeSpent" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_802d25a47c0839c40b02f1335db" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a5e758632dfc283cddc1982f7a" ON "article_views" ("userId", "articleId") `);
        await queryRunner.query(`CREATE INDEX "IDX_9842a738ef06e11d26320a25aa" ON "article_views" ("articleId", "createdAt") `);
        await queryRunner.query(`CREATE TABLE "article_shares" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "articleId" uuid NOT NULL, "userId" uuid, "platform" character varying(50) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6be1b8418d9da2b60fccbc88346" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d7883f834eaafabaa9a9cc8f7c" ON "article_shares" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_ea88dca1ba64f3708190ebf797" ON "article_shares" ("articleId", "createdAt") `);
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7d15e2f1610e51b3862b378be3" ON "profile_interests" ("profileId", "interestId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b9646a3cc684392216280e681c" ON "profile_interests" ("profileId") `);
        await queryRunner.query(`CREATE INDEX "IDX_64120749f6a5112519085584ac" ON "profile_interests" ("interestId") `);
        await queryRunner.query(`ALTER TABLE "articles" ADD CONSTRAINT "FK_65d9ccc1b02f4d904e90bd76a34" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "article_comments" ADD CONSTRAINT "FK_7042a18a394319c32bb2d39f854" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "article_comments" ADD CONSTRAINT "FK_0aba8573a3ef1c38c8b8ace97c0" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "article_comments" ADD CONSTRAINT "FK_61683f2bd08c04e29e50356b33f" FOREIGN KEY ("parentId") REFERENCES "article_comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "article_likes" ADD CONSTRAINT "FK_846944317a442b36888c2a6f488" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "article_likes" ADD CONSTRAINT "FK_cb61d50f9cb3380e28b44312f12" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "article_comment_likes" ADD CONSTRAINT "FK_6e632cd8cfacd594c9f6bb765f0" FOREIGN KEY ("commentId") REFERENCES "article_comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "article_comment_likes" ADD CONSTRAINT "FK_7af128a294e52f8698f516fe5e7" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "article_bookmarks" ADD CONSTRAINT "FK_3a74edbf4e848425645f813021d" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "article_bookmarks" ADD CONSTRAINT "FK_0be87ff9826ff482ebd0c228a5b" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "article_views" ADD CONSTRAINT "FK_6184d547556eab644f0de372df2" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "article_views" ADD CONSTRAINT "FK_2b433e5c71e0b1f7f36085ef023" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "article_shares" ADD CONSTRAINT "FK_7d5346bcb307e3606c97035673d" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "article_shares" ADD CONSTRAINT "FK_d7883f834eaafabaa9a9cc8f7c7" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD CONSTRAINT "FK_b9646a3cc684392216280e681cd" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD CONSTRAINT "FK_64120749f6a5112519085584acb" FOREIGN KEY ("interestId") REFERENCES "interests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP CONSTRAINT "FK_64120749f6a5112519085584acb"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP CONSTRAINT "FK_b9646a3cc684392216280e681cd"`);
        await queryRunner.query(`ALTER TABLE "article_shares" DROP CONSTRAINT "FK_d7883f834eaafabaa9a9cc8f7c7"`);
        await queryRunner.query(`ALTER TABLE "article_shares" DROP CONSTRAINT "FK_7d5346bcb307e3606c97035673d"`);
        await queryRunner.query(`ALTER TABLE "article_views" DROP CONSTRAINT "FK_2b433e5c71e0b1f7f36085ef023"`);
        await queryRunner.query(`ALTER TABLE "article_views" DROP CONSTRAINT "FK_6184d547556eab644f0de372df2"`);
        await queryRunner.query(`ALTER TABLE "article_bookmarks" DROP CONSTRAINT "FK_0be87ff9826ff482ebd0c228a5b"`);
        await queryRunner.query(`ALTER TABLE "article_bookmarks" DROP CONSTRAINT "FK_3a74edbf4e848425645f813021d"`);
        await queryRunner.query(`ALTER TABLE "article_comment_likes" DROP CONSTRAINT "FK_7af128a294e52f8698f516fe5e7"`);
        await queryRunner.query(`ALTER TABLE "article_comment_likes" DROP CONSTRAINT "FK_6e632cd8cfacd594c9f6bb765f0"`);
        await queryRunner.query(`ALTER TABLE "article_likes" DROP CONSTRAINT "FK_cb61d50f9cb3380e28b44312f12"`);
        await queryRunner.query(`ALTER TABLE "article_likes" DROP CONSTRAINT "FK_846944317a442b36888c2a6f488"`);
        await queryRunner.query(`ALTER TABLE "article_comments" DROP CONSTRAINT "FK_61683f2bd08c04e29e50356b33f"`);
        await queryRunner.query(`ALTER TABLE "article_comments" DROP CONSTRAINT "FK_0aba8573a3ef1c38c8b8ace97c0"`);
        await queryRunner.query(`ALTER TABLE "article_comments" DROP CONSTRAINT "FK_7042a18a394319c32bb2d39f854"`);
        await queryRunner.query(`ALTER TABLE "articles" DROP CONSTRAINT "FK_65d9ccc1b02f4d904e90bd76a34"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_64120749f6a5112519085584ac"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b9646a3cc684392216280e681c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7d15e2f1610e51b3862b378be3"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ea88dca1ba64f3708190ebf797"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d7883f834eaafabaa9a9cc8f7c"`);
        await queryRunner.query(`DROP TABLE "article_shares"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9842a738ef06e11d26320a25aa"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a5e758632dfc283cddc1982f7a"`);
        await queryRunner.query(`DROP TABLE "article_views"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_400bc6f81b56a474c7eb0f03d6"`);
        await queryRunner.query(`DROP TABLE "article_bookmarks"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6e632cd8cfacd594c9f6bb765f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7af128a294e52f8698f516fe5e"`);
        await queryRunner.query(`DROP TABLE "article_comment_likes"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_846944317a442b36888c2a6f48"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cb61d50f9cb3380e28b44312f1"`);
        await queryRunner.query(`DROP TABLE "article_likes"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a0ffb580b5f83e775d194a4a1b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0aba8573a3ef1c38c8b8ace97c"`);
        await queryRunner.query(`DROP TABLE "article_comments"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2fb68780b633fcb42bd2838628"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_984104028066f528546262fc99"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1123ff6815c5b8fec0ba9fec37"`);
        await queryRunner.query(`DROP TABLE "articles"`);
        await queryRunner.query(`DROP TYPE "public"."articles_visibility_enum"`);
        await queryRunner.query(`DROP TYPE "public"."articles_status_enum"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7d15e2f1610e51b3862b378be3" ON "profile_interests" ("interestId", "profileId") `);
        await queryRunner.query(`CREATE INDEX "IDX_64120749f6a5112519085584ac" ON "profile_interests" ("interestId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b9646a3cc684392216280e681c" ON "profile_interests" ("profileId") `);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD CONSTRAINT "FK_64120749f6a5112519085584acb" FOREIGN KEY ("interestId") REFERENCES "interests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD CONSTRAINT "FK_b9646a3cc684392216280e681cd" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
