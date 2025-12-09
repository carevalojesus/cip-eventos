/**
 * Script para ejecutar el seed manualmente
 *
 * Uso: npx ts-node -r tsconfig-paths/register src/database/seeds/run-seed.ts
 *
 * O agregar en package.json:
 * "seed": "ts-node -r tsconfig-paths/register src/database/seeds/run-seed.ts"
 */

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { SeedModule } from './seed.module';
import { InitialSeedService } from './initial-seed.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { AppDataSource } from '../data-source';

// Módulo standalone para el seed
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      ...AppDataSource.options,
      autoLoadEntities: true,
    }),
    SeedModule,
  ],
})
class SeedAppModule {}

async function bootstrap() {
  const logger = new Logger('Seed');

  try {
    logger.log('Iniciando aplicación de seed...');

    const app = await NestFactory.createApplicationContext(SeedAppModule);

    // El seed se ejecuta automáticamente en onApplicationBootstrap
    // pero podemos forzarlo si es necesario
    const seedService = app.get(InitialSeedService);
    await seedService.onApplicationBootstrap();

    await app.close();

    logger.log('Seed completado exitosamente');
    process.exit(0);
  } catch (error) {
    logger.error('Error durante el seed:', error);
    process.exit(1);
  }
}

bootstrap();
