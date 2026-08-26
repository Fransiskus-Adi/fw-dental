import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Injectable()
export class AttendanceReminderService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AttendanceReminderService.name);
  private intervalId: NodeJS.Timeout | null = null;

  constructor(private readonly webhooksService: WebhooksService) {}

  onModuleInit() {
    this.logger.log('Starting attendance reminder background scheduler...');
    // Run checks every minute (60,000 ms)
    this.intervalId = setInterval(() => this.checkSchedule(), 60000);
  }

  onModuleDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private async checkSchedule() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // Trigger Clock-In reminder at 08:00 AM
    if (hours === 8 && minutes === 0) {
      this.logger.log('Time is 08:00 AM. Broadcasting clock-in reminder webhook...');
      await this.webhooksService.triggerWebhook('CLOCK_IN_REMINDER', {
        message: 'Please clock in to start your shift!',
        timeLimit: '08:20 AM',
      });
    }

    // Trigger Clock-Out reminder at 05:00 PM (17:00)
    if (hours === 17 && minutes === 0) {
      this.logger.log('Time is 05:00 PM. Broadcasting clock-out reminder webhook...');
      await this.webhooksService.triggerWebhook('CLOCK_OUT_REMINDER', {
        message: "Don't forget to clock out before you leave today!",
        timeLimit: '05:00 PM',
      });
    }
  }
}
