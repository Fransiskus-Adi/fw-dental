import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from './employee.entity';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { EmployeesRepository } from './employees.repository';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Employee]), UsersModule],
  providers: [EmployeesService, EmployeesRepository],
  controllers: [EmployeesController],
  exports: [EmployeesService, EmployeesRepository],
})
export class EmployeesModule {}
