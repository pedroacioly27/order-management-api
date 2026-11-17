import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderRelationToTransactions1794616833252 implements MigrationInterface {
  name = 'AddOrderRelationToTransactions1794616833252';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."transactions_orderpaymenttype_enum" AS ENUM('SIGNAL', 'FINAL_PAYMENT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "orderPaymentType" "public"."transactions_orderpaymenttype_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "transactions" ADD "orderId" integer`);
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_2fdbbae70ff802bc8b703ee7c5c" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_2fdbbae70ff802bc8b703ee7c5c"`,
    );
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "orderId"`);
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "orderPaymentType"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."transactions_orderpaymenttype_enum"`,
    );
  }
}
