import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { BookingsRepository } from './bookings.repository';
import { PatientsRepository } from './patients.repository';
import { DoctorsService } from '../doctors/doctors.service';
import { ServicesService } from '../services/services.service';
import { Booking } from './booking.entity';
import { Patient } from './patient.entity';
import { WebhooksService } from '../webhooks/webhooks.service';

@Injectable()
export class BookingsService {
  constructor(
    private readonly bookingsRepository: BookingsRepository,
    private readonly patientsRepository: PatientsRepository,
    private readonly doctorsService: DoctorsService,
    private readonly servicesService: ServicesService,
    private readonly webhooksService: WebhooksService,
  ) {}

  async findAll(): Promise<Booking[]> {
    return this.bookingsRepository.findAll();
  }

  async findById(id: string): Promise<Booking | null> {
    return this.bookingsRepository.findById(id);
  }

  async createBooking(data: {
    name: string;
    phone: string;
    email?: string;
    serviceId: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    patientNotes?: string;
    website?: string; // honeypot
  }): Promise<Booking> {
    const { name, phone, email, serviceId, date, time, patientNotes, website } = data;

    // 0. Honeypot check
    if (website !== undefined && website.trim() !== '') {
      throw new BadRequestException('Suspicious request detected.');
    }

    // 1. Validate name
    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
      throw new BadRequestException('Name must be between 2 and 100 characters.');
    }
    if (/<[^>]*>/.test(name) || /https?:\/\/[^\s]+/.test(name) || /\b(www\.)|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/.test(name)) {
      throw new BadRequestException('Invalid name format.');
    }

    // 2. Validate phone number
    if (!phone || typeof phone !== 'string') {
      throw new BadRequestException('Phone number is required.');
    }
    const sanitizedPhone = phone.trim();
    if (!/^\+?[0-9\s\-()]{7,20}$/.test(sanitizedPhone)) {
      throw new BadRequestException(
        'Invalid phone number format. Allowed characters: digits, spaces, parentheses, hyphens, and +.',
      );
    }

