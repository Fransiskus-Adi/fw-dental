import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './transaction.entity';
import { TransactionItem } from './transaction-item.entity';

@Injectable()
export class TransactionsRepository {
  constructor(
    @InjectRepository(Transaction)
    private readonly repository: Repository<Transaction>,
    @InjectRepository(TransactionItem)
    private readonly itemRepository: Repository<TransactionItem>,
  ) {}

  async findAll(): Promise<Transaction[]> {
    return this.repository.find({
      where: { deleted: 0 },
      relations: {
        patient: true,
        doctor: true,
        items: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Transaction | null> {
    return this.repository.findOne({
      where: { id, deleted: 0 },
      relations: {
        patient: true,
        doctor: true,
        booking: true,
        items: true,
      },
    });
  }

  async createAndSave(transactionData: Partial<Transaction>): Promise<Transaction> {
    const transaction = this.repository.create(transactionData);
    return this.repository.save(transaction);
  }

  async save(transaction: Transaction): Promise<Transaction> {
    return this.repository.save(transaction);
  }
}
