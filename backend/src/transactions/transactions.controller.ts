import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { Transaction } from './transaction.entity';
import { RequireStaff } from '../auth/staff-access.guard';
import { parseInput } from '../input';
import { paymentStatusField, transactionInput } from './transaction-input';

@Controller('transactions')
@RequireStaff(['page_transactions'])
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  findAll(): Promise<Transaction[]> {
    return this.transactionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Transaction> {
    return this.transactionsService.findById(id);
  }

  @Post()
  @RequireStaff(['page_transactions', 'feat_transactions_create'])
  create(@Body() data: unknown): Promise<Transaction> {
    return this.transactionsService.create(parseInput(transactionInput, data));
  }

  @Post('booking-checkout/:bookingId')
  @RequireStaff(['page_bookings', 'feat_bookings_status', 'feat_transactions_create'])
  checkoutBooking(@Param('bookingId', ParseUUIDPipe) bookingId: string, @Body() data: unknown): Promise<Transaction> {
    return this.transactionsService.checkoutBooking(bookingId, parseInput(transactionInput, data));
  }

  @Patch(':id/status')
  @RequireStaff(['page_transactions', 'feat_transactions_status'])
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: unknown,
  ): Promise<Transaction> {
    return this.transactionsService.updateStatus(id, parseInput(paymentStatusField, status));
  }

  @Delete(':id')
  @RequireStaff(['page_transactions', 'feat_transactions_delete'])
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.transactionsService.remove(id);
  }
}
