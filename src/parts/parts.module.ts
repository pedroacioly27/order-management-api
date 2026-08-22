import { Module } from '@nestjs/common';
import { PartsService } from './parts.service';
import { PartsController } from './parts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Piece } from 'src/pieces/entities/piece.entity';
import { Part } from './entities/part.entity';
import { Order } from 'src/orders/entities/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Piece, Part, Order])],
  controllers: [PartsController],
  providers: [PartsService],
})
export class PartsModule {}
