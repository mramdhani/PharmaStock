import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateProductDto } from './create-product.dto';

/**
 * DTO untuk mengupdate Produk.
 * Semua field CreateProductDto bersifat opsional, ditambah status aktif/nonaktif.
 */
export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiPropertyOptional({
    example: true,
    description: 'Status aktif/nonaktif produk',
  })
  @IsBoolean({ message: 'is_active harus bernilai boolean (true/false)' })
  @IsOptional()
  is_active?: boolean;
}
