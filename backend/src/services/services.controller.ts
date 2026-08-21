import { Controller, Get, Post, Put, Delete, Body, Param, NotFoundException } from '@nestjs/common';
import { ServicesService } from './services.service';
import { Service } from './service.entity';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  findAll(): Promise<Service[]> {
    return this.servicesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Service> {
    const service = await this.servicesService.findById(id);
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    return service;
  }

  @Post()
  create(@Body() serviceData: Partial<Service>): Promise<Service> {
    return this.servicesService.create(serviceData);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() serviceData: Partial<Service>): Promise<Service> {
    return this.servicesService.update(id, serviceData);
  }

  @Delete(':id')
  delete(@Param('id') id: string): Promise<void> {
    return this.servicesService.delete(id);
  }
}
