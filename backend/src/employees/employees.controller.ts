import { Body, Controller, Delete, Get, NotFoundException, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import { RequireAdministrator, RequireStaff } from '../auth/staff-access.guard';
import { parseInput } from '../input';
import { employeeInput } from '../users/staff-input';
import { EmployeesService } from './employees.service';

@Controller('employees')
@RequireStaff(['page_employees'])
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}

  @Get()
  findAll() {
    return this.employees.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const employee = await this.employees.findById(id);
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  @Post()
  @RequireAdministrator('page_employees', 'feat_employees_write')
  create(@Body() input: unknown) {
    const { name, email, password, phone, roleCode } = parseInput(employeeInput, input);
    return this.employees.create(name, email, password, phone, roleCode);
  }

  @Put(':id')
  @RequireAdministrator('page_employees', 'feat_employees_write')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() input: unknown) {
    const { name, email, password, phone, roleCode } = parseInput(employeeInput, input);
    return this.employees.update(id, name, email, password, phone, roleCode);
  }

  @Delete(':id')
  @RequireAdministrator('page_employees', 'feat_employees_delete')
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.employees.delete(id);
  }
}
