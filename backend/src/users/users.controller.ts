import { Body, Controller, Delete, Get, NotFoundException, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import { RequireAdministrator } from '../auth/staff-access.guard';
import { parseInput } from '../input';
import { userInput } from './staff-input';
import { UsersService } from './users.service';

@Controller('users')
@RequireAdministrator()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  findAll() {
    return this.users.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  @Post()
  create(@Body() input: unknown) {
    const { name, email, password, phone } = parseInput(userInput, input);
    return this.users.create(name, email, password, phone);
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() input: unknown) {
    const { name, email, password, phone } = parseInput(userInput, input);
    return this.users.update(id, name, email, password, phone);
  }

  @Delete(':id')
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.delete(id);
  }
}
