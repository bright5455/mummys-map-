import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateGroupsTables1768215972896 implements MigrationInterface {
    name = 'CreateGroupsTables1768215972896'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP CONSTRAINT "FK_b9646a3cc684392216280e681cd"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP CONSTRAINT "FK_64120749f6a5112519085584acb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b9646a3cc684392216280e681c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_64120749f6a5112519085584ac"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7d15e2f1610e51b3862b378be3"`);
        await queryRunner.query(`CREATE TYPE "public"."group_members_role_enum" AS ENUM('admin', 'moderator', 'member')`);
        await queryRunner.query(`CREATE TYPE "public"."group_members_status_enum" AS ENUM('active', 'banned')`);
        await queryRunner.query(`CREATE TABLE "group_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "groupId" uuid NOT NULL, "userId" uuid NOT NULL, "role" "public"."group_members_role_enum" NOT NULL DEFAULT 'member', "status" "public"."group_members_status_enum" NOT NULL DEFAULT 'active', "approvedAt" TIMESTAMP, "approvedBy" uuid, "joinedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_86446139b2c96bfd0f3b8638852" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1aa8d31831c3126947e7a713c2" ON "group_members" ("groupId") `);
        await queryRunner.query(`CREATE INDEX "IDX_fdef099303bcf0ffd9a4a7b18f" ON "group_members" ("userId") `);
        await queryRunner.query(`CREATE TABLE "group_posts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "groupId" uuid NOT NULL, "userId" uuid NOT NULL, "content" text NOT NULL, "mediaUrls" jsonb, "hashtags" jsonb, "mentions" jsonb, "isPinned" boolean NOT NULL DEFAULT false, "isEdited" boolean NOT NULL DEFAULT false, "editedAt" TIMESTAMP, "likesCount" integer NOT NULL DEFAULT '0', "commentsCount" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_f8bc53ffd96e3cd82e2b0c4b373" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f70ebdb5b92d0fe299ac44bccf" ON "group_posts" ("groupId") `);
        await queryRunner.query(`CREATE INDEX "IDX_84e8923b6308ac63c93ee8fef4" ON "group_posts" ("userId") `);
        await queryRunner.query(`CREATE TYPE "public"."groups_privacy_enum" AS ENUM('public', 'private', 'secret')`);
        await queryRunner.query(`CREATE TABLE "groups" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" text, "privacy" "public"."groups_privacy_enum" NOT NULL DEFAULT 'public', "coverImage" character varying, "avatarImage" character varying, "rules" text, "category" character varying, "location" character varying, "membersCount" integer NOT NULL DEFAULT '0', "postsCount" integer NOT NULL DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, "requireApproval" boolean NOT NULL DEFAULT false, "allowMemberInvites" boolean NOT NULL DEFAULT true, "allowMemberPosts" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_659d1483316afb28afd3a90646e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_752b10800d7432e18a4d851669" ON "groups" ("privacy") `);
        await queryRunner.query(`CREATE TYPE "public"."group_join_requests_status_enum" AS ENUM('pending', 'accepted', 'rejected', 'expired')`);
        await queryRunner.query(`CREATE TABLE "group_join_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "groupId" uuid NOT NULL, "userId" uuid NOT NULL, "status" "public"."group_join_requests_status_enum" NOT NULL DEFAULT 'pending', "message" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "respondedAt" TIMESTAMP, "respondedBy" uuid, CONSTRAINT "PK_74ce5e0752a5ec73ed19fe2a55d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8742848e3caf6d232bfce38496" ON "group_join_requests" ("groupId") `);
        await queryRunner.query(`CREATE INDEX "IDX_7fdce7230207ccb4f83064621d" ON "group_join_requests" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_bed2e9171e206a513a5a882a9f" ON "group_join_requests" ("status") `);
        await queryRunner.query(`CREATE TYPE "public"."group_invitations_status_enum" AS ENUM('pending', 'accepted', 'rejected', 'expired')`);
        await queryRunner.query(`CREATE TABLE "group_invitations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "groupId" uuid NOT NULL, "invitedUserId" uuid NOT NULL, "invitedBy" uuid NOT NULL, "status" "public"."group_invitations_status_enum" NOT NULL DEFAULT 'pending', "message" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "respondedAt" TIMESTAMP, CONSTRAINT "PK_f7d0b290d6079ae9353d794227d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ab934a07e81281d8da148ee641" ON "group_invitations" ("groupId") `);
        await queryRunner.query(`CREATE INDEX "IDX_cb09a4fab35f248028d2876577" ON "group_invitations" ("invitedUserId") `);
        await queryRunner.query(`CREATE INDEX "IDX_44c20845e1dd6a66ad4782199c" ON "group_invitations" ("status") `);
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7d15e2f1610e51b3862b378be3" ON "profile_interests" ("profileId", "interestId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b9646a3cc684392216280e681c" ON "profile_interests" ("profileId") `);
        await queryRunner.query(`CREATE INDEX "IDX_64120749f6a5112519085584ac" ON "profile_interests" ("interestId") `);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD CONSTRAINT "FK_b9646a3cc684392216280e681cd" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD CONSTRAINT "FK_64120749f6a5112519085584acb" FOREIGN KEY ("interestId") REFERENCES "interests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "group_members" ADD CONSTRAINT "FK_1aa8d31831c3126947e7a713c2b" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "group_members" ADD CONSTRAINT "FK_fdef099303bcf0ffd9a4a7b18f5" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "group_posts" ADD CONSTRAINT "FK_f70ebdb5b92d0fe299ac44bccf3" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "group_posts" ADD CONSTRAINT "FK_84e8923b6308ac63c93ee8fef4b" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "group_join_requests" ADD CONSTRAINT "FK_8742848e3caf6d232bfce38496b" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "group_join_requests" ADD CONSTRAINT "FK_7fdce7230207ccb4f83064621dc" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "group_invitations" ADD CONSTRAINT "FK_ab934a07e81281d8da148ee641b" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "group_invitations" ADD CONSTRAINT "FK_cb09a4fab35f248028d28765777" FOREIGN KEY ("invitedUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "group_invitations" ADD CONSTRAINT "FK_a551c5275c39b2a1b256b6bdb9d" FOREIGN KEY ("invitedBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "group_invitations" DROP CONSTRAINT "FK_a551c5275c39b2a1b256b6bdb9d"`);
        await queryRunner.query(`ALTER TABLE "group_invitations" DROP CONSTRAINT "FK_cb09a4fab35f248028d28765777"`);
        await queryRunner.query(`ALTER TABLE "group_invitations" DROP CONSTRAINT "FK_ab934a07e81281d8da148ee641b"`);
        await queryRunner.query(`ALTER TABLE "group_join_requests" DROP CONSTRAINT "FK_7fdce7230207ccb4f83064621dc"`);
        await queryRunner.query(`ALTER TABLE "group_join_requests" DROP CONSTRAINT "FK_8742848e3caf6d232bfce38496b"`);
        await queryRunner.query(`ALTER TABLE "group_posts" DROP CONSTRAINT "FK_84e8923b6308ac63c93ee8fef4b"`);
        await queryRunner.query(`ALTER TABLE "group_posts" DROP CONSTRAINT "FK_f70ebdb5b92d0fe299ac44bccf3"`);
        await queryRunner.query(`ALTER TABLE "group_members" DROP CONSTRAINT "FK_fdef099303bcf0ffd9a4a7b18f5"`);
        await queryRunner.query(`ALTER TABLE "group_members" DROP CONSTRAINT "FK_1aa8d31831c3126947e7a713c2b"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP CONSTRAINT "FK_64120749f6a5112519085584acb"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP CONSTRAINT "FK_b9646a3cc684392216280e681cd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_64120749f6a5112519085584ac"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b9646a3cc684392216280e681c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7d15e2f1610e51b3862b378be3"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`DROP INDEX "public"."IDX_44c20845e1dd6a66ad4782199c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cb09a4fab35f248028d2876577"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ab934a07e81281d8da148ee641"`);
        await queryRunner.query(`DROP TABLE "group_invitations"`);
        await queryRunner.query(`DROP TYPE "public"."group_invitations_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bed2e9171e206a513a5a882a9f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7fdce7230207ccb4f83064621d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8742848e3caf6d232bfce38496"`);
        await queryRunner.query(`DROP TABLE "group_join_requests"`);
        await queryRunner.query(`DROP TYPE "public"."group_join_requests_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_752b10800d7432e18a4d851669"`);
        await queryRunner.query(`DROP TABLE "groups"`);
        await queryRunner.query(`DROP TYPE "public"."groups_privacy_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_84e8923b6308ac63c93ee8fef4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f70ebdb5b92d0fe299ac44bccf"`);
        await queryRunner.query(`DROP TABLE "group_posts"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fdef099303bcf0ffd9a4a7b18f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1aa8d31831c3126947e7a713c2"`);
        await queryRunner.query(`DROP TABLE "group_members"`);
        await queryRunner.query(`DROP TYPE "public"."group_members_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."group_members_role_enum"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7d15e2f1610e51b3862b378be3" ON "profile_interests" ("interestId", "profileId") `);
        await queryRunner.query(`CREATE INDEX "IDX_64120749f6a5112519085584ac" ON "profile_interests" ("interestId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b9646a3cc684392216280e681c" ON "profile_interests" ("profileId") `);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD CONSTRAINT "FK_64120749f6a5112519085584acb" FOREIGN KEY ("interestId") REFERENCES "interests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD CONSTRAINT "FK_b9646a3cc684392216280e681cd" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
