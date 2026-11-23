import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Injectable()
export class AttendanceReminderService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;

  constructor(private readonly notifications: NotificationsService) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      const now = new Date();
      if (now.getMinutes() !== 0) return;
      if (now.getHours() === 8) void this.notifications.publish('CLOCK_IN_REMINDER');
      if (now.getHours() === 17) void this.notifications.publish('CLOCK_OUT_REMINDER');
    }, 60_000);
  }

  onModuleDestroy() {
    clearInterval(this.timer);
  }
}
