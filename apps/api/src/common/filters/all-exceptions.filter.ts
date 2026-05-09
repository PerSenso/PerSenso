import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      process.env.NODE_ENV === 'production'
        ? status === HttpStatus.INTERNAL_SERVER_ERROR
          ? 'Error interno del servidor'
          : exception instanceof HttpException
            ? exception.message
            : 'Error interno del servidor'
        : exception instanceof Error
          ? exception.message
          : String(exception);

    response.status(status).json({ statusCode: status, message });
  }
}
