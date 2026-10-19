import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateGuestbookDto {
  @ApiProperty({
    example: 'Budi Santoso',
    description: 'Nama pengunjung atau recruiter',
    maxLength: 150,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Nama harus berupa teks' })
  @IsNotEmpty({ message: 'Nama tidak boleh kosong' })
  @MaxLength(150, { message: 'Nama maksimal 150 karakter' })
  name: string;

  @ApiPropertyOptional({
    example: 'Tech Recruiter di PT Bank Central Asia',
    description: 'Perusahaan atau institusi pengunjung',
    maxLength: 150,
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Perusahaan harus berupa teks' })
  @MaxLength(150, { message: 'Perusahaan maksimal 150 karakter' })
  organization?: string;

  @ApiPropertyOptional({
    example: 'Mencoba sistem PharmaStock untuk review posisi Fullstack Engineer',
    description: 'Pesan atau salam singkat',
    maxLength: 1000,
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Pesan harus berupa teks' })
  @MaxLength(1000, { message: 'Pesan maksimal 1000 karakter' })
  note?: string;
}
