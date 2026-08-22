import { Order } from 'src/orders/entities/order.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Piece {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => Order, (order) => order.pieces, { onDelete: 'CASCADE' })
  order: Order;
}
