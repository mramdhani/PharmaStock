import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global Exception Filter
 * Menyeragamkan seluruh respon error (validasi DTO, 404, 403, 409, 500)
 * ke dalam struktur JSON yang konsisten:
 * {
 *   "success": false,
 *   "statusCode": 400,
 *   "message": "Validation failed",
 *   "errors": [ ... ] // rincian error jika ada
 * }
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: unknown = null;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const res = exceptionResponse as Record<string, any>;
        // Tangani output dari class-validator (biasanya berbentuk array message)
        if (Array.isArray(res.message)) {
          message = 'Validation failed';
          errors = res.message;
        } else if (statusCode === HttpStatus.TOO_MANY_REQUESTS) {
          message = 'Batas percobaan terlampaui (Rate Limit). Demi keamanan, akses dibatasi sementara.';
          errors = res.message || 'Too Many Requests';
        } else {
          message = res.message || exception.message;
          errors = res.error || null;
        }
      }
    } else {
      // Tangani unhandled runtime error (misal bug DB atau server crash)
      const err = exception as Error;
      this.logger.error(
        `Unhandled Error on ${request.method} ${request.url}: ${err?.message}`,
        err?.stack,
      );
      // Di production, jangan ekspos stack trace internal ke client demi keamanan
      message = 'An unexpected internal error occurred';
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      errors,
    });
  }
}
