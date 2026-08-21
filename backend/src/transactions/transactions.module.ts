import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './transaction.entity';
import { TransactionItem } from './transaction-item.entity';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { TransactionsRepository } from './transactions.repository';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, TransactionItem]),
    BookingsModule,
  ],
  providers: [TransactionsService, TransactionsRepository],
  controllers: [TransactionsController],
  exports: [TransactionsService, TransactionsRepository],
})
export class TransactionsModule {}
