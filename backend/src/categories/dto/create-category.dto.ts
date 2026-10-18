import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * DTO untuk membuat Category baru.
 * Dilengkapi validasi class-validator dan dokumentasi Swagger.
 */
export class CreateCategoryDto {
  @ApiProperty({
    example: 'Analgesic',
    description: 'Nama kategori obat (unik)',
    minLength: 2,
    maxLength: 100,
  })
  // Otomatis trim spasi di awal/akhir input
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Nama kategori harus berupa teks' })
  @IsNotEmpty({ message: 'Nama kategori tidak boleh kosong' })
  @MinLength(2, { message: 'Nama kategori minimal 2 karakter' })
  @MaxLength(100, { message: 'Nama kategori maksimal 100 karakter' })
  name: string;
}
