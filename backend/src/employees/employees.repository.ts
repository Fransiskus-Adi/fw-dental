import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './employee.entity';

@Injectable()
export class EmployeesRepository {
  constructor(
    @InjectRepository(Employee)
    private readonly repository: Repository<Employee>,
  ) {}

  async findById(id: string): Promise<Employee | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<Employee | null> {
    return this.repository.findOne({ where: { email } });
  }

  async findAllOrderedByCreatedAtDesc(): Promise<Employee[]> {
    return this.repository.find({ order: { createdAt: 'DESC' } });
  }

  async createAndSave(employeeData: Partial<Employee>): Promise<Employee> {
    const employee = this.repository.create(employeeData);
    return this.repository.save(employee);
  }

  async deleteById(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
