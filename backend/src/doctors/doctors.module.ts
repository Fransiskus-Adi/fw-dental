import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Doctor } from './doctor.entity';
import { DoctorsService } from './doctors.service';
import { DoctorsController } from './doctors.controller';
import { DoctorsRepository } from './doctors.repository';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Doctor]), UsersModule],
  providers: [DoctorsService, DoctorsRepository],
  controllers: [DoctorsController],
  exports: [DoctorsService, DoctorsRepository],
})
export class DoctorsModule {}
