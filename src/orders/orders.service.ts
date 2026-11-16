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
import {
  ILike,
  Repository,
  Not,
  IsNull,
  EntityManager,
  DataSource,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { AuthRequest } from 'src/types/auth-request.type';
import { OrderStatus } from './enums/order-status.enum';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import { OrderPaymentType } from 'src/transactions/enums/order-payment-type.enum';
import { TransactionType } from 'src/transactions/enums/transaction-type.enum';
import { RemoveOrderDto } from './dto/remove-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly dataSource: DataSource,
  ) {}

  private getCurrentDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private async registerOrderPayment(
    manager: EntityManager,
    order: Order,
    amount: number,
    paymentType: OrderPaymentType,
    user: User,
  ) {
    if (amount <= 0) return;

    const transactionRepository = manager.getRepository(Transaction);

    const existingTransaction = await transactionRepository.findOne({
      where: {
        order: { id: order.id },
        orderPaymentType: paymentType,
      },
    });

    if (existingTransaction) {
      existingTransaction.amount = amount;
      existingTransaction.description = `${paymentType === OrderPaymentType.SIGNAL ? 'Sinal' : 'Pagamento restante'} - Encomenda #${order.id} - ${order.clientName}`;

      await transactionRepository.save(existingTransaction);

      return;
    }

    const transaction = transactionRepository.create({
      description: `${paymentType === OrderPaymentType.SIGNAL ? 'Sinal' : 'Pagamento restante'} - Encomenda #${order.id} - ${order.clientName}`,
      amount,
      type: TransactionType.INCOME,
      date: this.getCurrentDate(),
      category: null,
      user,
      order,
      orderPaymentType: paymentType,
    });

    await transactionRepository.save(transaction);
  }

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
    return this.dataSource.transaction(async (manager) => {
      const order = manager.create(Order, {
        clientName: createOrderDto.clientName,
        description: createOrderDto.description,
        deliveryDate: createOrderDto.deliveryDate ?? null,
        status: createOrderDto.status ?? OrderStatus.PENDING,
        totalAmount: createOrderDto.totalAmount ?? null,
        paidAmount: createOrderDto.paidAmount ?? null,
        user: { id: user.id },
      });

      const savedOrder = await manager.save(order);

      if (savedOrder.paidAmount && savedOrder.paidAmount > 0) {
        await this.registerOrderPayment(
          manager,
          savedOrder,
          savedOrder.paidAmount,
          OrderPaymentType.SIGNAL,
          user,
        );
      }

      return savedOrder;
    });
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
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: {
          id,
          user: { id: req.user.sub },
        },
        relations: { pieces: { parts: true } },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      const wasCompleted = order.status === OrderStatus.COMPLETED;

      if (
        wasCompleted &&
        (updateOrderDto.totalAmount !== undefined ||
          updateOrderDto.paidAmount !== undefined)
      ) {
        throw new BadRequestException(
          'Financial data cannot be updated for completed orders',
        );
      }

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

        const paidAmount =
          updateOrderDto.paidAmount !== undefined
            ? updateOrderDto.paidAmount
            : order.paidAmount;

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
          throw new BadRequestException(
            'Paid amount cannot exceed total amount',
          );
        }

        if (updateOrderDto.totalAmount !== undefined) {
          order.totalAmount = updateOrderDto.totalAmount;
        }

        if (updateOrderDto.paidAmount !== undefined) {
          const signalTransaction = await manager.findOne(Transaction, {
            where: {
              order: { id: order.id },
              orderPaymentType: OrderPaymentType.SIGNAL,
            },
          });

          const finalPayment = await manager.findOne(Transaction, {
            where: {
              order: { id: order.id },
              orderPaymentType: OrderPaymentType.FINAL_PAYMENT,
            },
          });

          const finalPaymentAmount = finalPayment?.amount ?? 0;

          const newPaidAmount = updateOrderDto.paidAmount;

          const newSignalAmount =
            newPaidAmount === null ? 0 : newPaidAmount - finalPaymentAmount;

          if (
            finalPaymentAmount > 0 &&
            (newPaidAmount === null || newPaidAmount < finalPaymentAmount)
          ) {
            throw new BadRequestException(
              'Paid amount cannot be less than the final payment already received',
            );
          }

          if (newSignalAmount === 0) {
            if (signalTransaction) {
              await manager.remove(signalTransaction);
            }
          } else if (signalTransaction) {
            signalTransaction.amount = newSignalAmount;
            await manager.save(signalTransaction);
          } else if (newSignalAmount > 0) {
            const user = await manager.findOne(User, {
              where: { id: req.user.sub },
            });

            if (!user) {
              throw new UnauthorizedException('User not authorized');
            }

            await this.registerOrderPayment(
              manager,
              order,
              newSignalAmount,
              OrderPaymentType.SIGNAL,
              user,
            );
          }

          order.paidAmount = newPaidAmount;
        }
      }

      if (
        wasCompleted &&
        order.status !== OrderStatus.COMPLETED &&
        updateOrderDto.reopenMistake === true
      ) {
        const finalPayment = await manager.findOne(Transaction, {
          where: {
            order: { id: order.id },
            orderPaymentType: OrderPaymentType.FINAL_PAYMENT,
          },
        });

        if (finalPayment) {
          await manager.remove(finalPayment);

          order.paidAmount = Math.max(
            0,
            (order.paidAmount ?? 0) - finalPayment.amount,
          );
        }
      }

      if (!wasCompleted && order.status === OrderStatus.COMPLETED) {
        if (order.totalAmount !== null) {
          const signalTransaction = await manager.findOne(Transaction, {
            where: {
              order: { id: order.id },
              orderPaymentType: OrderPaymentType.SIGNAL,
            },
          });

          const signalAmount = signalTransaction?.amount ?? 0;

          const finalPaymentAmount = order.totalAmount - signalAmount;

          if (finalPaymentAmount > 0) {
            const user = await manager.findOne(User, {
              where: { id: req.user.sub },
            });
            if (!user) {
              throw new UnauthorizedException('User not authorized');
            }

            await this.registerOrderPayment(
              manager,
              order,
              finalPaymentAmount,
              OrderPaymentType.FINAL_PAYMENT,
              user,
            );
          } else {
            const existingFinalPayment = await manager.findOne(Transaction, {
              where: {
                order: { id: order.id },
                orderPaymentType: OrderPaymentType.FINAL_PAYMENT,
              },
            });

            if (existingFinalPayment) {
              await manager.remove(existingFinalPayment);
            }
          }
          order.paidAmount = order.totalAmount;
        }
      }

      return manager.save(order);
    });
  }

  async remove(id: number, removeOrderDto: RemoveOrderDto, req: AuthRequest) {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: {
          id,
          user: { id: req.user.sub },
        },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      const transactions = await manager.find(Transaction, {
        where: {
          order: { id: order.id },
        },
      });

      const totalReceived = transactions
        .filter((transaction) => transaction.type === TransactionType.INCOME)
        .reduce((total, transaction) => total + transaction.amount, 0);

      if (removeOrderDto.refunded && totalReceived > 0) {
        const existingRefund = transactions.find(
          (transaction) =>
            transaction.orderPaymentType === OrderPaymentType.REFUND,
        );
        if (existingRefund) {
          await manager.remove(existingRefund);
        }

        const user = await manager.findOne(User, {
          where: { id: req.user.sub },
        });
        if (!user) {
          throw new UnauthorizedException('User not authorized');
        }

        const reversal = manager.create(Transaction, {
          description: `Estorno - Encomenda #${order.id} - ${order.clientName}`,
          amount: totalReceived,
          type: TransactionType.EXPENSE,
          date: this.getCurrentDate(),
          user,
          category: null,
          order,
          orderPaymentType: OrderPaymentType.REFUND,
        });

        await manager.save(reversal);
      }

      await manager.remove(order);

      return { message: 'Order successfully deleted' };
    });
  }
}
