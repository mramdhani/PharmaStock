import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ResponseMessage('Ringkasan statistik dashboard berhasil diambil')
  @ApiOperation({
    summary:
      'Ringkasan eksekutif KPI gudang (total produk, unit stok, stok kritis, batch kedaluwarsa, grafik 7 hari, dan mutasi terbaru)',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistik dashboard berhasil diambil',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Token JWT tidak valid' })
  getSummary() {
    return this.dashboardService.getSummary();
  }
}
