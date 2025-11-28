import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nValidationPipe, I18nValidationExceptionFilter } from 'nestjs-i18n';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const port = configService.get<number>('PORT') || 3000;
  const prefix = configService.get<string>('API_PREFIX') || 'api';
  const frontendUrl = configService.get<string>('FRONTEND_URL') || 'http://localhost:4321';
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  app.setGlobalPrefix(prefix);

  // Cookie parser para httpOnly cookies
  app.use(cookieParser());

  app.useGlobalPipes(
    new I18nValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(
    new I18nValidationExceptionFilter({
      detailedErrors: false,
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // CORS configurado con origen específico y soporte para cookies
  app.enableCors({
    origin: isProduction ? frontendUrl : [frontendUrl, 'http://localhost:4321', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
  });

  // Swagger/OpenAPI Configuration
  const config = new DocumentBuilder()
    .setTitle('CIP Eventos API')
    .setDescription('API documentation for CIP Eventos - Event Management System')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('profiles', 'User profiles')
    .addTag('events', 'Event management')
    .addTag('registrations', 'Event registrations')
    .addTag('payments', 'Payment processing')
    .addTag('dashboard', 'Dashboard statistics')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'CIP Eventos API Docs',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  await app.listen(port);
  const logger = new Logger('Bootstrap');
  logger.log(`🚀 Servidor corriendo en: http://localhost:${port}/${prefix}`);
  logger.log(`📚 Documentación Swagger disponible en: http://localhost:${port}/api/docs`);
}

bootstrap().catch((err) => {
  const logger = new Logger('Bootstrap');
  logger.error('Error al inicial el servidor:', err);
  process.exit(1);
});
