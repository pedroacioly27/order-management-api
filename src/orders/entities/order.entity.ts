import { Piece } from 'src/pieces/entities/piece.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrderStatus } from '../enums/order-status.enum';
import { Transaction } from 'src/transactions/entities/transaction.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  clientName: string;

  @Column()
  description: string;

  @Column({ type: 'date', nullable: true })
  deliveryDate: string | null;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({
    type: 'integer',
    nullable: true,
  })
  totalAmount: number | null;

  @Column({
    type: 'integer',
    nullable: true,
  })
  paidAmount: number | null;

  @Column({ type: 'integer' })
  orderNumber: number;

  @CreateDateColumn()
  createdDate: Date;

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Piece, (piece) => piece.order)
  pieces: Piece[];

  @OneToMany(() => Transaction, (transaction) => transaction.order)
  transactions: Transaction[];
}
