import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * Reusable Pagination DTO
 * Digunakan untuk endpoint yang mendukung pagination & search.
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1, description: 'Halaman ke berapa' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100, description: 'Jumlah item per halaman' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Kata kunci pencarian' })
  @IsString()
  @IsOptional()
  search?: string;

  /**
   * Helper untuk menghitung nilai offset (skip) untuk query TypeORM
   */
  get skip(): number {
    return ((this.page ?? 1) - 1) * (this.limit ?? 10);
  }
}
