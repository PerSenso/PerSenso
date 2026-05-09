import 'dotenv/config';
import * as Sentry from '@sentry/nestjs';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { MulterExceptionFilter } from './common/filters/multer-exception.filter';
import { ViewerSanitizerInterceptor } from './common/interceptors/viewer-sanitizer.interceptor';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

const SENSITIVE_BODY_FIELDS = [
  'password',
  'token',
  'refreshToken',
  'accessToken',
  'secret',
];

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
    beforeSend(event) {
      if (event.request?.data && typeof event.request.data === 'object') {
        const sanitized = {
          ...(event.request.data as Record<string, unknown>),
        };
        for (const field of SENSITIVE_BODY_FIELDS) {
          if (field in sanitized) sanitized[field] = '[Filtered]';
        }
        event.request.data = sanitized;
      }
      return event;
    },
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(cookieParser());

  app.enableCors({
    credentials: true,
    origin:
      process.env.NODE_ENV === 'production'
        ? (process.env.FRONTEND_URL ?? 'https://persenso.vercel.app')
        : 'http://localhost:3000',
  });

  app.useGlobalFilters(new AllExceptionsFilter(), new MulterExceptionFilter());

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
