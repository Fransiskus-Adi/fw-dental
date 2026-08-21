import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './role.entity';

@Injectable()
export class RolesRepository {
  constructor(
    @InjectRepository(Role)
    private readonly repository: Repository<Role>,
  ) {}

  async findByCode(code: string): Promise<Role | null> {
    return this.repository.findOne({ where: { code, deleted: 0 } });
  }

  async findAllActive(): Promise<Role[]> {
    return this.repository.find({
      where: { deleted: 0 },
      order: { createdAt: 'DESC' },
    });
  }

  async createAndSave(roleData: Partial<Role>): Promise<Role> {
    const role = this.repository.create(roleData);
    return this.repository.save(role);
  }

  async softDeleteByCode(code: string): Promise<void> {
    await this.repository.update({ code }, { deleted: 1 });
  }
}
