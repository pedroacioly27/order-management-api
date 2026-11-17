import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import {
  Between,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { Category } from 'src/categories/entities/category.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { AuthRequest } from 'src/types/auth-request.type';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { SummaryTransactionsDto } from './dto/summary-transactions.dto';
import { TransactionType } from './enums/transaction-type.enum';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createTransactionDto: CreateTransactionDto, req: AuthRequest) {
    let category: Category | null = null;

    if (createTransactionDto.categoryId) {
      category = await this.categoryRepository.findOne({
        where: {
          id: createTransactionDto.categoryId,
          user: { id: req.user.sub },
        },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }
    const transaction = this.transactionRepository.create({
      description: createTransactionDto.description,
      amount: createTransactionDto.amount,
      type: createTransactionDto.type,
      date: createTransactionDto.date,
      user: { id: req.user.sub },
      category,
    });

    return this.transactionRepository.save(transaction);
  }

  async findAll(req: AuthRequest) {
    return this.transactionRepository.find({
      where: { user: { id: req.user.sub } },
      relations: { category: true, order: true },
      order: {
        date: 'DESC',
        id: 'DESC',
      },
    });
  }

  async findOne(id: number, req: AuthRequest) {
    const transaction = await this.transactionRepository.findOne({
      where: { id, user: { id: req.user.sub } },
      relations: { category: true, order: true },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async update(
    id: number,
    updateTransactionDto: UpdateTransactionDto,
    req: AuthRequest,
  ) {
    const transaction = await this.findOne(id, req);

    if (transaction.order) {
      throw new BadRequestException(
        'Transactions linked to orders cannot be edited',
      );
    }

    if (updateTransactionDto.categoryId !== undefined) {
      if (updateTransactionDto.categoryId === null) {
        transaction.category = null;
      } else {
        const category = await this.categoryRepository.findOne({
          where: {
            id: updateTransactionDto.categoryId,
            user: { id: req.user.sub },
          },
        });

        if (!category) {
          throw new NotFoundException('Category not found');
        }

        transaction.category = category;
      }
    }
    if (updateTransactionDto.description !== undefined) {
      transaction.description = updateTransactionDto.description;
    }
    if (updateTransactionDto.amount !== undefined) {
      transaction.amount = updateTransactionDto.amount;
    }
    if (updateTransactionDto.type !== undefined) {
      transaction.type = updateTransactionDto.type;
    }
    if (updateTransactionDto.date !== undefined) {
      transaction.date = updateTransactionDto.date;
    }

    return this.transactionRepository.save(transaction);
  }

  async remove(id: number, req: AuthRequest) {
    const transaction = await this.findOne(id, req);

    if (transaction.order) {
      throw new BadRequestException(
        'Transactions linked to orders cannot be deleted',
      );
    }

    await this.transactionRepository.delete(transaction.id);

    return { message: 'Transaction successfully deleted' };
  }

  async summary(
    summaryTransactionsDto: SummaryTransactionsDto,
    req: AuthRequest,
  ) {
    const where: FindOptionsWhere<Transaction> = {
      user: { id: req.user.sub },
    };

    if (summaryTransactionsDto.startDate && summaryTransactionsDto.endDate) {
      where.date = Between(
        summaryTransactionsDto.startDate,
        summaryTransactionsDto.endDate,
      );
    } else if (summaryTransactionsDto.startDate) {
      where.date = MoreThanOrEqual(summaryTransactionsDto.startDate);
    } else if (summaryTransactionsDto.endDate) {
      where.date = LessThanOrEqual(summaryTransactionsDto.endDate);
    } else {
      const year = new Date().getFullYear();

      where.date = Between(`${year}-01-01`, `${year}-12-31`);
    }

    const transactions = await this.transactionRepository.find({ where });

    let totalIncome = 0;
    let totalExpense = 0;

    for (const transaction of transactions) {
      if (transaction.type === TransactionType.INCOME) {
        totalIncome += Number(transaction.amount);
      }
      if (transaction.type === TransactionType.EXPENSE) {
        totalExpense += Number(transaction.amount);
      }
    }

    const balance = totalIncome - totalExpense;

    return {
      totalIncome: Number((totalIncome / 100).toFixed(2)),
      totalExpense: Number((totalExpense / 100).toFixed(2)),
      balance: Number((balance / 100).toFixed(2)),
    };
  }
}
