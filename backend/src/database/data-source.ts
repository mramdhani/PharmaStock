import * as dotenv from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Batch } from '../batches/entities/batch.entity';
import { Category } from '../categories/entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { StockMovement } from '../stock/entities/stock-movement.entity';
import { User } from '../users/entities/user.entity';

// Muat variabel environment dari .env
dotenv.config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'pharmastock',
  username: process.env.DB_USER || 'pharmastock_app',
  password: process.env.DB_PASSWORD || 'pharmastock_dev_password_2026',
  entities: [User, Category, Product, Batch, StockMovement],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
};

const AppDataSource = new DataSource(dataSourceOptions);
export default AppDataSource;
