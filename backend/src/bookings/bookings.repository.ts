import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, Not, QueryFailedError } from 'typeorm';
import { Booking } from './booking.entity';
import { Patient } from './patient.entity';

type DoctorSchedule = Pick<Booking, 'doctorId' | 'bookingDate'>;

export function isBookingOverlap(error: unknown) {
  if (!(error instanceof QueryFailedError)) return false;
  const cause = error.driverError as { code?: string; constraint?: string };
  return cause.code === '23P01' && cause.constraint === 'bookings_doctor_time_exclusion';
}

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
        transactions: true,
      },
    });
  }

  async findAll(): Promise<Booking[]> {
    return this.repository.find({
      relations: {
        patient: true,
        doctor: true,
        service: true,
        transactions: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  occupiedOn(bookingDate: string) {
    return this.repository.find({
      where: {
        bookingDate,
        enabled: 1,
        deleted: 0,
        statusCode: Not('CANCELLED'),
      },
      select: { doctorId: true, startTime: true, endTime: true },
    });
  }

  async createAndSave(bookingData: Partial<Booking> & DoctorSchedule, patientData: Partial<Patient>): Promise<Booking> {
    return this.repository.manager.transaction(async (manager) => {
      await this.lockSchedule(manager, bookingData);
      // Serialize lookup/insert for the same phone, including the first booking.
      await manager.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [patientData.phoneNumber]);
      const patient = await manager.findOneBy(Patient, {
        phoneNumber: patientData.phoneNumber,
        deleted: 0,
      }) ?? await manager.save(manager.create(Patient, patientData));
      return manager.save(manager.create(Booking, { ...bookingData, patientId: patient.id }));
    });
  }

  async save(booking: Booking): Promise<Booking> {
    return this.repository.manager.transaction(async (manager) => {
      await this.lockSchedule(manager, booking);
      return manager.save(booking);
    });
  }

  private async lockSchedule(manager: EntityManager, schedule: DoctorSchedule) {
    // Serialize same-day edits so concurrent GiST insert checks cannot deadlock.
    await manager.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 1))', [
      schedule.doctorId + '/' + schedule.bookingDate,
    ]);
  }
}
