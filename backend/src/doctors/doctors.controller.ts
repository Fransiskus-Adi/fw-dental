import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { z } from 'zod';
import { DoctorsService } from './doctors.service';
import { Doctor } from './doctor.entity';
import { RequireStaff } from '../auth/staff-access.guard';
import { emailField, parseInput, textField } from '../input';

const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/);
const doctorInput = z.object({
  name: textField(150),
  specialty: textField(150),
  email: emailField,
  phone: z.string().trim().max(30).optional(),
  shiftStart: time.optional(),
  shiftEnd: time.optional(),
  status: z.enum(['Active', 'On Leave']).optional(),
  days: z.array(z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])).max(7).optional(),
});

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get()
  @RequireStaff(['page_doctors'], ['page_schedules'], ['page_transactions'])
  findAll(): Promise<Doctor[]> {
    return this.doctorsService.findAll();
  }

  @Get(':id')
  @RequireStaff(['page_doctors'])
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Doctor> {
    const doctor = await this.doctorsService.findById(id);
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }
    return doctor;
  }

  @Post()
  @RequireStaff(['page_doctors', 'feat_doctors_write'])
  create(@Body() input: unknown): Promise<Doctor> {
    return this.doctorsService.create(parseInput(doctorInput, input));
  }

  @Put(':id')
  @RequireStaff(['page_doctors', 'feat_doctors_write'])
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() input: unknown,
  ): Promise<Doctor> {
    return this.doctorsService.update(id, parseInput(doctorInput.partial(), input));
  }

  @Delete(':id')
  @RequireStaff(['page_doctors', 'feat_doctors_delete'])
  delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.doctorsService.delete(id);
  }
}
