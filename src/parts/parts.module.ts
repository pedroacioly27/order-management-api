import { Module } from '@nestjs/common';
import { PartsService } from './parts.service';
import { PartsController } from './parts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Piece } from 'src/pieces/entities/piece.entity';
import { Part } from './entities/part.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Piece, Part])],
  controllers: [PartsController],
  providers: [PartsService],
})
export class PartsModule {}
