import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

/**
 * DTO Query untuk pencarian, pagination, dan filter produk.
 */
export class ProductQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter berdasarkan UUID kategori',
  })
  @IsUUID('4', { message: 'category_id harus berupa format UUID yang valid' })
  @IsOptional()
  category_id?: string;

  @ApiPropertyOptional({
    description: 'Filter berdasarkan status aktif (true/false)',
  })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean({ message: 'is_active harus bernilai boolean' })
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Filter produk dengan stok menipis (total_stock <= minimum_stock)',
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  low_stock?: boolean;
}
