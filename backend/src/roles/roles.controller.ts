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
import { z } from 'zod';
import { RolesService } from './roles.service';
import { Role } from './role.entity';
import { RequireAdministrator, RequireStaff } from '../auth/staff-access.guard';
import { parseInput, roleCodeField, textField } from '../input';

const roleInput = z.object({
  code: roleCodeField,
  name: textField(100),
  description: z.string().max(2000).optional(),
  enabled: z.union([z.literal(0), z.literal(1)]).optional(),
  permissions: z.record(z.string().regex(/^[a-z_0-9]{1,100}$/), z.boolean()).optional(),
});

@Controller('roles')
@RequireStaff(['page_roles'])
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequireStaff(['page_roles'], ['page_employees'])
  findAll(): Promise<Role[]> {
    return this.rolesService.findAll();
  }

  @Get(':code')
  async findOne(@Param('code') code: string): Promise<Role> {
    const role = await this.rolesService.findByCode(parseInput(roleCodeField, code));
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  @Post()
  @RequireAdministrator('page_roles', 'feat_roles_write')
  create(@Body() input: unknown): Promise<Role> {
    return this.rolesService.create(parseInput(roleInput, input));
  }

  @Put(':code')
  @RequireAdministrator('page_roles', 'feat_roles_write')
  update(
    @Param('code') code: string,
    @Body() input: unknown,
  ): Promise<Role> {
    return this.rolesService.update(parseInput(roleCodeField, code), parseInput(roleInput.partial(), input));
  }

  @Delete(':code')
  @RequireAdministrator('page_roles', 'feat_roles_delete')
  delete(@Param('code') code: string): Promise<void> {
    return this.rolesService.delete(parseInput(roleCodeField, code));
  }
}
