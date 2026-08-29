import { Piece } from 'src/pieces/entities/piece.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('parts')
export class Part {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 6, scale: 2 })
  weight: number;

  @ManyToOne(() => Piece, (piece) => piece.parts, { onDelete: 'CASCADE' })
  piece: Piece;
}
