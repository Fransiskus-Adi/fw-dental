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
import { RolesService } from './roles.service';
import { Role } from './role.entity';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  findAll(): Promise<Role[]> {
    return this.rolesService.findAll();
  }

  @Get(':code')
  async findOne(@Param('code') code: string): Promise<Role> {
    const role = await this.rolesService.findByCode(code);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  @Post()
  create(@Body() roleData: Partial<Role>): Promise<Role> {
    return this.rolesService.create(roleData);
  }

  @Put(':code')
  update(
    @Param('code') code: string,
    @Body() roleData: Partial<Role>,
  ): Promise<Role> {
    return this.rolesService.update(code, roleData);
  }

  @Delete(':code')
  delete(@Param('code') code: string): Promise<void> {
    return this.rolesService.delete(code);
  }
}
