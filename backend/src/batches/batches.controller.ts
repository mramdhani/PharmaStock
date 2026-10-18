import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { UserRole } from '../users/entities/user.entity';
import { BatchesService } from './batches.service';
import { BatchQueryDto } from './dto/batch-query.dto';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';

@ApiTags('Batches')
@ApiBearerAuth()
@Controller('batches')
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('Batch berhasil dibuat')
  @ApiOperation({
    summary:
      'Tambah batch obat baru (saldo stok awal otomatis 0, stok ditambah lewat Stock In) - Admin/Staff',
  })
  @ApiResponse({ status: 201, description: 'Batch berhasil dibuat' })
  @ApiResponse({ status: 400, description: 'Validasi gagal / tanggal expired di masa lalu' })
  @ApiResponse({ status: 403, description: 'Akses ditolak (Bukan Admin/Staff)' })
  @ApiResponse({ status: 404, description: 'Produk tidak ditemukan' })
  @ApiResponse({ status: 409, description: 'Nomor batch sudah ada untuk produk ini' })
  create(@Body() createBatchDto: CreateBatchDto) {
    return this.batchesService.create(createBatchDto);
  }

  @Get()
  @ResponseMessage('Daftar batch berhasil diambil')
  @ApiOperation({
    summary:
      'Daftar seluruh batch dengan pagination, filter produk, & urutan FEFO (First Expired First Out)',
  })
  @ApiResponse({ status: 200, description: 'Daftar batch' })
  findAll(@Query() query: BatchQueryDto) {
    return this.batchesService.findAll(query);
  }

  @Get('expiring')
  @ResponseMessage('Daftar batch mendekati kedaluwarsa berhasil diambil')
  @ApiOperation({
    summary:
      'Daftar batch yang mendekati tanggal kedaluwarsa (untuk widget alert Dashboard)',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    example: 30,
    description: 'Rentang hari menuju expired (default: 30 hari)',
  })
  @ApiResponse({ status: 200, description: 'Daftar batch mendekati expired' })
  findExpiring(
    @Query('days', new ParseIntPipe({ optional: true })) days?: number,
  ) {
    return this.batchesService.findExpiring(days || 30);
  }

  @Get(':id')
  @ResponseMessage('Detail batch berhasil diambil')
  @ApiOperation({
    summary: 'Detail batch beserta informasi produk dan riwayat mutasi stok',
  })
  @ApiResponse({ status: 200, description: 'Detail batch' })
  @ApiResponse({ status: 400, description: 'Format UUID tidak valid' })
  @ApiResponse({ status: 404, description: 'Batch tidak ditemukan' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.batchesService.findOne(id);
  }

  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Patch(':id')
  @ResponseMessage('Batch berhasil diperbarui')
  @ApiOperation({ summary: 'Perbarui nomor batch atau tanggal kedaluwarsa (Admin/Staff)' })
  @ApiResponse({ status: 200, description: 'Batch berhasil diperbarui' })
  @ApiResponse({ status: 400, description: 'Format input tidak valid' })
  @ApiResponse({ status: 403, description: 'Akses ditolak (Bukan Admin/Staff)' })
  @ApiResponse({ status: 404, description: 'Batch tidak ditemukan' })
  @ApiResponse({ status: 409, description: 'Nomor batch baru sudah digunakan' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateBatchDto: UpdateBatchDto,
  ) {
    return this.batchesService.update(id, updateBatchDto);
  }

  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Delete(':id')
  @ResponseMessage('Batch berhasil dihapus')
  @ApiOperation({
    summary:
      'Hapus batch (hanya diizinkan jika saldo stok 0 dan belum pernah ada mutasi stok) - Admin/Staff',
  })
  @ApiResponse({ status: 200, description: 'Batch berhasil dihapus' })
  @ApiResponse({ status: 403, description: 'Akses ditolak (Bukan Admin/Staff)' })
  @ApiResponse({ status: 404, description: 'Batch tidak ditemukan' })
  @ApiResponse({ status: 409, description: 'Batch masih memiliki saldo / riwayat mutasi' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.batchesService.remove(id);
  }
}
