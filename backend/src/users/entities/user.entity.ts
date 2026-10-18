import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StockMovement } from '../../stock/entities/stock-movement.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  VIEWER = 'VIEWER',
}

/**
 * Entity Users
 * Menyimpan data akun pengguna & role untuk otorisasi sistem.
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  // Password hash sengaja kita exclude dari query default untuk keamanan
  @Column({ name: 'password_hash', type: 'varchar', length: 255, select: false })
  password_hash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.VIEWER,
  })
  role: UserRole;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => StockMovement, (movement) => movement.user)
  stock_movements: StockMovement[];
}
