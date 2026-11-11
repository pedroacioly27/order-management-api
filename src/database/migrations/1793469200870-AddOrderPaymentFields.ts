import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderPaymentFields1793469200870 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "orders"
            ADD COLUMN "totalAmount" integer,
            ADD COLUMN "paidAmount" integer
            `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE "orders"
        DROP COLUMN "totalAmount",
        DROP COLUMN "paidAmount"
     `);
  }
}
