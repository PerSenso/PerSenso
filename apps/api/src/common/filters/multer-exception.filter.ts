import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { MulterError } from 'multer';
import { Response } from 'express';

@Catch(MulterError)
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const messages: Record<string, string> = {
      LIMIT_FILE_SIZE: 'El archivo supera el límite de 5MB',
      LIMIT_UNEXPECTED_FILE: 'Campo de archivo inesperado',
    };

    response.status(400).json({
      statusCode: 400,
      message: messages[exception.code] ?? 'Error al procesar el archivo',
    });
  }
}
