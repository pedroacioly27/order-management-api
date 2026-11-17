import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeliveryDateToOrders1792608608427 implements MigrationInterface {
  name = 'AddDeliveryDateToOrders1792608608427';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" ADD "deliveryDate" date`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "deliveryDate"`);
  }
}
