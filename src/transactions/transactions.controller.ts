import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import type { AuthRequest } from 'src/types/auth-request.type';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { SummaryTransactionsDto } from './dto/summary-transactions.dto';

@UseGuards(AuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(
    @Body() createTransactionDto: CreateTransactionDto,
    @Req() req: AuthRequest,
  ) {
    return this.transactionsService.create(createTransactionDto, req);
  }

  @Get()
  findAll(@Req() req: AuthRequest) {
    return this.transactionsService.findAll(req);
  }

  @Get('summary')
  summary(
    @Query() summaryTransactionsDto: SummaryTransactionsDto,
    @Req() req: AuthRequest,
  ) {
    return this.transactionsService.summary(summaryTransactionsDto, req);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.transactionsService.findOne(id, req);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTransactionDto: UpdateTransactionDto,
    @Req() req: AuthRequest,
  ) {
    return this.transactionsService.update(id, updateTransactionDto, req);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.transactionsService.remove(id, req);
  }
}
