import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFollowtsTables1767864068908 implements MigrationInterface {
    name = 'CreateFollowtsTables1767864068908'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP CONSTRAINT "FK_b9646a3cc684392216280e681cd"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP CONSTRAINT "FK_64120749f6a5112519085584acb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b9646a3cc684392216280e681c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_64120749f6a5112519085584ac"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7d15e2f1610e51b3862b378be3"`);
        await queryRunner.query(`CREATE TYPE "public"."follows_status_enum" AS ENUM('pending', 'accepted', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "follows" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "followerId" uuid NOT NULL, "followingId" uuid NOT NULL, "status" "public"."follows_status_enum" NOT NULL DEFAULT 'accepted', "isMuted" boolean NOT NULL DEFAULT false, "showNotifications" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "acceptedAt" TIMESTAMP, CONSTRAINT "PK_8988f607744e16ff79da3b8a627" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_fdb91868b03a2040db408a5333" ON "follows" ("followerId") `);
        await queryRunner.query(`CREATE INDEX "IDX_ef463dd9a2ce0d673350e36e0f" ON "follows" ("followingId") `);
        await queryRunner.query(`CREATE INDEX "IDX_02b9292e7e9f0534aa5ff95dd2" ON "follows" ("status") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_105079775692df1f8799ed0fac" ON "follows" ("followerId", "followingId") `);
        await queryRunner.query(`CREATE TABLE "blocks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "blockerId" uuid NOT NULL, "blockedId" uuid NOT NULL, "reason" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8244fa1495c4e9222a01059244b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ed8a33b2c1ac10922c2354f5cf" ON "blocks" ("blockerId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b87401da081a7153ec3bd1e6ab" ON "blocks" ("blockedId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_4abe7bad89347a663fc8f428d0" ON "blocks" ("blockerId", "blockedId") `);
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7d15e2f1610e51b3862b378be3" ON "profile_interests" ("profileId", "interestId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b9646a3cc684392216280e681c" ON "profile_interests" ("profileId") `);
        await queryRunner.query(`CREATE INDEX "IDX_64120749f6a5112519085584ac" ON "profile_interests" ("interestId") `);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD CONSTRAINT "FK_b9646a3cc684392216280e681cd" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD CONSTRAINT "FK_64120749f6a5112519085584acb" FOREIGN KEY ("interestId") REFERENCES "interests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "follows" ADD CONSTRAINT "FK_fdb91868b03a2040db408a53331" FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "follows" ADD CONSTRAINT "FK_ef463dd9a2ce0d673350e36e0fb" FOREIGN KEY ("followingId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "blocks" ADD CONSTRAINT "FK_ed8a33b2c1ac10922c2354f5cfc" FOREIGN KEY ("blockerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "blocks" ADD CONSTRAINT "FK_b87401da081a7153ec3bd1e6ab6" FOREIGN KEY ("blockedId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blocks" DROP CONSTRAINT "FK_b87401da081a7153ec3bd1e6ab6"`);
        await queryRunner.query(`ALTER TABLE "blocks" DROP CONSTRAINT "FK_ed8a33b2c1ac10922c2354f5cfc"`);
        await queryRunner.query(`ALTER TABLE "follows" DROP CONSTRAINT "FK_ef463dd9a2ce0d673350e36e0fb"`);
        await queryRunner.query(`ALTER TABLE "follows" DROP CONSTRAINT "FK_fdb91868b03a2040db408a53331"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP CONSTRAINT "FK_64120749f6a5112519085584acb"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP CONSTRAINT "FK_b9646a3cc684392216280e681cd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_64120749f6a5112519085584ac"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b9646a3cc684392216280e681c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7d15e2f1610e51b3862b378be3"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4abe7bad89347a663fc8f428d0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b87401da081a7153ec3bd1e6ab"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ed8a33b2c1ac10922c2354f5cf"`);
        await queryRunner.query(`DROP TABLE "blocks"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_105079775692df1f8799ed0fac"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_02b9292e7e9f0534aa5ff95dd2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ef463dd9a2ce0d673350e36e0f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fdb91868b03a2040db408a5333"`);
        await queryRunner.query(`DROP TABLE "follows"`);
        await queryRunner.query(`DROP TYPE "public"."follows_status_enum"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7d15e2f1610e51b3862b378be3" ON "profile_interests" ("interestId", "profileId") `);
        await queryRunner.query(`CREATE INDEX "IDX_64120749f6a5112519085584ac" ON "profile_interests" ("interestId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b9646a3cc684392216280e681c" ON "profile_interests" ("profileId") `);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD CONSTRAINT "FK_64120749f6a5112519085584acb" FOREIGN KEY ("interestId") REFERENCES "interests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "profile_interests" ADD CONSTRAINT "FK_b9646a3cc684392216280e681cd" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
