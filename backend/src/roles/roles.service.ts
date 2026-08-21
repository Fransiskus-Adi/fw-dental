import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Role } from './role.entity';
import { RolesRepository } from './roles.repository';

@Injectable()
export class RolesService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  async findAll(): Promise<Role[]> {
    return this.rolesRepository.findAllActive();
  }

  async findByCode(code: string): Promise<Role | null> {
    return this.rolesRepository.findByCode(code);
  }

  async create(roleData: Partial<Role>): Promise<Role> {
    if (!roleData.code) {
      throw new ConflictException('Role code is required');
    }
    const codeUpper = roleData.code.toUpperCase().replace(/\s+/g, '_');

    const existing = await this.rolesRepository.findByCode(codeUpper);
    if (existing) {
      throw new ConflictException('Role with this code already exists');
    }

    roleData.code = codeUpper;
    return this.rolesRepository.createAndSave(roleData);
  }

  async update(code: string, roleData: Partial<Role>): Promise<Role> {
    const role = await this.rolesRepository.findByCode(code);
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Do not allow changing the primary key 'code' during update
    delete roleData.code;

    Object.assign(role, roleData);
    return this.rolesRepository.createAndSave(role);
  }

  async delete(code: string): Promise<void> {
    const role = await this.rolesRepository.findByCode(code);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    await this.rolesRepository.softDeleteByCode(code);
  }
}
