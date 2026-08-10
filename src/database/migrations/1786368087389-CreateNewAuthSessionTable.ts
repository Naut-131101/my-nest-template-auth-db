import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateNewAuthSessionTable1786368087389 implements MigrationInterface {
    name = 'CreateNewAuthSessionTable1786368087389'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "auth_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "refresh_token_hash" character varying(255) NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "revoked_at" TIMESTAMP WITH TIME ZONE, "last_used_at" TIMESTAMP WITH TIME ZONE, "ip_address" character varying(64), "user_agent" character varying(500), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_641507381f32580e8479efc36cd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_auth_sessions_expires_at" ON "auth_sessions"  ("expires_at") `);
        await queryRunner.query(`CREATE INDEX "idx_auth_sessions_user_id" ON "auth_sessions"  ("user_id") `);
        await queryRunner.query(`ALTER TABLE "auth_sessions" ADD CONSTRAINT "FK_50ccaa6440288a06f0ba693ccc6" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "auth_sessions" DROP CONSTRAINT "FK_50ccaa6440288a06f0ba693ccc6"`);
        await queryRunner.query(`DROP INDEX "public"."idx_auth_sessions_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_auth_sessions_expires_at"`);
        await queryRunner.query(`DROP TABLE "auth_sessions"`);
    }

}
