import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './transaction.entity';
import { TransactionItem } from './transaction-item.entity';
import { Booking } from '../bookings/booking.entity';

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

  checkoutBooking(bookingId: string, buildTransaction: (booking: Booking) => Partial<Transaction>): Promise<Transaction> {
    return this.repository.manager.transaction(async (manager) => {
      const booking = await manager.findOne(Booking, {
        where: { id: bookingId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!booking) throw new NotFoundException('Booking not found');

      // Reuse the invoice on a retry or when an earlier checkout saved only the invoice.
      const existing = await manager.findOne(Transaction, {
        where: { bookingId, deleted: 0 },
        relations: { items: true },
        order: { createdAt: 'DESC' },
      });
      if (booking.statusCode === 'COMPLETED' && existing) return existing;
      if (booking.statusCode !== 'CONFIRMED') {
        throw new ConflictException('Only a confirmed booking can be checked out.');
      }

      const invoice = existing ?? await manager.save(manager.create(Transaction, buildTransaction(booking)));
      booking.statusCode = 'COMPLETED';
      booking.completedAt = new Date();
      await manager.save(booking);
      return invoice;
    });
  }

  async save(transaction: Transaction): Promise<Transaction> {
    return this.repository.save(transaction);
  }
}
