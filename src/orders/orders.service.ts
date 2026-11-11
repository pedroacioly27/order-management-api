import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { ILike, Repository, Not, IsNull } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { AuthRequest } from 'src/types/auth-request.type';
import { OrderStatus } from './enums/order-status.enum';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  async create(createOrderDto: CreateOrderDto, req: AuthRequest) {
    const user = await this.userRepository.findOne({
      where: { id: req.user.sub },
    });
    if (!user) {
      throw new UnauthorizedException('User not authorized');
    }
    if (
      (createOrderDto.totalAmount !== undefined &&
        createOrderDto.paidAmount !== undefined &&
        createOrderDto.totalAmount < createOrderDto.paidAmount) ||
      (createOrderDto.totalAmount === undefined &&
        createOrderDto.paidAmount !== undefined)
    ) {
      throw new BadRequestException('Paid amount cannot exceed total amount');
    }
    const order = this.orderRepository.create({
      clientName: createOrderDto.clientName,
      description: createOrderDto.description,
      deliveryDate: createOrderDto.deliveryDate ?? null,
      status: createOrderDto.status ?? OrderStatus.PENDING,
      totalAmount: createOrderDto.totalAmount ?? null,
      paidAmount: createOrderDto.paidAmount ?? null,
      user: { id: user.id },
    });

    await this.orderRepository.save(order);

    return order;
  }

  findAll(
    req: AuthRequest,
    clientName: string,
    deliveryDate: string,
    hideCompleted: boolean,
    onlyWithDeliveryDate: boolean,
  ) {
    if (clientName) {
      if (deliveryDate) {
        return this.orderRepository.find({
          where: {
            user: { id: req.user.sub },
            clientName: ILike(`%${clientName}%`),
            deliveryDate,
            ...(hideCompleted && { status: Not(OrderStatus.COMPLETED) }),
          },
          relations: { pieces: { parts: true } },
          order: {
            id: 'DESC',
          },
        });
      }
      return this.orderRepository.find({
        where: {
          user: { id: req.user.sub },
          clientName: ILike(`%${clientName}%`),
          ...(onlyWithDeliveryDate && { deliveryDate: Not(IsNull()) }),
          ...(hideCompleted && { status: Not(OrderStatus.COMPLETED) }),
        },
        relations: { pieces: { parts: true } },
        order: {
          id: 'DESC',
        },
      });
    }
    if (deliveryDate && !clientName) {
      return this.orderRepository.find({
        where: {
          user: { id: req.user.sub },
          deliveryDate,
          ...(hideCompleted && { status: Not(OrderStatus.COMPLETED) }),
        },
        relations: { pieces: { parts: true } },
        order: {
          id: 'DESC',
        },
      });
    }

    return this.orderRepository.find({
      where: {
        user: { id: req.user.sub },
        ...(onlyWithDeliveryDate && {
          deliveryDate: Not(IsNull()),
        }),
        ...(hideCompleted && { status: Not(OrderStatus.COMPLETED) }),
      },
      relations: { pieces: { parts: true } },
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number, req: AuthRequest) {
    const order = await this.orderRepository.findOne({
      where: { id, user: { id: req.user.sub } },
      relations: { pieces: { parts: true } },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async update(id: number, updateOrderDto: UpdateOrderDto, req: AuthRequest) {
    const order = await this.findOne(id, req);

    if (updateOrderDto.clientName !== undefined) {
      order.clientName = updateOrderDto.clientName;
    }
    if (updateOrderDto.description !== undefined) {
      order.description = updateOrderDto.description;
    }
    if (updateOrderDto.deliveryDate !== undefined) {
      order.deliveryDate = updateOrderDto.deliveryDate;
    }
    if (updateOrderDto.status !== undefined) {
      order.status = updateOrderDto.status;
    }

    if (
      updateOrderDto.totalAmount !== undefined ||
      updateOrderDto.paidAmount !== undefined
    ) {
      const totalAmount = updateOrderDto.totalAmount ?? order.totalAmount;

      const paidAmount = updateOrderDto.paidAmount ?? order.paidAmount;

      if (paidAmount !== null && totalAmount === null) {
        throw new BadRequestException(
          'Total amount must be informed before registering a payment',
        );
      }

      if (
        paidAmount !== null &&
        totalAmount !== null &&
        paidAmount > totalAmount
      ) {
        throw new BadRequestException('Paid amount cannot exceed total amount');
      }

      if (updateOrderDto.totalAmount !== undefined) {
        order.totalAmount = updateOrderDto.totalAmount;
      }

      if (updateOrderDto.paidAmount !== undefined) {
        order.paidAmount = updateOrderDto.paidAmount;
      }
    }

    return this.orderRepository.save(order);
  }

  async remove(id: number, req: AuthRequest) {
    const order = await this.findOne(id, req);

    await this.orderRepository.delete(order.id);

    return { message: 'Order successfully deleted' };
  }
}
