import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  NotFoundException,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { Booking } from './booking.entity';
import { Patient } from './patient.entity';
import { BookingRateLimitGuard } from './guards/booking-rate-limit.guard';
import { PublicRoute, RequireStaff } from '../auth/staff-access.guard';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @RequireStaff(['page_bookings'], ['page_schedules'])
  findAll(): Promise<Booking[]> {
    return this.bookingsService.findAll();
  }

  @Get('available-slots')
  @PublicRoute()
  async getAvailableSlots(
    @Query('date') date: unknown,
    @Query('serviceId') serviceId: unknown,
  ): Promise<string[]> {
    return this.bookingsService.getAvailableSlots(date, serviceId);
  }

  @Get('patients')
  @RequireStaff(['page_bookings'], ['page_transactions'])
  findAllPatients(): Promise<Patient[]> {
    return this.bookingsService.findAllPatients();
  }

  @Get(':id')
  @RequireStaff(['page_bookings'], ['page_schedules'])
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Booking> {
    const booking = await this.bookingsService.findById(id);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }

  @Post()
  @PublicRoute()
  @UseGuards(BookingRateLimitGuard)
  async create(
    @Body()
    data: unknown,
  ) {
    const { bookingCode, statusCode } =
      await this.bookingsService.createBooking(data);
    return { bookingCode, statusCode };
  }

  @Post('staff')
  @RequireStaff(['page_bookings', 'feat_bookings_create'])
  @UseGuards(BookingRateLimitGuard)
  createAsStaff(@Body() data: unknown) {
    return this.create(data);
  }

  @Patch(':id/status')
  @RequireStaff(['page_bookings', 'feat_bookings_status'])
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') statusCode: unknown,
  ): Promise<Booking> {
    return this.bookingsService.updateStatus(id, statusCode);
  }

  @Patch(':id/cancel')
  @RequireStaff(['page_schedules', 'feat_schedules_cancel'])
  cancelFromSchedule(@Param('id', ParseUUIDPipe) id: string): Promise<Booking> {
    return this.bookingsService.updateStatus(id, 'CANCELLED');
  }
}
