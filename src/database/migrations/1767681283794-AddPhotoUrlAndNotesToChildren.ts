import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPhotoUrlAndNotesToChildren20260106123000 implements MigrationInterface {
    name = 'AddPhotoUrlAndNotesToChildren20260106123000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add new columns to the children table
        await queryRunner.query(`
            ALTER TABLE "children"
            ADD COLUMN "photoUrl" character varying
        `);
        await queryRunner.query(`
            ALTER TABLE "children"
            ADD COLUMN "notes" text
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove the columns if migration is rolled back
        await queryRunner.query(`
            ALTER TABLE "children"
            DROP COLUMN "photoUrl"
        `);
        await queryRunner.query(`
            ALTER TABLE "children"
            DROP COLUMN "notes"
        `);
    }
}
