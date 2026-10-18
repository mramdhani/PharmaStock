import {
  Body,
  Controller,
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
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Roles(UserRole.ADMIN) // Hanya Administrator yang memiliki hak kelola akun
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ResponseMessage('Daftar pengguna berhasil diambil')
  @ApiOperation({ summary: 'Daftar seluruh akun pengguna (Khusus Admin)' })
  @ApiResponse({ status: 200, description: 'Daftar pengguna' })
  @ApiResponse({ status: 403, description: 'Akses ditolak (Bukan Admin)' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ResponseMessage('Detail pengguna berhasil diambil')
  @ApiOperation({ summary: 'Detail akun pengguna berdasarkan ID (Khusus Admin)' })
  @ApiResponse({ status: 200, description: 'Detail pengguna' })
  @ApiResponse({ status: 404, description: 'Pengguna tidak ditemukan' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('Akun pengguna berhasil dibuat')
  @ApiOperation({ summary: 'Buat akun pengguna baru (Khusus Admin)' })
  @ApiResponse({ status: 201, description: 'Akun berhasil dibuat' })
  @ApiResponse({ status: 409, description: 'Email sudah terdaftar' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Patch(':id')
  @ResponseMessage('Akun pengguna berhasil diperbarui')
  @ApiOperation({ summary: 'Perbarui akun pengguna atau role (Khusus Admin)' })
  @ApiResponse({ status: 200, description: 'Akun berhasil diperbarui' })
  @ApiResponse({ status: 400, description: 'Proteksi akun master admin terpicu' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }
}
