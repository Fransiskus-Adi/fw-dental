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
import { EmployeesService } from './employees.service';
import { Employee } from './employee.entity';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  findAll(): Promise<Employee[]> {
    return this.employeesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Employee> {
    const employee = await this.employeesService.findById(id);
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    return employee;
  }

  @Post()
  create(
    @Body()
    body: {
      name: string;
      email: string;
      password?: string;
      phone?: string;
    },
  ): Promise<Employee> {
    return this.employeesService.create(
      body.name,
      body.email,
      body.password,
      body.phone,
    );
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: { name: string; email: string; password?: string; phone?: string },
  ): Promise<Employee> {
    return this.employeesService.update(
      id,
      body.name,
      body.email,
      body.password,
      body.phone,
    );
  }

  @Delete(':id')
  delete(@Param('id') id: string): Promise<void> {
    return this.employeesService.delete(id);
  }
}
