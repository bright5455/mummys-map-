import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCommentsTables1767780501245 implements MigrationInterface {
    name = 'CreateCommentsTables1767780501245'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP CONSTRAINT "FK_b9646a3cc684392216280e681cd"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP CONSTRAINT "FK_64120749f6a5112519085584acb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b9646a3cc684392216280e681c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_64120749f6a5112519085584ac"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7d15e2f1610e51b3862b378be3"`);
        await queryRunner.query(`CREATE TABLE "comment_likes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "commentId" uuid NOT NULL, "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2c299aaf1f903c45ee7e6c7b419" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_abbd506a94a424dd6a3a68d26f" ON "comment_likes" ("commentId") `);
        await queryRunner.query(`CREATE INDEX "IDX_34d1f902a8a527dbc2502f87c8" ON "comment_likes" ("userId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_ec6698ead14ad945033ebb2f1b" ON "comment_likes" ("commentId", "userId") `);
        await queryRunner.query(`CREATE TABLE "comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "postId" uuid NOT NULL, "userId" uuid NOT NULL, "content" text NOT NULL, "parentCommentId" uuid, "mentions" text, "likesCount" integer NOT NULL DEFAULT '0', "repliesCount" integer NOT NULL DEFAULT '0', "isEdited" boolean NOT NULL DEFAULT false, "editedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_8bf68bc960f2b69e818bdb90dcb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e44ddaaa6d058cb4092f83ad61" ON "comments" ("postId") `);
        await queryRunner.query(`CREATE INDEX "IDX_7e8d7c49f218ebb14314fdb374" ON "comments" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_4875672591221a61ace66f2d4f" ON "comments" ("parentCommentId") `);
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7d15e2f1610e51b3862b378be3" ON "profile_interests" ("profileId", "interestId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b9646a3cc684392216280e681c" ON "profile_interests" ("profileId") `);
        await queryRunner.query(`CREATE INDEX "IDX_64120749f6a5112519085584ac" ON "profile_interests" ("interestId") `);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD CONSTRAINT "FK_b9646a3cc684392216280e681cd" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD CONSTRAINT "FK_64120749f6a5112519085584acb" FOREIGN KEY ("interestId") REFERENCES "interests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comment_likes" ADD CONSTRAINT "FK_abbd506a94a424dd6a3a68d26f4" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comment_likes" ADD CONSTRAINT "FK_34d1f902a8a527dbc2502f87c88" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_e44ddaaa6d058cb4092f83ad61f" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_7e8d7c49f218ebb14314fdb3749" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_4875672591221a61ace66f2d4f9" FOREIGN KEY ("parentCommentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_4875672591221a61ace66f2d4f9"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_7e8d7c49f218ebb14314fdb3749"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_e44ddaaa6d058cb4092f83ad61f"`);
        await queryRunner.query(`ALTER TABLE "comment_likes" DROP CONSTRAINT "FK_34d1f902a8a527dbc2502f87c88"`);
        await queryRunner.query(`ALTER TABLE "comment_likes" DROP CONSTRAINT "FK_abbd506a94a424dd6a3a68d26f4"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP CONSTRAINT "FK_64120749f6a5112519085584acb"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP CONSTRAINT "FK_b9646a3cc684392216280e681cd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_64120749f6a5112519085584ac"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b9646a3cc684392216280e681c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7d15e2f1610e51b3862b378be3"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4875672591221a61ace66f2d4f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7e8d7c49f218ebb14314fdb374"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e44ddaaa6d058cb4092f83ad61"`);
        await queryRunner.query(`DROP TABLE "comments"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ec6698ead14ad945033ebb2f1b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_34d1f902a8a527dbc2502f87c8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_abbd506a94a424dd6a3a68d26f"`);
        await queryRunner.query(`DROP TABLE "comment_likes"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7d15e2f1610e51b3862b378be3" ON "profile_interests" ("interestId", "profileId") `);
        await queryRunner.query(`CREATE INDEX "IDX_64120749f6a5112519085584ac" ON "profile_interests" ("interestId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b9646a3cc684392216280e681c" ON "profile_interests" ("profileId") `);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD CONSTRAINT "FK_64120749f6a5112519085584acb" FOREIGN KEY ("interestId") REFERENCES "interests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD CONSTRAINT "FK_b9646a3cc684392216280e681cd" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
