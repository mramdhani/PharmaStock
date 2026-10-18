import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

/**
 * DTO Query untuk pencarian, filter, dan pagination daftar Batch.
 */
export class BatchQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter berdasarkan UUID produk',
  })
  @IsUUID('4', { message: 'product_id harus berupa format UUID yang valid' })
  @IsOptional()
  product_id?: string;

  @ApiPropertyOptional({
    description: 'Hanya tampilkan batch yang masih memiliki saldo stok (> 0)',
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  has_stock?: boolean;

  @ApiPropertyOptional({
    default: 30,
    description: 'Filter batch yang akan kedaluwarsa dalam sekian hari ke depan',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  @IsOptional()
  days?: number;
}
