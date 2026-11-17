import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRefundToOrderPaymentType1794847898533 implements MigrationInterface {
  name = 'AddRefundToOrderPaymentType1794847898533';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."transactions_orderpaymenttype_enum" ADD VALUE 'REFUND'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."transactions_orderpaymenttype_enum_old" AS ENUM('SIGNAL', 'FINAL_PAYMENT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "orderPaymentType" TYPE "public"."transactions_orderpaymenttype_enum_old" USING "orderPaymentType"::"text"::"public"."transactions_orderpaymenttype_enum_old"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."transactions_orderpaymenttype_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."transactions_orderpaymenttype_enum_old" RENAME TO "transactions_orderpaymenttype_enum"`,
    );
  }
}
