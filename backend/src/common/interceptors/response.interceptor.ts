import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator';

/**
 * Interface standar untuk respon sukses seluruh API.
 */
export interface StandardSuccessResponse<T> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
}

/**
 * Global Response Interceptor
 * Menyeragamkan semua output dari Controller ke format:
 * {
 *   "success": true,
 *   "statusCode": 200,
 *   "message": "...",
 *   "data": { ... }
 * }
 */
@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, StandardSuccessResponse<T>>
{
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardSuccessResponse<T>> {
    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode;

    // Ambil pesan kustom dari decorator @ResponseMessage jika ada
    const customMessage = this.reflector.get<string>(
      RESPONSE_MESSAGE_KEY,
      context.getHandler(),
    );

    return next.handle().pipe(
      map((data) => ({
        success: true,
        statusCode,
        message: customMessage || 'Request processed successfully',
        data: data ?? null,
      })),
    );
  }
}
