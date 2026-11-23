import {
  BadRequestException, ConflictException, Injectable, NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { BookingsRepository, isBookingOverlap } from './bookings.repository';
import { PatientsRepository } from './patients.repository';
import { Doctor } from '../doctors/doctor.entity';
import { DoctorsService } from '../doctors/doctors.service';
import { ServicesService } from '../services/services.service';
import { NotificationsService } from '../notifications/notifications.service';

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const slotStarts = Array.from({ length: 16 }, (_, index) => 9 * 60 + index * 30);
const uuid = z.guid();
const bookingStatuses = z.enum(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW']);
const bookingInput = z.object({
  name: z.unknown(),
  phone: z.unknown(),
  email: z.unknown().optional(),
  serviceId: z.unknown(),
  date: z.unknown(),
  time: z.unknown(),
  patientNotes: z.string().trim().max(2000).optional(),
  website: z.string().trim().max(255).optional(),
});

function dateForBooking(date: unknown) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new BadRequestException('Date is required and must be in YYYY-MM-DD format.');
  }
  const [year, month, day] = date.split('-').map(Number);
  const result = new Date(year, month - 1, day);
  if (result.getFullYear() !== year || result.getMonth() !== month - 1 || result.getDate() !== day) {
    throw new BadRequestException('Invalid booking date.');
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (result < today) throw new BadRequestException('Booking date cannot be in the past.');
  const lastDay = new Date(today);
  lastDay.setDate(lastDay.getDate() + 90);
  if (result > lastDay) throw new BadRequestException('Booking date cannot be more than 90 days in the future.');
  return result;
}

function timeInMinutes(time: string) {
  const [hours, minutes, seconds = 0] = time.split(':').map(Number);
  return hours * 60 + minutes + seconds / 60;
}

function timeFromMinutes(minutes: number) {
  return [Math.floor(minutes / 60), minutes % 60].map(part => String(part).padStart(2, '0')).join(':');
}

function isUpcoming(day: Date, minutes: number, now: Date) {
  return day.toDateString() !== now.toDateString() || minutes > now.getHours() * 60 + now.getMinutes();
}

function fitsShift(doctor: Doctor, day: Date, start: number, end: number) {
  return doctor.status === 'Active' && doctor.days?.includes(weekdays[day.getDay()]) &&
    start >= timeInMinutes(doctor.shiftStart || '09:00') &&
    end <= timeInMinutes(doctor.shiftEnd || '17:00') && end < 24 * 60;
}

@Injectable()
export class BookingsService {
  constructor(
    private readonly bookingsRepository: BookingsRepository,
    private readonly patientsRepository: PatientsRepository,
    private readonly doctorsService: DoctorsService,
    private readonly servicesService: ServicesService,
    private readonly notifications: NotificationsService,
  ) {}

  findAll() {
    return this.bookingsRepository.findAll();
  }

  findById(id: string) {
    return this.bookingsRepository.findById(id);
  }

  async createBooking(input: unknown) {
    const parsed = bookingInput.safeParse(input);
    if (!parsed.success) throw new BadRequestException('Invalid booking details.');
    const { name, phone, email, serviceId, date, time, patientNotes, website } = parsed.data;
    if (website) throw new BadRequestException('Suspicious request detected.');
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
      throw new BadRequestException('Name must be between 2 and 100 characters.');
    }
    if (/<[^>]*>|https?:\/\/|\bwww\.|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/.test(name)) {
      throw new BadRequestException('Invalid name format.');
    }
    const phoneNumber = typeof phone === 'string' ? phone.trim() : '';
    const digits = phoneNumber.replace(/\D/g, '');
    if (!/^\+?[0-9\s\-()]{7,20}$/.test(phoneNumber) || digits.length < 7 || digits.length > 15) {
      throw new BadRequestException('Invalid phone number format. Allowed characters: digits, spaces, parentheses, hyphens, and +.');
    }
    const address = typeof email === 'string' ? email.trim() : undefined;
    if (email !== undefined && (address === undefined || (address && !z.email().max(150).safeParse(address).success))) {
      throw new BadRequestException('Invalid email format.');
    }
    const day = dateForBooking(date);
    if (typeof time !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d(?::00)?$/.test(time)) {
      throw new BadRequestException('Time is required and must be in HH:MM format.');
    }
    const start = timeInMinutes(time);
    if (!slotStarts.includes(start) || !isUpcoming(day, start, new Date())) {
      throw new BadRequestException('Choose a future booking slot.');
    }
    const service = uuid.safeParse(serviceId);
    const treatment = service.success ? await this.servicesService.findById(service.data) : null;
    if (!treatment || treatment.enabled !== 1 || treatment.deleted !== 0) {
      throw new BadRequestException('Invalid service/treatment selected.');
    }

    const end = start + (treatment.durationMinutes || 30);
    const doctors = await this.doctorsService.findAll();
    const candidates = doctors.filter(doctor => fitsShift(doctor, day, start, end));
    for (const doctor of candidates) {
      try {
        const booking = await this.bookingsRepository.createAndSave({
          bookingCode: 'BKG-' + randomBytes(8).toString('hex').toUpperCase(),
          bookingDate: date as string,
          clinicId: doctor.clinicId ?? treatment.clinicId,
          doctorId: doctor.id,
          serviceId: treatment.id,
          startTime: timeFromMinutes(start),
          endTime: timeFromMinutes(end),
          statusCode: 'PENDING',
          sourceCode: 'WEBSITE',
          patientNotes,
        }, {
          patientCode: 'PAT-' + randomBytes(8).toString('hex').toUpperCase(),
          fullName: name.trim(),
          phoneNumber,
          email: address || undefined,
        });
        void this.notifications.publish('BOOKING_CREATED');
        return booking;
      } catch (error) {
        if (!isBookingOverlap(error)) throw error;
      }
    }
    throw new ConflictException('That slot is unavailable. Please choose another time.');
  }

  async updateStatus(id: string, status: unknown) {
    const parsed = bookingStatuses.safeParse(typeof status === 'string' ? status.toUpperCase() : status);
    if (!parsed.success) throw new BadRequestException('Invalid booking status.');
    const booking = await this.bookingsRepository.findById(id);
    if (!booking) throw new NotFoundException('Booking not found');

    booking.statusCode = parsed.data;
    const now = new Date();
    if (booking.statusCode === 'CONFIRMED') {
      booking.confirmedAt = now;
    } else if (booking.statusCode === 'COMPLETED') {
      if (booking.sourceCode === 'WEBSITE' && !booking.transactions?.some(tx => tx.deleted === 0)) {
        throw new BadRequestException('A transaction must be created for this online booking before it can be marked as completed.');
      }
      booking.completedAt = now;
    } else if (booking.statusCode === 'CANCELLED') {
      booking.cancelledAt = now;
    }

    try {
      return await this.bookingsRepository.save(booking);
    } catch (error) {
      if (!isBookingOverlap(error)) throw error;
      throw new ConflictException('This booking overlaps another appointment.');
    }
  }

  async getAvailableSlots(date: unknown, serviceId: unknown) {
    if (typeof date !== 'string' || !uuid.safeParse(serviceId).success) return [];
    let day: Date;
    try {
      day = dateForBooking(date);
    } catch (error) {
      if (error instanceof BadRequestException) return [];
      throw error;
    }
    const service = await this.servicesService.findById(serviceId as string);
    if (!service || service.enabled !== 1 || service.deleted !== 0) return [];

    const [doctors, occupied] = await Promise.all([
      this.doctorsService.findAll(), this.bookingsRepository.occupiedOn(date),
    ]);
    const now = new Date();
    const duration = service.durationMinutes || 30;
    return slotStarts.filter(start => {
      const end = start + duration;
      return isUpcoming(day, start, now) && doctors.some(doctor =>
        fitsShift(doctor, day, start, end) && !occupied.some(booking =>
          booking.doctorId === doctor.id &&
          timeInMinutes(booking.startTime) < end && timeInMinutes(booking.endTime) > start,
        ),
      );
    }).map(timeFromMinutes);
  }

  findAllPatients() {
    return this.patientsRepository.findAll();
  }
}
