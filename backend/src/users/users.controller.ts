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
import { UsersService } from './users.service';
import { User } from './user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User> {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
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
  ): Promise<User> {
    return this.usersService.create(
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
  ): Promise<User> {
    return this.usersService.update(
      id,
      body.name,
      body.email,
      body.password,
      body.phone,
    );
  }

  @Delete(':id')
  delete(@Param('id') id: string): Promise<void> {
    return this.usersService.delete(id);
  }
}
