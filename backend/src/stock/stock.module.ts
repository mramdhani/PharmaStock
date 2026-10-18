import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Batch } from '../batches/entities/batch.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';

@Module({
  imports: [TypeOrmModule.forFeature([StockMovement, Batch, User, Product])],
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService],
})
export class StockModule {}
