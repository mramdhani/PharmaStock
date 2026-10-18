import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { UserRole } from '../users/entities/user.entity';
import { SystemService } from './system.service';

@ApiTags('System')
@ApiBearerAuth()
@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Post('reset-demo')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Data demo berhasil di-reset ke kondisi awal')
  @ApiOperation({
    summary: 'Reset Database Demo ke Kondisi Standar Pabrik (Khusus Admin)',
    description:
      'Menghapus mutasi atau perubahan dan mengisi ulang produk, kategori, batch serta pergerakan stok standar Dexa Group.',
  })
  @ApiResponse({
    status: 200,
    description: 'Database demo berhasil dipulihkan',
  })
  @ApiResponse({
    status: 403,
    description: 'Hanya Admin yang berhak menjalankan reset data demo',
  })
  async resetDemo() {
    return this.systemService.resetDemoData();
  }
}
