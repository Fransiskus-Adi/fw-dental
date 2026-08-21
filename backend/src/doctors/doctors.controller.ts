import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { Doctor } from './doctor.entity';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get()
  findAll(): Promise<Doctor[]> {
    return this.doctorsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Doctor> {
    const doctor = await this.doctorsService.findById(id);
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }
    return doctor;
  }

  @Post()
  create(@Body() doctorData: Partial<Doctor>): Promise<Doctor> {
    return this.doctorsService.create(doctorData);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() doctorData: Partial<Doctor>,
  ): Promise<Doctor> {
    return this.doctorsService.update(id, doctorData);
  }

  @Delete(':id')
  delete(@Param('id') id: string): Promise<void> {
    return this.doctorsService.delete(id);
  }
}