    // 3. Validate email (optional)
    if (email && email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim()) || email.trim().length > 150) {
        throw new BadRequestException('Invalid email format.');
      }
    }

    // 4. Validate date format and range
    if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('Date is required and must be in YYYY-MM-DD format.');
    }

    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    if (isNaN(dateObj.getTime())) {
      throw new BadRequestException('Invalid booking date.');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateObj < today) {
      throw new BadRequestException('Booking date cannot be in the past.');
    }

    const maxFutureDate = new Date();
    maxFutureDate.setDate(maxFutureDate.getDate() + 90);
    if (dateObj > maxFutureDate) {
      throw new BadRequestException('Booking date cannot be more than 90 days in the future.');
    }

    // 5. Validate time format
    if (!time || typeof time !== 'string' || !/^\d{2}:\d{2}(:\d{2})?$/.test(time)) {
      throw new BadRequestException('Time is required and must be in HH:MM format.');
    }

    // 6. Verify service
    const service = await this.servicesService.findById(serviceId);
    if (!service) {
      throw new BadRequestException('Invalid service/treatment selected.');
    }

    // 2. Determine day of the week
    const weekdays = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const dayName = weekdays[dateObj.getDay()];

    // 3. Find doctors scheduled at this time
    const doctors = await this.doctorsService.findAll();
    const activeDoctors = doctors.filter((d) => d.status === 'Active');

    const timeToMinutes = (timeStr: string) => {
      // Handles HH:MM or HH:MM:SS
      const parts = timeStr.split(':');
      const h = parseInt(parts[0], 10);
      const m = parts.length > 1 ? parseInt(parts[1], 10) : 0;
      return h * 60 + m;
    };

    const bookingMin = timeToMinutes(time);

    const scheduledDoctors = activeDoctors.filter((doctor) => {
      // Check if doctor works on this weekday
      const worksOnDay = doctor.days && doctor.days.includes(dayName);
      if (!worksOnDay) return false;

      // Check shift start and end
      const shiftStartMin = timeToMinutes(doctor.shiftStart || '09:00');
      const shiftEndMin = timeToMinutes(doctor.shiftEnd || '17:00');

      return bookingMin >= shiftStartMin && bookingMin < shiftEndMin;
    });

    if (scheduledDoctors.length === 0) {
      throw new BadRequestException(
        `No dentist is scheduled to work on ${dayName} at ${time}.`,
      );
    }

    // 4. Find doctor without conflicts (if any), fallback to first scheduled
    let assignedDoctor = scheduledDoctors[0];
    for (const doc of scheduledDoctors) {
      const hasConflict = await this.bookingsRepository.hasConflict(
        doc.id,
        date,
        time,
      );
      if (!hasConflict) {
        assignedDoctor = doc;
        break;
      }
    }

    // 5. Create or find patient
    let patient = await this.patientsRepository.findByPhone(phone);
    if (!patient) {
      const patientCode = `PAT-${Math.floor(1000 + Math.random() * 9000)}`;
      patient = await this.patientsRepository.createAndSave({
        fullName: name,
        phoneNumber: phone,
        email,
        patientCode,
      });
    }

    // 6. Calculate end time based on service duration
    const startMin = timeToMinutes(time);
    const endMin = startMin + (service.durationMinutes || 30);
    const endH = Math.floor(endMin / 60);
    const endM = endMin % 60;
    const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

    // 7. Create booking code
    const bookingCode = `BKG-${Math.floor(100000 + Math.random() * 900000)}`;

    // 8. Create booking
    const booking = await this.bookingsRepository.createAndSave({
      bookingCode,
      patientId: patient.id,
      doctorId: assignedDoctor.id,
      serviceId,
      bookingDate: date,
      startTime: time,
      endTime,
      statusCode: 'PENDING',
      sourceCode: 'WEBSITE',
      patientNotes,
    });

    // 9. Load relationship data to return
    const result = await this.bookingsRepository.findById(booking.id);
    if (!result) {
      throw new Error('Failed to load created booking relations.');
    }

    // Trigger webhook notification (non-blocking)
    this.webhooksService.triggerWebhook('BOOKING_CREATED', {
      id: result.id,
      bookingCode: result.bookingCode,
      patientName: result.patient?.fullName || 'Anonymous Patient',
      serviceName: result.service?.name || 'Dental Treatment',
      date: result.bookingDate,
      time: result.startTime,
    }).catch((err) => {
      console.error('Failed to trigger webhook on booking creation:', err);
    });

    return result;
  }

  async updateStatus(id: string, statusCode: string): Promise<Booking> {
    const booking = await this.bookingsRepository.findById(id);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    booking.statusCode = statusCode.toUpperCase();

    const now = new Date();
    if (booking.statusCode === 'CONFIRMED') {
      booking.confirmedAt = now;
    } else if (booking.statusCode === 'COMPLETED') {
      if (booking.sourceCode === 'WEBSITE') {
        const hasActiveTransaction =
          booking.transactions && booking.transactions.some((tx) => tx.deleted === 0);
        if (!hasActiveTransaction) {
          throw new BadRequestException(
            'A transaction must be created for this online booking before it can be marked as completed.',
          );
        }
      }
      booking.completedAt = now;
    } else if (booking.statusCode === 'CANCELLED') {
      booking.cancelledAt = now;
    }

    return this.bookingsRepository.save(booking);
  }

  async getAvailableSlots(date: string, serviceId: string): Promise<string[]> {
    if (!date || !serviceId) {
      return [];
    }

    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    if (isNaN(dateObj.getTime())) {
      return [];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateObj < today) {
      return [];
    }

    const weekdays = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const dayName = weekdays[dateObj.getDay()];

    const service = await this.servicesService.findById(serviceId);
    if (!service) {
      return [];
    }
    const duration = service.durationMinutes || 30;

    const doctors = await this.doctorsService.findAll();
    const activeDoctors = doctors.filter((d) => d.status === 'Active');

    const timeToMinutes = (timeStr: string) => {
      const parts = timeStr.split(':');
      const h = parseInt(parts[0], 10);
      const m = parts.length > 1 ? parseInt(parts[1], 10) : 0;
      return h * 60 + m;
    };

    const slots: string[] = [];
    const isToday = dateObj.toDateString() === new Date().toDateString();
    const currentMin = new Date().getHours() * 60 + new Date().getMinutes();

    // Standard business hours: 09:00 to 17:00
    for (let hour = 9; hour < 17; hour++) {
      for (const min of [0, 30]) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        const slotMin = hour * 60 + min;

        if (isToday && slotMin <= currentMin) {
          continue;
        }

        let anyDoctorAvailable = false;
        for (const doc of activeDoctors) {
          const worksOnDay = doc.days && doc.days.includes(dayName);
          if (!worksOnDay) continue;

          const shiftStartMin = timeToMinutes(doc.shiftStart || '09:00');
          const shiftEndMin = timeToMinutes(doc.shiftEnd || '17:00');

          if (slotMin >= shiftStartMin && slotMin + duration <= shiftEndMin) {
            const hasConflict = await this.bookingsRepository.hasConflict(
              doc.id,
              date,
              timeStr,
            );
            if (!hasConflict) {
              anyDoctorAvailable = true;
              break;
            }
          }
        }

        if (anyDoctorAvailable) {
          slots.push(timeStr);
        }
      }
    }

    return slots;
  }

  async findAllPatients(): Promise<Patient[]> {
    return this.patientsRepository.findAll();
  }
}
