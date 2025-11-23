import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const port = configService.get<number>('PORT') || 3000;
  const prefix = configService.get<string>('API_PREFIX') || 'api';

  app.setGlobalPrefix(prefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors();

  await app.listen(port);
  console.log(`🚀 Servidor corriendo en: http://localhost:${port}/${prefix}`);
}

bootstrap().catch((err) => {
  console.error('Error al inicial el servidor:', err);
  process.exit(1);
});
