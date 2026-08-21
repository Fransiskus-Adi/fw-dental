import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Booking } from './booking.entity';

@Injectable()
export class BookingsRepository {
  constructor(
    @InjectRepository(Booking)
    private readonly repository: Repository<Booking>,
  ) {}

  async findById(id: string): Promise<Booking | null> {
    return this.repository.findOne({
      where: { id },
      relations: {
        patient: true,
        doctor: true,
        service: true,
      },
    });
  }

  async findAll(): Promise<Booking[]> {
    return this.repository.find({
      relations: {
        patient: true,
        doctor: true,
        service: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async hasConflict(
    doctorId: string,
    bookingDate: string,
    startTime: string,
  ): Promise<boolean> {
    const count = await this.repository.count({
      where: {
        doctorId,
        bookingDate,
        startTime,
        statusCode: Not('CANCELLED'),
      },
    });
    return count > 0;
  }

  async createAndSave(bookingData: Partial<Booking>): Promise<Booking> {
    const booking = this.repository.create(bookingData);
    return this.repository.save(booking);
  }

  async save(booking: Booking): Promise<Booking> {
    return this.repository.save(booking);
  }
}
