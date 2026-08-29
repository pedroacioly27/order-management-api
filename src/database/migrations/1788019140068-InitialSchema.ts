import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1788019140068 implements MigrationInterface {
  name = 'InitialSchema1788019140068';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "parts" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "weight" numeric(6,2) NOT NULL, "pieceId" integer, CONSTRAINT "PK_daa5595bb8933f49ac00c9ebc79" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "pieces" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "orderId" integer, CONSTRAINT "PK_bc4a9ebcd4cd96d03522b4ca408" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "orders" ("id" SERIAL NOT NULL, "clientName" character varying NOT NULL, "description" character varying NOT NULL, "createdDate" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer, CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "parts" ADD CONSTRAINT "FK_de82106be44ffc68f0c65cda48e" FOREIGN KEY ("pieceId") REFERENCES "pieces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pieces" ADD CONSTRAINT "FK_ccf390e4795b97308198ce160d8" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_a922b820eeef29ac1c6800e826a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_a922b820eeef29ac1c6800e826a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pieces" DROP CONSTRAINT "FK_ccf390e4795b97308198ce160d8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "parts" DROP CONSTRAINT "FK_de82106be44ffc68f0c65cda48e"`,
    );
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "pieces"`);
    await queryRunner.query(`DROP TABLE "parts"`);
  }
}
