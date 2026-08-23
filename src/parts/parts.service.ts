import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePartDto } from './dto/create-part.dto';
import { UpdatePartDto } from './dto/update-part.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Part } from './entities/part.entity';
import { Repository } from 'typeorm';
import { Piece } from 'src/pieces/entities/piece.entity';

@Injectable()
export class PartsService {
  constructor(
    @InjectRepository(Part)
    private readonly partRepository: Repository<Part>,
    @InjectRepository(Piece)
    private readonly pieceRepository: Repository<Piece>,
  ) {}

  async findOnePiece(pieceId: number, userId: number) {
    const piece = await this.pieceRepository.findOne({
      where: {
        id: pieceId,
        order: { user: { id: userId } },
      },
    });
    if (!piece) {
      throw new NotFoundException('Piece not found');
    }
    return piece;
  }

  async findOnePart(partId: number, userId: number) {
    const part = await this.partRepository.findOne({
      where: { id: partId, piece: { order: { user: { id: userId } } } },
      relations: { piece: true },
    });

    if (!part) {
      throw new NotFoundException('Part not found');
    }

    return part;
  }

  async create(createPartDto: CreatePartDto, req) {
    const piece = await this.findOnePiece(createPartDto.pieceId, req.user.sub);
    const part = this.partRepository.create({
      name: createPartDto.name,
      weight: createPartDto.weight,
      piece,
    });

    await this.partRepository.save(part);

    return part;
  }

  async update(id: number, updatePartDto: UpdatePartDto, req) {
    const part = await this.findOnePart(id, req.user.sub);

    if (updatePartDto.name !== undefined) {
      part.name = updatePartDto.name;
    }
    if (updatePartDto.weight !== undefined) {
      part.weight = updatePartDto.weight;
    }
    if (updatePartDto.pieceId !== undefined) {
      const piece = await this.findOnePiece(
        updatePartDto.pieceId,
        req.user.sub,
      );
      part.piece = piece;
    }

    return this.partRepository.save(part);
  }

  async remove(id: number, req) {
    const part = await this.findOnePart(id, req.user.sub);

    await this.partRepository.delete(part.id);

    return { message: 'Part successfully deleted' };
  }
}
