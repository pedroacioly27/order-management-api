import { Order } from 'src/orders/entities/order.entity';
import { Part } from 'src/parts/entities/part.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Piece {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => Order, (order) => order.pieces, { onDelete: 'CASCADE' })
  order: Order;

  @OneToMany(() => Part, (part) => part.piece)
  parts: Part[];
}
