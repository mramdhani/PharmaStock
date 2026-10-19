import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * DTO untuk transaksi Barang Masuk (Stock In).
 */
export class StockInDto {
  @ApiProperty({
    example: '463101f0-bf2b-4645-81c1-69e16703d480',
    description: 'UUID Batch obat penerima stok',
  })
  @IsUUID('4', { message: 'batch_id harus berupa format UUID yang valid' })
  @IsNotEmpty({ message: 'batch_id tidak boleh kosong' })
  batch_id: string;

  @ApiProperty({
    example: 100,
    minimum: 1,
    description: 'Jumlah unit obat yang masuk (harus bilangan bulat > 0)',
  })
  @Type(() => Number)
  @IsInt({ message: 'quantity harus berupa bilangan bulat' })
  @Min(1, { message: 'quantity harus lebih besar dari 0' })
  quantity: number;

  @ApiPropertyOptional({
    example: 'PO-2026-X01',
    maxLength: 100,
    description: 'Nomor referensi / Surat Jalan Pabrik / Purchase Order',
  })
  @IsString({ message: 'reference_no harus berupa teks' })
  @MaxLength(100, { message: 'reference_no maksimal 100 karakter' })
  @IsOptional()
  reference_no?: string;

  @ApiPropertyOptional({
    example: 'Penerimaan stok batch perdana dari distributor farmasi',
    description: 'Catatan tambahan transaksi',
  })
  @IsString({ message: 'notes harus berupa teks' })
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'UUID pengguna yang melakukan transaksi (opsional jika via JWT token)',
  })
  @IsUUID('4', { message: 'user_id harus berupa format UUID yang valid' })
  @IsOptional()
  user_id?: string;
}
