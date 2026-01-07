import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatesLikeTables1767797453263 implements MigrationInterface {
    name = 'CreatesLikeTables1767797453263'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP CONSTRAINT "FK_b9646a3cc684392216280e681cd"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP CONSTRAINT "FK_64120749f6a5112519085584acb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b9646a3cc684392216280e681c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_64120749f6a5112519085584ac"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7d15e2f1610e51b3862b378be3"`);
        await queryRunner.query(`CREATE TYPE "public"."likes_likeabletype_enum" AS ENUM('post', 'comment', 'article', 'product', 'story', 'group_post')`);
        await queryRunner.query(`CREATE TABLE "likes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "likeableType" "public"."likes_likeabletype_enum" NOT NULL, "likeableId" uuid NOT NULL, "contentOwnerId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a9323de3f8bced7539a794b4a37" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_cfd8e81fac09d7339a32e57d90" ON "likes" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_bc6d63e4747af2a753be13621e" ON "likes" ("likeableType") `);
        await queryRunner.query(`CREATE INDEX "IDX_cb31548307016a290869e776a3" ON "likes" ("likeableId") `);
        await queryRunner.query(`CREATE INDEX "IDX_a10251b2005cb20c1f258608e6" ON "likes" ("contentOwnerId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_53e67f5a58070e63eb6985bbd5" ON "likes" ("likeableType", "likeableId", "userId") `);
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7d15e2f1610e51b3862b378be3" ON "profile_interests" ("profileId", "interestId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b9646a3cc684392216280e681c" ON "profile_interests" ("profileId") `);
        await queryRunner.query(`CREATE INDEX "IDX_64120749f6a5112519085584ac" ON "profile_interests" ("interestId") `);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD CONSTRAINT "FK_b9646a3cc684392216280e681cd" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD CONSTRAINT "FK_64120749f6a5112519085584acb" FOREIGN KEY ("interestId") REFERENCES "interests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "likes" ADD CONSTRAINT "FK_cfd8e81fac09d7339a32e57d904" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "likes" ADD CONSTRAINT "FK_a10251b2005cb20c1f258608e6c" FOREIGN KEY ("contentOwnerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "likes" DROP CONSTRAINT "FK_a10251b2005cb20c1f258608e6c"`);
        await queryRunner.query(`ALTER TABLE "likes" DROP CONSTRAINT "FK_cfd8e81fac09d7339a32e57d904"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP CONSTRAINT "FK_64120749f6a5112519085584acb"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP CONSTRAINT "FK_b9646a3cc684392216280e681cd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_64120749f6a5112519085584ac"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b9646a3cc684392216280e681c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7d15e2f1610e51b3862b378be3"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`DROP INDEX "public"."IDX_53e67f5a58070e63eb6985bbd5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a10251b2005cb20c1f258608e6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cb31548307016a290869e776a3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bc6d63e4747af2a753be13621e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cfd8e81fac09d7339a32e57d90"`);
        await queryRunner.query(`DROP TABLE "likes"`);
        await queryRunner.query(`DROP TYPE "public"."likes_likeabletype_enum"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7d15e2f1610e51b3862b378be3" ON "profile_interests" ("interestId", "profileId") `);
        await queryRunner.query(`CREATE INDEX "IDX_64120749f6a5112519085584ac" ON "profile_interests" ("interestId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b9646a3cc684392216280e681c" ON "profile_interests" ("profileId") `);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD CONSTRAINT "FK_64120749f6a5112519085584acb" FOREIGN KEY ("interestId") REFERENCES "interests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD CONSTRAINT "FK_b9646a3cc684392216280e681cd" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
