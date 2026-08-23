import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePieceDto } from './dto/create-piece.dto';
import { UpdatePieceDto } from './dto/update-piece.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Piece } from './entities/piece.entity';
import { Order } from 'src/orders/entities/order.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PiecesService {
  constructor(
    @InjectRepository(Piece)
    private readonly pieceRepository: Repository<Piece>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}
  async create(createPieceDto: CreatePieceDto, req) {
    const order = await this.orderRepository.findOne({
      where: { id: createPieceDto.orderId, user: { id: req.user.sub } },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    const piece = this.pieceRepository.create({
      name: createPieceDto.name,
      order,
    });
    await this.pieceRepository.save(piece);

    return piece;
  }

  async findAll(req) {
    const pieces = await this.pieceRepository.find({
      where: { order: { user: { id: req.user.sub } } },
      relations: { order: true },
    });

    return pieces;
  }

  async findOne(id: number, req) {
    const piece = await this.pieceRepository.findOne({
      where: { id, order: { user: { id: req.user.sub } } },
      relations: { order: true, parts: true },
    });
    if (!piece) {
      throw new NotFoundException('Piece not found');
    }
    return piece;
  }

  async update(id: number, updatePieceDto: UpdatePieceDto, req) {
    const piece = await this.findOne(id, req);

    if (updatePieceDto.name !== undefined) {
      piece.name = updatePieceDto.name;
    }
    if (updatePieceDto.orderId !== undefined) {
      const order = await this.orderRepository.findOne({
        where: { id: updatePieceDto.orderId, user: { id: req.user.sub } },
      });

      if (!order) {
        throw new NotFoundException('New order not found');
      }

      piece.order = order;
    }

    return this.pieceRepository.save(piece);
  }

  async remove(id: number, req) {
    const piece = await this.findOne(id, req);

    await this.pieceRepository.delete(piece.id);

    return { message: 'Piece successfully deleted' };
  }
}
