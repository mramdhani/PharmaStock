import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Batch } from '../../batches/entities/batch.entity';
import { User } from '../../users/entities/user.entity';

export enum MovementType {
  IN = 'IN',
  OUT = 'OUT',
}

/**
 * Entity StockMovements
 * Buku besar (ledger) riwayat pergerakan stok: IN / OUT.
 * Bersifat append-only (tidak boleh diedit/dihapus via API).
 */
@Entity('stock_movements')
@Check(`"quantity" > 0`)
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'batch_id', type: 'uuid' })
  batch_id: string;

  @ManyToOne(() => Batch, (batch) => batch.stock_movements, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'batch_id' })
  batch: Batch;

  @Column({ name: 'user_id', type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User, (user) => user.stock_movements, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: MovementType,
  })
  type: MovementType;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({ name: 'reference_no', type: 'varchar', length: 100, nullable: true })
  reference_no: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;
}
