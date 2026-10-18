import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { Public } from './auth/decorators/public.decorator';

/**
 * Health check: dipakai monitoring (dan Docker nanti) untuk mengecek
 * apakah API hidup DAN bisa bicara dengan database.
 */
@ApiTags('Health')
@Controller('health')
export class AppController {
  // DataSource di-inject otomatis oleh NestJS (Dependency Injection).
  constructor(private readonly dataSource: DataSource) {}

  @Public()
  @Get()
  @ApiOkResponse({ description: 'API dan database berjalan normal' })
  async check() {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok', database: 'up' };
    } catch {
      // 503 = layanan sedang tidak tersedia
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'down',
      });
    }
  }
}
