import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  const rawOrigins = process.env.FRONTEND_URL || 'http://localhost:5173';
  const frontendOrigin = rawOrigins.includes(',')
    ? rawOrigins.split(',').map(o => o.trim())
    : rawOrigins;

  app.enableCors({
    origin: frontendOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Client'],
  });

  // Helmet baseline — sets X-Content-Type-Options, X-Frame-Options, HSTS (prod),
  // Referrer-Policy etc. CSP is left to the frontend host (nginx/CDN) because
  // the React SPA is served separately and needs access to S3, WebSocket, and
  // Vite-injected inline styles. Helmet's default CSP would break all of that.
  app.use(
    helmet({
      contentSecurityPolicy: false,       // handled at nginx/CDN layer
      crossOriginEmbedderPolicy: false,   // blocks S3 media if enabled
    }),
  );
  app.use(compression());
  app.use(cookieParser(process.env.COOKIE_SECRET));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle('CypherLink API')
    .setDescription('Collaborative operating system for independent music culture')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`CypherLink API running on http://localhost:${port}/api`);
  logger.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
