import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  async create(createOrderDto: CreateOrderDto, req) {
    const user = await this.userRepository.findOne({
      where: { id: req.user.sub },
    });
    if (!user) {
      throw new UnauthorizedException('User not authorized');
    }

    const order = this.orderRepository.create({
      clientName: createOrderDto.clientName,
      description: createOrderDto.description,
      user: { id: user.id },
    });

    await this.orderRepository.save(order);

    return order;
  }

  findAll(req) {
    return this.orderRepository.find({ where: { user: { id: req.user.sub } } });
  }

  async findOne(id: number, req) {
    const order = await this.orderRepository.findOne({
      where: { id, user: { id: req.user.sub } },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async update(id: number, updateOrderDto: UpdateOrderDto, req) {
    const order = await this.findOne(id, req);

    if (updateOrderDto.clientName !== undefined) {
      order.clientName = updateOrderDto.clientName;
    }
    if (updateOrderDto.description !== undefined) {
      order.description = updateOrderDto.description;
    }

    return this.orderRepository.save(order);
  }

  async remove(id: number, req) {
    const order = await this.findOne(id, req);

    await this.orderRepository.delete(order.id);

    return { message: 'Order successfully deleted' };
  }
}
