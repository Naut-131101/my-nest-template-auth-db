import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateNewUserTable1786275124505 implements MigrationInterface {
    name = 'CreateNewUserTable1786275124505'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'user')`);
        await queryRunner.query(`CREATE TYPE "public"."users_status_enum" AS ENUM('active', 'inactive', 'suspended')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "username" character varying(50) NOT NULL, "password_hash" character varying(255) NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', "status" "public"."users_status_enum" NOT NULL DEFAULT 'active', "first_name" character varying(100), "last_name" character varying(100), "last_login_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_users_username" ON "users"  ("username") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_users_email" ON "users"  ("email") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."uq_users_email"`);
        await queryRunner.query(`DROP INDEX "public"."uq_users_username"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
