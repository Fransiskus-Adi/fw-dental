import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { AttendanceReminderService } from './attendance-reminder.service';
import { LoggingModule } from '../logging/logging.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [ConfigModule, LoggingModule, MailModule],
  providers: [NotificationsService, AttendanceReminderService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
