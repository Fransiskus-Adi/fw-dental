import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { AttendanceReminderService } from './attendance-reminder.service';

@Module({
  imports: [ConfigModule],
  controllers: [WebhooksController],
  providers: [WebhooksService, AttendanceReminderService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
