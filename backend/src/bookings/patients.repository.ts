import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './patient.entity';

@Injectable()
export class PatientsRepository {
  constructor(
    @InjectRepository(Patient)
    private readonly repository: Repository<Patient>,
  ) {}

  async findAll(): Promise<Patient[]> {
    return this.repository.find({ order: { fullName: 'ASC' } });
  }

  async findById(id: string): Promise<Patient | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByPhone(phoneNumber: string): Promise<Patient | null> {
    return this.repository.findOne({ where: { phoneNumber } });
  }

  async createAndSave(patientData: Partial<Patient>): Promise<Patient> {
    const patient = this.repository.create(patientData);
    return this.repository.save(patient);
  }

  async save(patient: Patient): Promise<Patient> {
    return this.repository.save(patient);
  }
}
