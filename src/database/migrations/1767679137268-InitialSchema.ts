import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema20260106123000 implements MigrationInterface {
    name = 'InitialSchema20260106123000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Profiles table
        await queryRunner.query(`
            CREATE TABLE "profiles" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "firstName" character varying,
                "lastName" character varying,
                "displayName" character varying,
                "bio" text,
                "dateOfBirth" date,
                "gender" character varying,
                "profilePhotoUrl" character varying,
                "coverPhotoUrl" character varying,
                "location" character varying,
                "latitude" decimal(10,7),
                "longitude" decimal(10,7),
                "city" character varying,
                "state" character varying,
                "country" character varying,
                "numberOfChildren" integer NOT NULL DEFAULT 0,
                "parentingStage" character varying,
                "visibility" character varying NOT NULL DEFAULT 'PUBLIC',
                "showLocation" boolean NOT NULL DEFAULT false,
                "showAge" boolean NOT NULL DEFAULT true,
                "showChildren" boolean NOT NULL DEFAULT true,
                "isVerified" boolean NOT NULL DEFAULT false,
                "completionPercentage" integer NOT NULL DEFAULT 0,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_profiles" PRIMARY KEY ("id"),
                CONSTRAINT "FK_profiles_user" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE
            )
        `);

        // Interests table
        await queryRunner.query(`
            CREATE TABLE "interests" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "description" character varying,
                "iconUrl" character varying,
                "category" character varying,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_interests" PRIMARY KEY ("id")
            )
        `);

        // Profile_Interests table
        await queryRunner.query(`
            CREATE TABLE "profile_interests" (
                "profileId" uuid NOT NULL,
                "interestId" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_profile_interests" PRIMARY KEY ("profileId", "interestId"),
                CONSTRAINT "FK_profile_interests_profile" FOREIGN KEY ("profileId") REFERENCES "profiles" ("id") ON DELETE CASCADE,
                CONSTRAINT "FK_profile_interests_interest" FOREIGN KEY ("interestId") REFERENCES "interests" ("id") ON DELETE CASCADE
            )
        `);

        // Children table
        await queryRunner.query(`
            CREATE TABLE "children" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "profileId" uuid NOT NULL,
                "firstName" character varying,
                "lastName" character varying,
                "dateOfBirth" date,
                "gender" character varying,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_children" PRIMARY KEY ("id"),
                CONSTRAINT "FK_children_profile" FOREIGN KEY ("profileId") REFERENCES "profiles" ("id") ON DELETE CASCADE
            )
        `);

  await queryRunner.query(`
  ALTER TABLE "children"
  ADD COLUMN "photoUrl" character varying,
  ADD COLUMN "notes" text;
`);
    }


    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "profile_interests"`);
        await queryRunner.query(`DROP TABLE "children"`);
        await queryRunner.query(`DROP TABLE "interests"`);
        await queryRunner.query(`DROP TABLE "profiles"`);
    }
}
