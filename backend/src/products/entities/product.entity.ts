import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Batch } from '../../batches/entities/batch.entity';
import { Category } from '../../categories/entities/category.entity';

/**
 * Entity Products
 * Data master produk farmasi (obat).
 */
@Entity('products')
@Check(`"minimum_stock" >= 0`)
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'category_id', type: 'uuid' })
  category_id: string;

  @ManyToOne(() => Category, (category) => category.products, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 30, unique: true })
  sku: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 20 })
  unit: string;

  @Column({ name: 'minimum_stock', type: 'integer', default: 0 })
  minimum_stock: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => Batch, (batch) => batch.product)
  batches: Batch[];
}
