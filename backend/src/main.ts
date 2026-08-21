import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const port = process.env.PORT ?? 3001;
  const nodeEnv = process.env.NODE_ENV || 'development';
  await app.listen(port);
  console.log(
    `Application is running in ${nodeEnv} mode on: http://localhost:${port}`,
  );
}
bootstrap();
