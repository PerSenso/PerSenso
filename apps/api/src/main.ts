import 'dotenv/config';
import * as Sentry from '@sentry/nestjs';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { MulterExceptionFilter } from './common/filters/multer-exception.filter';
import { ViewerSanitizerInterceptor } from './common/interceptors/viewer-sanitizer.interceptor';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.enableCors({
    credentials: true,
    origin:
      process.env.NODE_ENV === 'production'
        ? 'https://persenso.vercel.app'
        : 'http://localhost:3000',
  });

  app.useGlobalFilters(new MulterExceptionFilter());

  app.useGlobalInterceptors(new ViewerSanitizerInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3001);
}

bootstrap();
