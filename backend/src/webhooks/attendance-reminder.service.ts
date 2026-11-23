import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Injectable()
export class AttendanceReminderService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;

  constructor(private readonly webhooks: WebhooksService) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      const now = new Date();
      if (now.getMinutes() !== 0) return;
      if (now.getHours() === 8) void this.webhooks.triggerWebhook('CLOCK_IN_REMINDER');
      if (now.getHours() === 17) void this.webhooks.triggerWebhook('CLOCK_OUT_REMINDER');
    }, 60_000);
  }

  onModuleDestroy() {
    clearInterval(this.timer);
  }
}
