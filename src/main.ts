import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const port = configService.getOrThrow<number>('PORT');
  const host = configService.getOrThrow<string>('HOST');

  await app.listen(port, () => console.log(`Server: http://${host}:${port}`));
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
