import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { Booking } from './booking.entity';
import { Patient } from './patient.entity';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  findAll(): Promise<Booking[]> {
    return this.bookingsService.findAll();
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
