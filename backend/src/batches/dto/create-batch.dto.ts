import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * DTO untuk membuat Batch baru.
 * Saldo stok awal SELALU 0. Stok hanya boleh bertambah melalui transaksi Stock In.
 */
export class CreateBatchDto {
  @ApiProperty({
    example: '9378e909-f085-45f9-b29c-ff387faeb8c6',
    description: 'UUID produk farmasi yang valid',
  })
  @IsUUID('4', { message: 'product_id harus berupa format UUID yang valid' })
  @IsNotEmpty({ message: 'product_id tidak boleh kosong' })
  product_id: string;

  @ApiProperty({
    example: 'BAT-2026-A1',
    description: 'Nomor batch unik per-produk (huruf kapital, angka, strip, underscore)',
    minLength: 2,
    maxLength: 50,
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString({ message: 'Nomor batch harus berupa teks' })
  @IsNotEmpty({ message: 'Nomor batch tidak boleh kosong' })
  @MinLength(2, { message: 'Nomor batch minimal 2 karakter' })
  @MaxLength(50, { message: 'Nomor batch maksimal 50 karakter' })
  @Matches(/^[A-Z0-9_-]+$/, {
    message: 'Nomor batch hanya boleh berisi huruf kapital, angka, strip (-), dan underscore (_)',
  })
  batch_number: string;

  @ApiProperty({
    example: '2027-12-31',
    description: 'Tanggal kedaluwarsa obat (format YYYY-MM-DD, wajib di masa depan)',
  })
  @IsDateString(
    {},
    { message: 'expiry_date harus berupa tanggal dengan format YYYY-MM-DD' },
  )
  @IsNotEmpty({ message: 'expiry_date tidak boleh kosong' })
  expiry_date: string;
}
