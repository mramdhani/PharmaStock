import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Batch } from '../batches/entities/batch.entity';
import { Category } from '../categories/entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { StockMovement } from '../stock/entities/stock-movement.entity';
import { User } from '../users/entities/user.entity';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Category, Product, Batch, StockMovement]),
  ],
  controllers: [SystemController],
  providers: [SystemService],
  exports: [SystemService],
})
export class SystemModule {}
