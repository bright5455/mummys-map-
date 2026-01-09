import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateStoriesTables1767947490712 implements MigrationInterface {
    name = 'CreateStoriesTables1767947490712'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP CONSTRAINT "FK_b9646a3cc684392216280e681cd"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP CONSTRAINT "FK_64120749f6a5112519085584acb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b9646a3cc684392216280e681c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_64120749f6a5112519085584ac"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7d15e2f1610e51b3862b378be3"`);
        await queryRunner.query(`CREATE TABLE "story_replies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "storyId" uuid NOT NULL, "userId" uuid NOT NULL, "message" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_2248c88e19562802fcc66fc76f6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_84f43f60f7292b4e7fff9cb9c2" ON "story_replies" ("storyId") `);
        await queryRunner.query(`CREATE INDEX "IDX_ef54acd5baaaa46827fe201be6" ON "story_replies" ("userId") `);
        await queryRunner.query(`CREATE TYPE "public"."stories_type_enum" AS ENUM('image', 'video', 'text')`);
        await queryRunner.query(`CREATE TYPE "public"."stories_privacy_enum" AS ENUM('public', 'followers', 'close_friends', 'custom')`);
        await queryRunner.query(`CREATE TABLE "stories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "type" "public"."stories_type_enum" NOT NULL DEFAULT 'image', "mediaUrl" character varying NOT NULL, "thumbnailUrl" character varying, "duration" integer, "width" integer, "height" integer, "caption" text, "textOverlay" text, "backgroundColor" character varying, "privacy" "public"."stories_privacy_enum" NOT NULL DEFAULT 'public', "viewsCount" integer NOT NULL DEFAULT '0', "repliesCount" integer NOT NULL DEFAULT '0', "isMuted" boolean NOT NULL DEFAULT false, "allowReplies" boolean NOT NULL DEFAULT true, "showViewers" boolean NOT NULL DEFAULT true, "highlightId" uuid, "isHighlight" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "expiresAt" TIMESTAMP NOT NULL, "deletedAt" TIMESTAMP, CONSTRAINT "PK_bb6f880b260ed96c452b32a39f0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_655cd324a6949f46e1b397f621" ON "stories" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_36186ea011d328ac30d7033b64" ON "stories" ("privacy") `);
        await queryRunner.query(`CREATE INDEX "IDX_5a42bc36a555b6285adfc6661c" ON "stories" ("highlightId") `);
        await queryRunner.query(`CREATE INDEX "IDX_e9ddcd33d421e9d8303ef701e7" ON "stories" ("expiresAt") `);
        await queryRunner.query(`CREATE TABLE "story_views" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "storyId" uuid NOT NULL, "userId" uuid NOT NULL, "viewedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_288c121f49726ec216a274e3aab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_59936d984aae9f264b569d35c9" ON "story_views" ("storyId") `);
        await queryRunner.query(`CREATE INDEX "IDX_8a9b556d8602e61742d33ac368" ON "story_views" ("userId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_6d39a1349a707eb839414a7d5b" ON "story_views" ("storyId", "userId") `);
        await queryRunner.query(`CREATE TABLE "story_highlights" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "title" character varying NOT NULL, "coverImageUrl" character varying, "storiesCount" integer NOT NULL DEFAULT '0', "displayOrder" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_8112a50b05408b2e2b9e6f8e660" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_650c7ee33f9bcafdbbf13e6ac4" ON "story_highlights" ("userId") `);
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7d15e2f1610e51b3862b378be3" ON "profile_interests" ("profileId", "interestId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b9646a3cc684392216280e681c" ON "profile_interests" ("profileId") `);
        await queryRunner.query(`CREATE INDEX "IDX_64120749f6a5112519085584ac" ON "profile_interests" ("interestId") `);
        await queryRunner.query(`ALTER TABLE "story_replies" ADD CONSTRAINT "FK_84f43f60f7292b4e7fff9cb9c2b" FOREIGN KEY ("storyId") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "story_replies" ADD CONSTRAINT "FK_ef54acd5baaaa46827fe201be65" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stories" ADD CONSTRAINT "FK_655cd324a6949f46e1b397f621e" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "story_views" ADD CONSTRAINT "FK_59936d984aae9f264b569d35c9c" FOREIGN KEY ("storyId") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "story_views" ADD CONSTRAINT "FK_8a9b556d8602e61742d33ac368c" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "story_highlights" ADD CONSTRAINT "FK_650c7ee33f9bcafdbbf13e6ac40" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD CONSTRAINT "FK_b9646a3cc684392216280e681cd" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD CONSTRAINT "FK_64120749f6a5112519085584acb" FOREIGN KEY ("interestId") REFERENCES "interests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP CONSTRAINT "FK_64120749f6a5112519085584acb"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP CONSTRAINT "FK_b9646a3cc684392216280e681cd"`);
        await queryRunner.query(`ALTER TABLE "story_highlights" DROP CONSTRAINT "FK_650c7ee33f9bcafdbbf13e6ac40"`);
        await queryRunner.query(`ALTER TABLE "story_views" DROP CONSTRAINT "FK_8a9b556d8602e61742d33ac368c"`);
        await queryRunner.query(`ALTER TABLE "story_views" DROP CONSTRAINT "FK_59936d984aae9f264b569d35c9c"`);
        await queryRunner.query(`ALTER TABLE "stories" DROP CONSTRAINT "FK_655cd324a6949f46e1b397f621e"`);
        await queryRunner.query(`ALTER TABLE "story_replies" DROP CONSTRAINT "FK_ef54acd5baaaa46827fe201be65"`);
        await queryRunner.query(`ALTER TABLE "story_replies" DROP CONSTRAINT "FK_84f43f60f7292b4e7fff9cb9c2b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_64120749f6a5112519085584ac"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b9646a3cc684392216280e681c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7d15e2f1610e51b3862b378be3"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`DROP INDEX "public"."IDX_650c7ee33f9bcafdbbf13e6ac4"`);
        await queryRunner.query(`DROP TABLE "story_highlights"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6d39a1349a707eb839414a7d5b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8a9b556d8602e61742d33ac368"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_59936d984aae9f264b569d35c9"`);
        await queryRunner.query(`DROP TABLE "story_views"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e9ddcd33d421e9d8303ef701e7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5a42bc36a555b6285adfc6661c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_36186ea011d328ac30d7033b64"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_655cd324a6949f46e1b397f621"`);
        await queryRunner.query(`DROP TABLE "stories"`);
        await queryRunner.query(`DROP TYPE "public"."stories_privacy_enum"`);
        await queryRunner.query(`DROP TYPE "public"."stories_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ef54acd5baaaa46827fe201be6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_84f43f60f7292b4e7fff9cb9c2"`);
        await queryRunner.query(`DROP TABLE "story_replies"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7d15e2f1610e51b3862b378be3" ON "profile_interests" ("interestId", "profileId") `);
        await queryRunner.query(`CREATE INDEX "IDX_64120749f6a5112519085584ac" ON "profile_interests" ("interestId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b9646a3cc684392216280e681c" ON "profile_interests" ("profileId") `);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD CONSTRAINT "FK_64120749f6a5112519085584acb" FOREIGN KEY ("interestId") REFERENCES "interests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD CONSTRAINT "FK_b9646a3cc684392216280e681cd" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
