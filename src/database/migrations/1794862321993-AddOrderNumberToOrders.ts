import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderNumberToOrders1794861713201 implements MigrationInterface {
  name = 'AddOrderNumberToOrders1794861713201';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
  ALTER TABLE "users"
  ADD "lastOrderNumber" integer NOT NULL DEFAULT 0
`);

    await queryRunner.query(`
    ALTER TABLE "orders"
    ADD "orderNumber" integer
  `);

    await queryRunner.query(`
    WITH numbered_orders AS (
      SELECT
        id,
        ROW_NUMBER() OVER (
          PARTITION BY user_id
          ORDER BY "createdDate" ASC, id ASC
        ) AS order_number
      FROM "orders"
    )
    UPDATE "orders" AS orders
    SET "orderNumber" = numbered_orders.order_number
    FROM numbered_orders
    WHERE orders.id = numbered_orders.id
  `);

    await queryRunner.query(`
    UPDATE "users" AS users
    SET "lastOrderNumber" = COALESCE(
      (
        SELECT MAX(orders."orderNumber")
        FROM "orders" AS orders
        WHERE orders.user_id = users.id
      ),
      0
    )
  `);

    await queryRunner.query(`
    ALTER TABLE "orders"
    ALTER COLUMN "orderNumber" SET NOT NULL
  `);

    await queryRunner.query(`
    CREATE UNIQUE INDEX "IDX_orders_user_order_number"
    ON "orders" (user_id, "orderNumber")
  `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
    DROP INDEX "IDX_orders_user_order_number"
  `);

    await queryRunner.query(`
    ALTER TABLE "users"
    DROP COLUMN "lastOrderNumber"
  `);

    await queryRunner.query(`
    ALTER TABLE "orders"
    DROP COLUMN "orderNumber"
  `);
  }
}
