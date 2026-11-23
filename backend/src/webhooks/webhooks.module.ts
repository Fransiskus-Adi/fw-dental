import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebhooksService } from './webhooks.service';
import { AttendanceReminderService } from './attendance-reminder.service';
import { LoggingModule } from '../logging/logging.module';

@Module({
  imports: [ConfigModule, LoggingModule],
  providers: [WebhooksService, AttendanceReminderService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
