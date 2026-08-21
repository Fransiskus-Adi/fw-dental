import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { Service } from './service.entity';
import { ServicesRepository } from './services.repository';

@Injectable()
export class ServicesService {
  constructor(
    private readonly servicesRepository: ServicesRepository,
  ) {}

  async findAll(): Promise<Service[]> {
    return this.servicesRepository.findAllOrderedByDisplayOrder();
  }

  async findById(id: string): Promise<Service | null> {
    return this.servicesRepository.findById(id);
  }

  async create(serviceData: Partial<Service>): Promise<Service> {
    if (serviceData.code) {
      const existing = await this.servicesRepository.findByCode(serviceData.code);
      if (existing) {
        throw new ConflictException('Service with this code already exists');
      }
    } else {
      serviceData.code = `SRV-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    if (serviceData.name && !serviceData.slug) {
      serviceData.slug = serviceData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }

    return this.servicesRepository.createAndSave(serviceData);
  }

  async update(id: string, serviceData: Partial<Service>): Promise<Service> {
    const service = await this.servicesRepository.findById(id);
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (serviceData.code && serviceData.code !== service.code) {
      const existing = await this.servicesRepository.findByCode(serviceData.code);
      if (existing) {
        throw new ConflictException('Service with this code already exists');
      }
    }

    if (serviceData.name && !serviceData.slug) {
      serviceData.slug = serviceData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }

    Object.assign(service, serviceData);
    return this.servicesRepository.createAndSave(service);
  }

  async delete(id: string): Promise<void> {
    const service = await this.servicesRepository.findById(id);
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    await this.servicesRepository.deleteById(id);
  }
}
