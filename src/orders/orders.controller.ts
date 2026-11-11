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
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import type { AuthRequest } from 'src/types/auth-request.type';

@UseGuards(AuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto, @Req() req: AuthRequest) {
    return this.ordersService.create(createOrderDto, req);
  }

  @Get()
  findAll(
    @Req() req: AuthRequest,
    @Query('clientName') clientName: string,
    @Query('deliveryDate') deliveryDate: string,
    @Query('hideCompleted') hideCompleted: string,
    @Query('onlyWithDeliveryDate') onlyWithDeliveryDate: string,
  ) {
    return this.ordersService.findAll(
      req,
      clientName,
      deliveryDate,
      hideCompleted === 'true',
      onlyWithDeliveryDate === 'true',
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.ordersService.findOne(id, req);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderDto: UpdateOrderDto,
    @Req() req: AuthRequest,
  ) {
    return this.ordersService.update(id, updateOrderDto, req);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.ordersService.remove(id, req);
  }
}
