import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { Booking } from './booking.entity';
import { Patient } from './patient.entity';
import { BookingRateLimitGuard } from './guards/booking-rate-limit.guard';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  findAll(): Promise<Booking[]> {
    return this.bookingsService.findAll();
  }

  @Get('available-slots')
  async getAvailableSlots(
    @Query('date') date: string,
    @Query('serviceId') serviceId: string,
  ): Promise<string[]> {
    return this.bookingsService.getAvailableSlots(date, serviceId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Booking> {
    const booking = await this.bookingsService.findById(id);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }

  @Post()
  @UseGuards(BookingRateLimitGuard)
  create(
    @Body()
    data: {
      name: string;
      phone: string;
      email?: string;
      serviceId: string;
      date: string;
      time: string;
      patientNotes?: string;
      website?: string;
    },
  ): Promise<Booking> {
    return this.bookingsService.createBooking(data);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') statusCode: string,
  ): Promise<Booking> {
    return this.bookingsService.updateStatus(id, statusCode);
  }

  @Get('patients')
  findAllPatients(): Promise<Patient[]> {
    return this.bookingsService.findAllPatients();
  }
}
