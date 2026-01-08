import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMediaTables1767859275691 implements MigrationInterface {
    name = 'CreateMediaTables1767859275691'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP CONSTRAINT "FK_b9646a3cc684392216280e681cd"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP CONSTRAINT "FK_64120749f6a5112519085584acb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b9646a3cc684392216280e681c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_64120749f6a5112519085584ac"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7d15e2f1610e51b3862b378be3"`);
        await queryRunner.query(`CREATE TYPE "public"."media_mediatype_enum" AS ENUM('image', 'video', 'audio', 'document', 'other')`);
        await queryRunner.query(`CREATE TYPE "public"."media_context_enum" AS ENUM('post', 'comment', 'profile_picture', 'cover_photo', 'article', 'product', 'story', 'message', 'group', 'tracking', 'medical_record', 'prescription', 'document', 'other')`);
        await queryRunner.query(`CREATE TABLE "media" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "originalName" character varying NOT NULL, "filename" character varying NOT NULL, "url" character varying NOT NULL, "thumbnailUrl" character varying, "mediumUrl" character varying, "smallUrl" character varying, "mediaType" "public"."media_mediatype_enum" NOT NULL, "context" "public"."media_context_enum", "contextId" uuid, "fileSize" bigint NOT NULL, "mimeType" character varying NOT NULL, "width" integer, "height" integer, "duration" integer, "aspectRatio" character varying, "storageProvider" character varying, "publicId" character varying, "bucket" character varying, "metadata" jsonb, "isPublic" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT true, "altText" character varying, "caption" text, "displayOrder" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_abc159b084b9d36de6bcabbfb82" UNIQUE ("filename"), CONSTRAINT "PK_f4e0fcac36e050de337b670d8bd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0db866835bf356d896e1892635" ON "media" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_5cfb4daf8e7a0961eb66f9cbe4" ON "media" ("mediaType") `);
        await queryRunner.query(`CREATE INDEX "IDX_0665beefbcf63197b1762c5482" ON "media" ("context") `);
        await queryRunner.query(`CREATE INDEX "IDX_0cee6e7876f482e5fca85aa89c" ON "media" ("contextId") `);
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "followersCount" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "followingCount" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "isPrivate" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7d15e2f1610e51b3862b378be3" ON "profile_interests" ("profileId", "interestId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b9646a3cc684392216280e681c" ON "profile_interests" ("profileId") `);
        await queryRunner.query(`CREATE INDEX "IDX_64120749f6a5112519085584ac" ON "profile_interests" ("interestId") `);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD CONSTRAINT "FK_b9646a3cc684392216280e681cd" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD CONSTRAINT "FK_64120749f6a5112519085584acb" FOREIGN KEY ("interestId") REFERENCES "interests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "media" ADD CONSTRAINT "FK_0db866835bf356d896e1892635d" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "media" DROP CONSTRAINT "FK_0db866835bf356d896e1892635d"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP CONSTRAINT "FK_64120749f6a5112519085584acb"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP CONSTRAINT "FK_b9646a3cc684392216280e681cd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_64120749f6a5112519085584ac"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b9646a3cc684392216280e681c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7d15e2f1610e51b3862b378be3"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isPrivate"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "followingCount"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "followersCount"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0cee6e7876f482e5fca85aa89c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0665beefbcf63197b1762c5482"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5cfb4daf8e7a0961eb66f9cbe4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0db866835bf356d896e1892635"`);
        await queryRunner.query(`DROP TABLE "media"`);
        await queryRunner.query(`DROP TYPE "public"."media_context_enum"`);
        await queryRunner.query(`DROP TYPE "public"."media_mediatype_enum"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7d15e2f1610e51b3862b378be3" ON "profile_interests" ("interestId", "profileId") `);
        await queryRunner.query(`CREATE INDEX "IDX_64120749f6a5112519085584ac" ON "profile_interests" ("interestId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b9646a3cc684392216280e681c" ON "profile_interests" ("profileId") `);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD CONSTRAINT "FK_64120749f6a5112519085584acb" FOREIGN KEY ("interestId") REFERENCES "interests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD CONSTRAINT "FK_b9646a3cc684392216280e681cd" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
