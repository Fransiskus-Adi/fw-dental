import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Employee } from './employee.entity';
import { EmployeesRepository } from './employees.repository';
import { UsersService } from '../users/users.service';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly employeesRepository: EmployeesRepository,
    private readonly usersService: UsersService,
  ) {}

  async findAll(): Promise<Employee[]> {
    return this.employeesRepository.findAllOrderedByCreatedAtDesc();
  }

  async findById(id: string): Promise<Employee | null> {
    return this.employeesRepository.findById(id);
  }

  async create(
    name: string,
    email: string,
    password?: string,
    phone?: string,
    roleCode?: string,
  ): Promise<Employee> {
    const existing = await this.employeesRepository.findByEmail(email);
    if (existing) {
      throw new ConflictException('Employee with this email already exists');
    }

    // Check users table too
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // First create user record in users table
    const user = await this.usersService.create(name, email, password, phone, roleCode);

    // Then save employee in employees table using the exact same ID
    return this.employeesRepository.createAndSave({
      id: user.id,
      name,
      email,
      phone,
      roleCode,
    });
  }

  async update(
    id: string,
    name: string,
    email: string,
    password?: string,
    phone?: string,
    roleCode?: string,
  ): Promise<Employee> {
    const employee = await this.employeesRepository.findById(id);
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    if (email !== employee.email) {
      const existing = await this.employeesRepository.findByEmail(email);
      if (existing) {
        throw new ConflictException('Employee with this email already exists');
      }
    }

    // Update user record first
    await this.usersService.update(id, name, email, password, phone, roleCode);

    // Then update employee record
    employee.name = name;
    employee.email = email;
    employee.phone = phone;
    employee.roleCode = roleCode;

    return this.employeesRepository.createAndSave(employee);
  }

  async delete(id: string): Promise<void> {
    // Delete from employees first
    await this.employeesRepository.deleteById(id);

    // Then delete from users
    await this.usersService.delete(id);
  }
}
