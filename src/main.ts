import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const port = configService.getOrThrow<number>('PORT');
  const host = configService.getOrThrow<string>('HOST');
  const apiPrefix = configService.getOrThrow<string>('API_PREFIX');
  const corsOrigins = configService
    .getOrThrow<string>('CORS_ORIGINS')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.setGlobalPrefix(apiPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : false,
    credentials: true,
  });

  app.enableShutdownHooks();

  await app.listen(port, () => console.log(`Server: http://${host}:${port}`));
}

bootstrap().catch((err) => {
  console.error('Unable to launch the application.', err);
  process.exit(1);
});
