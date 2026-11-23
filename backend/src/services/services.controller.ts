import { Controller, Get, Post, Put, Delete, Body, Param, NotFoundException, ParseUUIDPipe } from '@nestjs/common';
import { z } from 'zod';
import { ServicesService } from './services.service';
import { Service } from './service.entity';
import { PublicRoute, RequireStaff } from '../auth/staff-access.guard';
import { parseInput, textField } from '../input';

const serviceInput = z.object({
  name: textField(150),
  code: textField(50).optional(),
  slug: textField(150).optional(),
  durationMinutes: z.number().int().min(1).max(480).optional(),
  displayOrder: z.number().int().min(0).max(2147483647).optional(),
  shortDescription: z.string().max(500).optional(),
  description: z.string().max(10_000).optional(),
  priceFrom: z.number().min(0).max(9999999999999).optional(),
  priceTo: z.number().min(0).max(9999999999999).optional(),
});

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @PublicRoute()
  async findAll() {
    const services = await this.servicesService.findAll();
    return services.filter(service => service.enabled === 1 && service.deleted === 0)
      .map(({ id, name, code, shortDescription, description, durationMinutes, priceFrom, priceTo }) =>
        ({ id, name, code, shortDescription, description, durationMinutes, priceFrom, priceTo }));
  }

  @Get('staff')
  @RequireStaff(['page_services'])
  findAllAsStaff(): Promise<Service[]> {
    return this.servicesService.findAll();
  }

  @Get(':id')
  @RequireStaff(['page_services'])
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Service> {
    const service = await this.servicesService.findById(id);
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    return service;
  }

  @Post()
  @RequireStaff(['page_services', 'feat_services_write'])
  create(@Body() input: unknown): Promise<Service> {
    return this.servicesService.create(parseInput(serviceInput, input));
  }

  @Put(':id')
  @RequireStaff(['page_services', 'feat_services_write'])
  update(@Param('id', ParseUUIDPipe) id: string, @Body() input: unknown): Promise<Service> {
    return this.servicesService.update(id, parseInput(serviceInput.partial(), input));
  }

  @Delete(':id')
  @RequireStaff(['page_services', 'feat_services_delete'])
  delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.servicesService.delete(id);
  }
}
