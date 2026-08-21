import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './service.entity';

@Injectable()
export class ServicesRepository {
  constructor(
    @InjectRepository(Service)
    private readonly repository: Repository<Service>,
  ) {}

  async findById(id: string): Promise<Service | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByCode(code: string): Promise<Service | null> {
    return this.repository.findOne({ where: { code } });
  }

  async findAllOrderedByDisplayOrder(): Promise<Service[]> {
    return this.repository.find({ order: { displayOrder: 'ASC', createdAt: 'DESC' } });
  }

  async createAndSave(serviceData: Partial<Service>): Promise<Service> {
    const service = this.repository.create(serviceData);
    return this.repository.save(service);
  }

  async deleteById(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
