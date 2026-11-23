import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './booking.entity';
import { Patient } from './patient.entity';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { BookingsRepository } from './bookings.repository';
import { PatientsRepository } from './patients.repository';
import { DoctorsModule } from '../doctors/doctors.module';
import { ServicesModule } from '../services/services.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Patient]),
    DoctorsModule,
    ServicesModule,
    NotificationsModule,
  ],
  providers: [BookingsService, BookingsRepository, PatientsRepository],
  controllers: [BookingsController],
  exports: [BookingsService, BookingsRepository, PatientsRepository],
})
export class BookingsModule {}
