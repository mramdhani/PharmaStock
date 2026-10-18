import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { MovementType } from '../entities/stock-movement.entity';

/**
 * DTO Query untuk melihat riwayat mutasi stok (Ledger).
 */
export class StockQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: MovementType,
    description: 'Filter jenis pergerakan stok: IN atau OUT',
  })
  @IsEnum(MovementType, { message: 'type harus berupa IN atau OUT' })
  @IsOptional()
  type?: MovementType;

  @ApiPropertyOptional({
    description: 'Filter berdasarkan UUID batch tertentu',
  })
  @IsUUID('4', { message: 'batch_id harus berupa format UUID yang valid' })
  @IsOptional()
  batch_id?: string;

  @ApiPropertyOptional({
    description: 'Filter berdasarkan UUID produk tertentu',
  })
  @IsUUID('4', { message: 'product_id harus berupa format UUID yang valid' })
  @IsOptional()
  product_id?: string;
}
