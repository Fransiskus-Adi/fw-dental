import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from './doctor.entity';

@Injectable()
export class DoctorsRepository {
  constructor(
    @InjectRepository(Doctor)
    private readonly repository: Repository<Doctor>,
  ) {}

  async findById(id: string): Promise<Doctor | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<Doctor | null> {
    return this.repository.findOne({ where: { email } });
  }

  async findAllOrderedByCreatedAtDesc(): Promise<Doctor[]> {
    return this.repository.find({ order: { createdAt: 'DESC' } });
  }

  async createAndSave(doctorData: Partial<Doctor>): Promise<Doctor> {
    const doctor = this.repository.create(doctorData);
    return this.repository.save(doctor);
  }

  async deleteById(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
