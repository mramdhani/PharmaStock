import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CreateGuestbookDto } from './dto/create-guestbook.dto';
import { GuestbookService } from './guestbook.service';

@ApiTags('Guestbook')
@Controller('guestbook')
export class GuestbookController {
  constructor(private readonly guestbookService: GuestbookService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('Salam dan perkenalan Anda berhasil terkirim ke sistem!')
  @ApiOperation({ summary: 'Kirim salam dan perkenalan diri (Publik / Tanpa Login)' })
  @ApiResponse({ status: 201, description: 'Salam berhasil disimpan' })
  @ApiResponse({ status: 400, description: 'Validasi input gagal' })
  create(@Body() dto: CreateGuestbookDto, @Req() req: Request) {
    const forwarded = req.headers['x-forwarded-for'];
    const ip =
      (typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : Array.isArray(forwarded)
          ? forwarded[0]
          : req.ip) || undefined;

    const userAgent = (req.headers['user-agent'] as string) || undefined;

    return this.guestbookService.create(dto, ip, userAgent);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPERADMIN)
  @Get()
  @ResponseMessage('Daftar buku tamu berhasil diambil')
  @ApiOperation({ summary: 'Lihat daftar buku tamu & perkenalan pengunjung (Khusus Superadmin)' })
  @ApiResponse({ status: 200, description: 'Daftar buku tamu' })
  @ApiResponse({ status: 403, description: 'Akses ditolak (Hanya Superadmin)' })
  findAll() {
    return this.guestbookService.findAll();
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPERADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Data buku tamu berhasil dihapus')
  @ApiOperation({ summary: 'Hapus data buku tamu (Khusus Superadmin)' })
  @ApiResponse({ status: 200, description: 'Data berhasil dihapus' })
  @ApiResponse({ status: 403, description: 'Akses ditolak (Hanya Superadmin)' })
  @ApiResponse({ status: 404, description: 'Data tidak ditemukan' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.guestbookService.remove(id);
  }
}
