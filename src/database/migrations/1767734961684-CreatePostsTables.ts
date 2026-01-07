import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePostsTables1767734961684 implements MigrationInterface {
    name = 'CreatePostsTables1767734961684'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "children" DROP CONSTRAINT "FK_children_profile"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP CONSTRAINT "FK_profile_interests_interest"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP CONSTRAINT "FK_profile_interests_profile"`);
        await queryRunner.query(`ALTER TABLE "profiles" DROP CONSTRAINT "FK_profiles_user"`);
        await queryRunner.query(`CREATE TABLE "post_likes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "postId" uuid NOT NULL, "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e4ac7cb9daf243939c6eabb2e0d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6999d13aca25e33515210abaf1" ON "post_likes" ("postId") `);
        await queryRunner.query(`CREATE INDEX "IDX_37d337ad54b1aa6b9a44415a49" ON "post_likes" ("userId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_30ee85070afe5b92b5920957b1" ON "post_likes" ("postId", "userId") `);
        await queryRunner.query(`CREATE TYPE "public"."post_media_mediatype_enum" AS ENUM('image', 'video')`);
        await queryRunner.query(`CREATE TABLE "post_media" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "postId" uuid NOT NULL, "mediaUrl" character varying NOT NULL, "thumbnailUrl" character varying, "mediaType" "public"."post_media_mediatype_enum" NOT NULL DEFAULT 'image', "order" integer NOT NULL DEFAULT '0', "width" integer, "height" integer, "duration" integer, "fileSize" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_049edb1ce7ab3d2a98009b171d0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4adcc5190e3b5c7e9001adef3b" ON "post_media" ("postId") `);
        await queryRunner.query(`CREATE TABLE "post_bookmarks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "postId" uuid NOT NULL, "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5dd9a87ec9317ecc59b3cf0ef9d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_00c6a8c7a2c3e49c229250bc12" ON "post_bookmarks" ("postId") `);
        await queryRunner.query(`CREATE INDEX "IDX_48483586ec0e555f16277bf829" ON "post_bookmarks" ("userId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_1817eff475d6e69ac6908b3673" ON "post_bookmarks" ("postId", "userId") `);
        await queryRunner.query(`CREATE TYPE "public"."posts_type_enum" AS ENUM('text', 'image', 'video', 'shared')`);
        await queryRunner.query(`CREATE TYPE "public"."posts_visibility_enum" AS ENUM('public', 'friends', 'private')`);
        await queryRunner.query(`CREATE TABLE "posts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "content" text, "type" "public"."posts_type_enum" NOT NULL DEFAULT 'text', "visibility" "public"."posts_visibility_enum" NOT NULL DEFAULT 'public', "sharedPostId" uuid, "hashtags" text, "mentions" text, "likesCount" integer NOT NULL DEFAULT '0', "commentsCount" integer NOT NULL DEFAULT '0', "sharesCount" integer NOT NULL DEFAULT '0', "bookmarksCount" integer NOT NULL DEFAULT '0', "isPinned" boolean NOT NULL DEFAULT false, "isEdited" boolean NOT NULL DEFAULT false, "editedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_2829ac61eff60fcec60d7274b9e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ae05faaa55c866130abef6e1fe" ON "posts" ("userId") `);
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "children" DROP COLUMN "notes"`);
        await queryRunner.query(`ALTER TABLE "children" ADD "notes" character varying`);
        await queryRunner.query(`ALTER TABLE "interests" ADD CONSTRAINT "UQ_616348777087f88bb8cb743e601" UNIQUE ("name")`);
        await queryRunner.query(`ALTER TABLE "profiles" ADD CONSTRAINT "UQ_315ecd98bd1a42dcf2ec4e2e985" UNIQUE ("userId")`);
        await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "gender"`);
        await queryRunner.query(`CREATE TYPE "public"."profiles_gender_enum" AS ENUM('male', 'female', 'non_binary', 'prefer_not_to_say')`);
        await queryRunner.query(`ALTER TABLE "profiles" ADD "gender" "public"."profiles_gender_enum"`);
        await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "parentingStage"`);
        await queryRunner.query(`CREATE TYPE "public"."profiles_parentingstage_enum" AS ENUM('expecting', 'newborn', 'infant', 'toddler', 'preschooler', 'school_age', 'teenager', 'adult_child')`);
        await queryRunner.query(`ALTER TABLE "profiles" ADD "parentingStage" "public"."profiles_parentingstage_enum"`);
        await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "visibility"`);
        await queryRunner.query(`CREATE TYPE "public"."profiles_visibility_enum" AS ENUM('public', 'friends_only', 'private')`);
        await queryRunner.query(`ALTER TABLE "profiles" ADD "visibility" "public"."profiles_visibility_enum" NOT NULL DEFAULT 'public'`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7d15e2f1610e51b3862b378be3" ON "profile_interests" ("profileId", "interestId") `);
        await queryRunner.query(`CREATE INDEX "IDX_616348777087f88bb8cb743e60" ON "interests" ("name") `);
        await queryRunner.query(`CREATE INDEX "IDX_b9646a3cc684392216280e681c" ON "profile_interests" ("profileId") `);
        await queryRunner.query(`CREATE INDEX "IDX_64120749f6a5112519085584ac" ON "profile_interests" ("interestId") `);
        await queryRunner.query(`ALTER TABLE "children" ADD CONSTRAINT "FK_3ce4b1a88a4875b3fd495bbaece" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD CONSTRAINT "FK_b9646a3cc684392216280e681cd" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD CONSTRAINT "FK_64120749f6a5112519085584acb" FOREIGN KEY ("interestId") REFERENCES "interests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "profiles" ADD CONSTRAINT "FK_315ecd98bd1a42dcf2ec4e2e985" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post_likes" ADD CONSTRAINT "FK_6999d13aca25e33515210abaf16" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post_likes" ADD CONSTRAINT "FK_37d337ad54b1aa6b9a44415a498" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post_media" ADD CONSTRAINT "FK_4adcc5190e3b5c7e9001adef3b8" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post_bookmarks" ADD CONSTRAINT "FK_00c6a8c7a2c3e49c229250bc12f" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post_bookmarks" ADD CONSTRAINT "FK_48483586ec0e555f16277bf829c" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_ae05faaa55c866130abef6e1fee" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_8dc4fa490da2ff9251711c767d1" FOREIGN KEY ("sharedPostId") REFERENCES "posts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_8dc4fa490da2ff9251711c767d1"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_ae05faaa55c866130abef6e1fee"`);
        await queryRunner.query(`ALTER TABLE "post_bookmarks" DROP CONSTRAINT "FK_48483586ec0e555f16277bf829c"`);
        await queryRunner.query(`ALTER TABLE "post_bookmarks" DROP CONSTRAINT "FK_00c6a8c7a2c3e49c229250bc12f"`);
        await queryRunner.query(`ALTER TABLE "post_media" DROP CONSTRAINT "FK_4adcc5190e3b5c7e9001adef3b8"`);
        await queryRunner.query(`ALTER TABLE "post_likes" DROP CONSTRAINT "FK_37d337ad54b1aa6b9a44415a498"`);
        await queryRunner.query(`ALTER TABLE "post_likes" DROP CONSTRAINT "FK_6999d13aca25e33515210abaf16"`);
        await queryRunner.query(`ALTER TABLE "profiles" DROP CONSTRAINT "FK_315ecd98bd1a42dcf2ec4e2e985"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP CONSTRAINT "FK_64120749f6a5112519085584acb"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP CONSTRAINT "FK_b9646a3cc684392216280e681cd"`);
        await queryRunner.query(`ALTER TABLE "children" DROP CONSTRAINT "FK_3ce4b1a88a4875b3fd495bbaece"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_64120749f6a5112519085584ac"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b9646a3cc684392216280e681c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_616348777087f88bb8cb743e60"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7d15e2f1610e51b3862b378be3"`);
        await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "visibility"`);
        await queryRunner.query(`DROP TYPE "public"."profiles_visibility_enum"`);
        await queryRunner.query(`ALTER TABLE "profiles" ADD "visibility" character varying NOT NULL DEFAULT 'PUBLIC'`);
        await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "parentingStage"`);
        await queryRunner.query(`DROP TYPE "public"."profiles_parentingstage_enum"`);
        await queryRunner.query(`ALTER TABLE "profiles" ADD "parentingStage" character varying`);
        await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "gender"`);
        await queryRunner.query(`DROP TYPE "public"."profiles_gender_enum"`);
        await queryRunner.query(`ALTER TABLE "profiles" ADD "gender" character varying`);
        await queryRunner.query(`ALTER TABLE "profiles" DROP CONSTRAINT "UQ_315ecd98bd1a42dcf2ec4e2e985"`);
        await queryRunner.query(`ALTER TABLE "interests" DROP CONSTRAINT "UQ_616348777087f88bb8cb743e601"`);
        await queryRunner.query(`ALTER TABLE "children" DROP COLUMN "notes"`);
        await queryRunner.query(`ALTER TABLE "children" ADD "notes" text`);
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ae05faaa55c866130abef6e1fe"`);
        await queryRunner.query(`DROP TABLE "posts"`);
        await queryRunner.query(`DROP TYPE "public"."posts_visibility_enum"`);
        await queryRunner.query(`DROP TYPE "public"."posts_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1817eff475d6e69ac6908b3673"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_48483586ec0e555f16277bf829"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_00c6a8c7a2c3e49c229250bc12"`);
        await queryRunner.query(`DROP TABLE "post_bookmarks"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4adcc5190e3b5c7e9001adef3b"`);
        await queryRunner.query(`DROP TABLE "post_media"`);
        await queryRunner.query(`DROP TYPE "public"."post_media_mediatype_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_30ee85070afe5b92b5920957b1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_37d337ad54b1aa6b9a44415a49"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6999d13aca25e33515210abaf1"`);
        await queryRunner.query(`DROP TABLE "post_likes"`);
        await queryRunner.query(`ALTER TABLE "profiles" ADD CONSTRAINT "FK_profiles_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD CONSTRAINT "FK_profile_interests_profile" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD CONSTRAINT "FK_profile_interests_interest" FOREIGN KEY ("interestId") REFERENCES "interests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "children" ADD CONSTRAINT "FK_children_profile" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
