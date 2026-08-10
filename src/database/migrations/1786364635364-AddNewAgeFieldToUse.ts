import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNewAgeFieldToUse1786364635364 implements MigrationInterface {
    name = 'AddNewAgeFieldToUse1786364635364'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "age" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "age"`);
    }

}
