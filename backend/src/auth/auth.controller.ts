import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  // Rate Limiting: 30x percobaan per menit agar user/recruiter leluasa mencoba demo login
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ResponseMessage('Login berhasil')
  @ApiOperation({
    summary:
      'Login akun untuk mendapatkan JWT Access Token (Maksimal 5x/menit)',
  })
  @ApiResponse({ status: 200, description: 'Login berhasil, token diterbitkan' })
  @ApiResponse({ status: 401, description: 'Email atau password salah' })
  @ApiResponse({ status: 429, description: 'Too Many Requests (Terkena Rate Limit)' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ResponseMessage('Profil pengguna berhasil diambil')
  @ApiOperation({ summary: 'Lihat profil akun yang sedang login' })
  @ApiResponse({ status: 200, description: 'Profil pengguna' })
  @ApiResponse({ status: 401, description: 'Token tidak valid atau kedaluwarsa' })
  getMe(@CurrentUser() user: User) {
    return this.authService.getProfile(user.id);
  }
}
