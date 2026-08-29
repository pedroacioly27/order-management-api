import { Module } from '@nestjs/common';
import { PiecesService } from './pieces.service';
import { PiecesController } from './pieces.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Piece } from './entities/piece.entity';
import { Order } from 'src/orders/entities/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Piece, Order])],
  controllers: [PiecesController],
  providers: [PiecesService],
})
export class PiecesModule {}
