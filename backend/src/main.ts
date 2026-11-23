import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { EventLogService } from './logging/event-log.service';
import { HttpLoggingFilter, logHttpRequests } from './logging/http-logging';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  if (process.env.TRUSTED_PROXY_ADDRESSES) {
    app.set('trust proxy', process.env.TRUSTED_PROXY_ADDRESSES);
  }
  const events = app.get(EventLogService);
  app.use(logHttpRequests(events));
  app.disable('x-powered-by');
  app.useBodyParser('json', { limit: '128kb', inflate: false });
  app.useBodyParser('urlencoded', { limit: '128kb', extended: false, inflate: false });
  app.useGlobalFilters(new HttpLoggingFilter(app.getHttpAdapter()));
  app.enableShutdownHooks();
  const port = process.env.PORT ?? 3001;
  const nodeEnv = process.env.NODE_ENV || 'development';
  const [migration] = await app.get(DataSource).query<{ ready: boolean }[]>(`
    SELECT (
      SELECT count(*) = 3 FROM information_schema.columns
      WHERE table_schema = 'auth' AND table_name = 'users'
        AND column_name IN ('session_version', 'password_reset_hash', 'password_reset_expires_at')
    ) AND EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = to_regclass('public.bookings')
        AND conname = 'bookings_doctor_time_exclusion'
        AND convalidated
    ) AND to_regclass('logging.events') IS NOT NULL
      AND to_regclass('public.app_settings_global_portal_config') IS NOT NULL AS ready
  `);
  if (!migration?.ready) {
    await app.close();
    throw new Error('Apply the pending SQL migrations in db/migration before starting the API. See backend/README.md.');
  }
  const host = process.env.BIND_HOST ?? '127.0.0.1';
  await app.listen(port, host);
  events.record({ event: 'app.started', level: 'info' });
  console.log(
    `Application is running in ${nodeEnv} mode on: http://localhost:${port}`,
  );
}
bootstrap();
