import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { StockMovement } from '../../stock/entities/stock-movement.entity';

/**
 * Entity Batches
 * Batch produksi obat dengan tanggal kedaluwarsa dan saldo stok tersisa.
 */
@Entity('batches')
@Unique(['product_id', 'batch_number'])
@Check(`"current_stock" >= 0`)
export class Batch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id', type: 'uuid' })
  product_id: string;

  @ManyToOne(() => Product, (product) => product.batches, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'batch_number', type: 'varchar', length: 50 })
  batch_number: string;

  @Column({ name: 'expiry_date', type: 'date' })
  expiry_date: string;

  @Column({ name: 'current_stock', type: 'integer', default: 0 })
  current_stock: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => StockMovement, (movement) => movement.batch)
  stock_movements: StockMovement[];
}
