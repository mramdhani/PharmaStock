import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Roles(UserRole.ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('Produk berhasil dibuat')
  @ApiOperation({ summary: 'Tambah produk farmasi baru (Khusus Admin)' })
  @ApiResponse({ status: 201, description: 'Produk berhasil dibuat' })
  @ApiResponse({ status: 400, description: 'Validasi input gagal' })
  @ApiResponse({ status: 403, description: 'Akses ditolak (Bukan Admin)' })
  @ApiResponse({ status: 404, description: 'Kategori tidak ditemukan' })
  @ApiResponse({ status: 409, description: 'Kode SKU sudah terdaftar' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @ResponseMessage('Daftar produk berhasil diambil')
  @ApiOperation({
    summary: 'Daftar produk dengan filter kategori, stok menipis, search, & pagination',
  })
  @ApiResponse({ status: 200, description: 'Daftar produk' })
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @ResponseMessage('Detail produk berhasil diambil')
  @ApiOperation({
    summary: 'Detail produk lengkap beserta daftar batch (urutan FEFO) dan total saldo stok',
  })
  @ApiResponse({ status: 200, description: 'Detail produk' })
  @ApiResponse({ status: 400, description: 'Format UUID tidak valid' })
  @ApiResponse({ status: 404, description: 'Produk tidak ditemukan' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productsService.findOne(id);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  @ResponseMessage('Produk berhasil diperbarui')
  @ApiOperation({ summary: 'Perbarui data produk (Khusus Admin)' })
  @ApiResponse({ status: 200, description: 'Produk berhasil diperbarui' })
  @ApiResponse({ status: 400, description: 'Format input tidak valid' })
  @ApiResponse({ status: 403, description: 'Akses ditolak (Bukan Admin)' })
  @ApiResponse({ status: 404, description: 'Produk/Kategori tidak ditemukan' })
  @ApiResponse({ status: 409, description: 'SKU baru sudah digunakan' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @ResponseMessage('Status produk berhasil diproses')
  @ApiOperation({
    summary:
      'Hapus produk (jika belum ada batch) atau nonaktifkan produk (jika sudah ada riwayat) - Khusus Admin',
  })
  @ApiResponse({ status: 200, description: 'Produk berhasil diproses' })
  @ApiResponse({ status: 403, description: 'Akses ditolak (Bukan Admin)' })
  @ApiResponse({ status: 404, description: 'Produk tidak ditemukan' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productsService.remove(id);
  }
}
