import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/**
 * DTO untuk membuat Produk baru.
 * Dilengkapi validasi format SKU, nama, satuan, dan foreign key category_id.
 */
export class CreateProductDto {
  @ApiProperty({
    example: '75ee61d4-7024-4622-a3a8-8bfe81e5af64',
    description: 'UUID Kategori obat yang valid',
  })
  @IsUUID('4', { message: 'category_id harus berupa format UUID yang valid' })
  @IsNotEmpty({ message: 'category_id tidak boleh kosong' })
  category_id: string;

  @ApiProperty({
    example: 'MED-001',
    description: 'Kode SKU unik produk (huruf kapital, angka, strip, underscore)',
    minLength: 3,
    maxLength: 30,
  })
  // Otomatis ubah SKU menjadi UPPERCASE dan trim spasi
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString({ message: 'SKU harus berupa teks' })
  @IsNotEmpty({ message: 'SKU tidak boleh kosong' })
  @MinLength(3, { message: 'SKU minimal 3 karakter' })
  @MaxLength(30, { message: 'SKU maksimal 30 karakter' })
  @Matches(/^[A-Z0-9_-]+$/, {
    message: 'SKU hanya boleh berisi huruf kapital, angka, strip (-), dan underscore (_)',
  })
  sku: string;

  @ApiProperty({
    example: 'Paracetamol 500mg',
    description: 'Nama obat/produk farmasi',
    minLength: 2,
    maxLength: 150,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Nama produk harus berupa teks' })
  @IsNotEmpty({ message: 'Nama produk tidak boleh kosong' })
  @MinLength(2, { message: 'Nama produk minimal 2 karakter' })
  @MaxLength(150, { message: 'Nama produk maksimal 150 karakter' })
  name: string;

  @ApiProperty({
    example: 'Box',
    description: 'Satuan kemasan stok (misal: Box, Strip, Bottle, Tablet)',
    maxLength: 20,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Satuan unit harus berupa teks' })
  @IsNotEmpty({ message: 'Satuan unit tidak boleh kosong' })
  @MaxLength(20, { message: 'Satuan unit maksimal 20 karakter' })
  unit: string;

  @ApiPropertyOptional({
    example: 100,
    default: 0,
    description: 'Batas minimum stok untuk peringatan stok menipis (harus >= 0)',
  })
  @Type(() => Number)
  @IsInt({ message: 'Minimum stok harus berupa bilangan bulat' })
  @Min(0, { message: 'Minimum stok tidak boleh bernilai negatif' })
  @IsOptional()
  minimum_stock?: number = 0;
}
