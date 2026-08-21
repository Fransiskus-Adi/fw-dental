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

@Injectable()
export class BookingsService {
  constructor(
    private readonly bookingsRepository: BookingsRepository,
    private readonly patientsRepository: PatientsRepository,
    private readonly doctorsService: DoctorsService,
    private readonly servicesService: ServicesService,
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
  }): Promise<Booking> {
    const { name, phone, email, serviceId, date, time, patientNotes } = data;

    // 1. Verify service
    const service = await this.servicesService.findById(serviceId);
    if (!service) {
      throw new BadRequestException('Invalid service/treatment selected.');
    }

    // 2. Determine day of the week
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
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
      booking.completedAt = now;
    } else if (booking.statusCode === 'CANCELLED') {
      booking.cancelledAt = now;
    }

    return this.bookingsRepository.save(booking);
  }

  async findAllPatients(): Promise<Patient[]> {
    return this.patientsRepository.findAll();
  }
}
