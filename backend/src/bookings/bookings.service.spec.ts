import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { BookingsRepository } from './bookings.repository';
import { PatientsRepository } from './patients.repository';
import { DoctorsService } from '../doctors/doctors.service';
import { ServicesService } from '../services/services.service';
import { BadRequestException } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';

describe('BookingsService Security/Validation', () => {
  let service: BookingsService;

  const mockBookingsRepository = {};
  const mockPatientsRepository = {};
  const mockDoctorsService = {};
  const mockServicesService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: BookingsRepository, useValue: mockBookingsRepository },
        { provide: PatientsRepository, useValue: mockPatientsRepository },
        { provide: DoctorsService, useValue: mockDoctorsService },
        { provide: ServicesService, useValue: mockServicesService },
        { provide: NotificationsService, useValue: {} },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  it('should reject requests with honeypot field filled', async () => {
    await expect(
      service.createBooking({
        name: 'John Doe',
        phone: '+628123456789',
        email: 'john@example.com',
        serviceId: 'some-service-id',
        date: '2026-09-01',
        time: '10:00',
        website: 'http://spam-bot-url.com',
      }),
    ).rejects.toThrow(new BadRequestException('Suspicious request detected.'));
  });

  it('should reject invalid names', async () => {
    // Too short
    await expect(
      service.createBooking({
        name: 'J',
        phone: '+628123456789',
        serviceId: 'some-service-id',
        date: '2026-09-01',
        time: '10:00',
      }),
    ).rejects.toThrow(new BadRequestException('Name must be between 2 and 100 characters.'));

    // HTML script injection
    await expect(
      service.createBooking({
        name: '<script>alert(1)</script>',
        phone: '+628123456789',
        serviceId: 'some-service-id',
        date: '2026-09-01',
        time: '10:00',
      }),
    ).rejects.toThrow(new BadRequestException('Invalid name format.'));

    // URL spam in name
    await expect(
      service.createBooking({
        name: 'Click here: http://spam.com',
        phone: '+628123456789',
        serviceId: 'some-service-id',
        date: '2026-09-01',
        time: '10:00',
      }),
    ).rejects.toThrow(new BadRequestException('Invalid name format.'));
  });

  it('should reject invalid phone numbers', async () => {
    await expect(
      service.createBooking({
        name: 'John Doe',
        phone: 'invalid-phone-number-123',
        serviceId: 'some-service-id',
        date: '2026-09-01',
        time: '10:00',
      }),
    ).rejects.toThrow(
      new BadRequestException(
        'Invalid phone number format. Allowed characters: digits, spaces, parentheses, hyphens, and +.',
      ),
    );
  });

  it('should reject invalid email formats', async () => {
    await expect(
      service.createBooking({
        name: 'John Doe',
        phone: '+628123456789',
        email: 'notanemail',
        serviceId: 'some-service-id',
        date: '2026-09-01',
        time: '10:00',
      }),
    ).rejects.toThrow(new BadRequestException('Invalid email format.'));
  });

  it('should reject booking date in the past', async () => {
    await expect(
      service.createBooking({
        name: 'John Doe',
        phone: '+628123456789',
        serviceId: 'some-service-id',
        date: '2020-01-01',
        time: '10:00',
      }),
    ).rejects.toThrow(new BadRequestException('Booking date cannot be in the past.'));
  });

  it('should reject booking date too far in the future', async () => {
    await expect(
      service.createBooking({
        name: 'John Doe',
        phone: '+628123456789',
        serviceId: 'some-service-id',
        date: '2030-01-01',
        time: '10:00',
      }),
    ).rejects.toThrow(
      new BadRequestException('Booking date cannot be more than 90 days in the future.'),
    );
  });
});
