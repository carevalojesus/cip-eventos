import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Event } from '../events/entities/event.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const configService = app.get(ConfigService);
  const eventRepository = app.get<Repository<Event>>(getRepositoryToken(Event));

  const minioEndpoint =
    configService.get<string>('MINIO_ENDPOINT') ?? 'http://localhost:9000';
  const bucket = configService.get<string>('MINIO_BUCKET') ?? 'avatars';
  const apiUrl =
    configService.get<string>('API_URL') ?? 'http://localhost:3000';

  // Patrón de URLs del backend que necesitan ser migradas a MinIO directo
  const backendUrlPattern = `${apiUrl}/uploads/public/`;
  const minioDirectUrl = `${minioEndpoint}/${bucket}/`;

  console.log(
    `Migrating event image URLs from backend proxy to MinIO direct...`,
  );
  console.log(`From: ${backendUrlPattern}`);
  console.log(`To: ${minioDirectUrl}`);

  const events = await eventRepository.find();
  let eventsUpdated = 0;

  for (const event of events) {
    if (event.imageUrl && event.imageUrl.startsWith(backendUrlPattern)) {
      const relativePath = event.imageUrl.replace(backendUrlPattern, '');
      const newUrl = `${minioDirectUrl}${relativePath}`;

      console.log(`Event ${event.id}:`);
      console.log(`  Old: ${event.imageUrl}`);
      console.log(`  New: ${newUrl}`);

      event.imageUrl = newUrl;
      await eventRepository.save(event);
      eventsUpdated++;
    }
  }

  console.log(`\nEvents updated: ${eventsUpdated}`);
  await app.close();
}

bootstrap();
