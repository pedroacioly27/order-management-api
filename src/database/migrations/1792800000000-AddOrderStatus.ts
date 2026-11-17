import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderStatus1792800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
  CREATE TYPE "orders_status_enum" AS ENUM (
    'PENDING',
    'IN_PRODUCTION',
    'COMPLETED'
  )
`);
    await queryRunner.query(`
  ALTER TABLE "orders"
  ADD COLUMN "status" "orders_status_enum"
  NOT NULL DEFAULT 'PENDING'
  `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
    ALTER TABLE "orders" DROP COLUMN "status"
  `);

    await queryRunner.query(`
    DROP TYPE "orders_status_enum"
  `);
  }
}
