import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { StockInDto } from './dto/stock-in.dto';
import { StockOutDto } from './dto/stock-out.dto';
import { StockQueryDto } from './dto/stock-query.dto';
import { StockService } from './stock.service';

@ApiTags('Stock')
@ApiBearerAuth()
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post('in')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('Transaksi stok masuk berhasil dicatat')
  @ApiOperation({
    summary:
      'Catat stok masuk (Stock In) ke suatu batch (ACID Transaction + Row Locking)',
  })
  @ApiResponse({ status: 201, description: 'Stok masuk berhasil dicatat' })
  @ApiResponse({ status: 400, description: 'Validasi gagal / batch expired / produk nonaktif' })
  @ApiResponse({ status: 403, description: 'Forbidden - Hanya ADMIN dan STAFF' })
  @ApiResponse({ status: 404, description: 'Batch tidak ditemukan' })
  recordStockIn(
    @Body() stockInDto: StockInDto,
    @CurrentUser() user: User,
  ) {
    if (user) {
      stockInDto.user_id = user.id;
    }
    return this.stockService.recordStockIn(stockInDto);
  }

  @Post('out')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('Transaksi stok keluar berhasil dicatat')
  @ApiOperation({
    summary:
      'Catat stok keluar (Stock Out) dari batch (ACID Transaction + Row Locking + Anti Race-Condition)',
  })
  @ApiResponse({ status: 201, description: 'Stok keluar berhasil dicatat' })
  @ApiResponse({ status: 400, description: 'Validasi input gagal' })
  @ApiResponse({ status: 403, description: 'Forbidden - Hanya ADMIN dan STAFF' })
  @ApiResponse({ status: 404, description: 'Batch tidak ditemukan' })
  @ApiResponse({ status: 409, description: 'Stok tidak mencukupi / obat expired' })
  recordStockOut(
    @Body() stockOutDto: StockOutDto,
    @CurrentUser() user: User,
  ) {
    if (user) {
      stockOutDto.user_id = user.id;
    }
    return this.stockService.recordStockOut(stockOutDto);
  }

  @Get('movements')
  @ResponseMessage('Riwayat pergerakan stok berhasil diambil')
  @ApiOperation({
    summary:
      'Buku besar (ledger) riwayat transaksi stok dengan pagination dan filter',
  })
  @ApiResponse({ status: 200, description: 'Daftar riwayat pergerakan stok' })
  findMovements(@Query() query: StockQueryDto) {
    return this.stockService.findMovements(query);
  }
}

