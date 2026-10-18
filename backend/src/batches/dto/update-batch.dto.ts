import { PartialType } from '@nestjs/swagger';
import { CreateBatchDto } from './create-batch.dto';

/**
 * DTO untuk mengupdate nomor batch atau tanggal expired.
 * Saldo stok TIDAK BISA diubah di sini (hanya lewat Stock In / Stock Out).
 */
export class UpdateBatchDto extends PartialType(CreateBatchDto) {}
