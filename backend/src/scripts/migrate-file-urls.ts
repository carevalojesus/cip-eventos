import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Event } from '../events/entities/event.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const configService = app.get(ConfigService);
  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
  const eventRepository = app.get<Repository<Event>>(getRepositoryToken(Event));

  const minioEndpoint =
    configService.get<string>('MINIO_ENDPOINT') ?? 'http://localhost:9000';
  const bucket = configService.get<string>('MINIO_BUCKET') ?? 'avatars';
  const apiUrl =
    configService.get<string>('API_URL') ?? 'http://localhost:3000';

  const oldUrlPrefix = `${minioEndpoint}/${bucket}`;

  console.log(`Migrating URLs from ${oldUrlPrefix} to ${apiUrl}/uploads/...`);

  // 1. Migrate Users (Profile Photos) -> Private
  const users = await userRepository.find();
  let usersUpdated = 0;
  for (const user of users) {
    if (user.profile?.avatar && user.profile.avatar.startsWith(oldUrlPrefix)) {
      const relativePath = user.profile.avatar.replace(oldUrlPrefix, '');
      // Remove leading slash if present
      const key = relativePath.startsWith('/')
        ? relativePath.substring(1)
        : relativePath;

      const newUrl = `${apiUrl}/uploads/private/${key}`;
      user.profile.avatar = newUrl;
      await userRepository.save(user);
      usersUpdated++;
      console.log(`Updated user ${user.id}: ${newUrl}`);
    }
  }
  console.log(`Users updated: ${usersUpdated}`);

  // 2. Migrate Events (Images) -> Public
  const events = await eventRepository.find();
  let eventsUpdated = 0;
  for (const event of events) {
    if (event.imageUrl && event.imageUrl.startsWith(oldUrlPrefix)) {
      const relativePath = event.imageUrl.replace(oldUrlPrefix, '');
      const key = relativePath.startsWith('/')
        ? relativePath.substring(1)
        : relativePath;

      const newUrl = `${apiUrl}/uploads/public/${key}`;
      event.imageUrl = newUrl;
      await eventRepository.save(event);
      eventsUpdated++;
      console.log(`Updated event ${event.id}: ${newUrl}`);
    }
  }
  console.log(`Events updated: ${eventsUpdated}`);

  await app.close();
}
bootstrap();
