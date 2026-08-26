import { Controller, Post, Body, HttpStatus, HttpCode } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('test-trigger')
  @HttpCode(HttpStatus.OK)
  async testTrigger(
    @Body() body: { event: string; payload?: any },
  ) {
    const payload = body.payload || {};
    
    // Seed default mock data if payload is empty
    if (body.event === 'BOOKING_CREATED' && (!body.payload || Object.keys(body.payload).length === 0)) {
      payload.id = 'mock-booking-uuid';
      payload.bookingCode = `BKG-${Math.floor(100000 + Math.random() * 900000)}`;
      payload.patientName = 'Emma Watson (Test)';
      payload.serviceName = 'General Dental Consultation (Test)';
      payload.date = new Date().toISOString().split('T')[0];
      payload.time = '14:30';
    } else if (body.event === 'CLOCK_IN_REMINDER' && (!body.payload || Object.keys(body.payload).length === 0)) {
      payload.message = 'Please clock in to start your shift!';
      payload.timeLimit = '08:20 AM';
    } else if (body.event === 'CLOCK_OUT_REMINDER' && (!body.payload || Object.keys(body.payload).length === 0)) {
      payload.message = "Don't forget to clock out before you leave!";
      payload.timeLimit = '05:00 PM';
    }

    const success = await this.webhooksService.triggerWebhook(body.event, payload);
    return { success, event: body.event, payload };
  }
}
