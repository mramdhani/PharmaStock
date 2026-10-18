import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

/**
 * DTO untuk mengupdate akun User.
 */
export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({
    example: true,
    description: 'Status aktif pengguna',
  })
  @IsBoolean({ message: 'is_active harus bernilai boolean' })
  @IsOptional()
  is_active?: boolean;
}
