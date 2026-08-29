import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { PiecesService } from './pieces.service';
import { CreatePieceDto } from './dto/create-piece.dto';
import { UpdatePieceDto } from './dto/update-piece.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@UseGuards(AuthGuard)
@Controller('pieces')
export class PiecesController {
  constructor(private readonly piecesService: PiecesService) {}

  @Post()
  create(@Body() createPieceDto: CreatePieceDto, @Req() req) {
    return this.piecesService.create(createPieceDto, req);
  }

  @Get()
  findAll(@Req() req, @Query('pieceName') pieceName: string) {
    return this.piecesService.findAll(req, pieceName);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.piecesService.findOne(id, req);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePieceDto: UpdatePieceDto,
    @Req() req,
  ) {
    return this.piecesService.update(id, updatePieceDto, req);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.piecesService.remove(id, req);
  }
}
