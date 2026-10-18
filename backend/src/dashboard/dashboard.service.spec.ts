import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Batch } from '../batches/entities/batch.entity';
import { Category } from '../categories/entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { MovementType, StockMovement } from '../stock/entities/stock-movement.entity';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let productRepository: jest.Mocked<Partial<Repository<Product>>>;
  let batchRepository: jest.Mocked<Partial<Repository<Batch>>>;
  let stockMovementRepository: jest.Mocked<Partial<Repository<StockMovement>>>;
  let categoryRepository: jest.Mocked<Partial<Repository<Category>>>;

  beforeEach(async () => {
    productRepository = {
      count: jest.fn().mockResolvedValue(10),
      query: jest.fn().mockResolvedValue([{ count: 2 }]),
    };

    categoryRepository = {
      count: jest.fn().mockResolvedValue(4),
    };

    const mockBatchQB: any = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ total: '150' }),
      getCount: jest.fn().mockResolvedValue(3),
    };

    batchRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockBatchQB),
    };

    stockMovementRepository = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'movement-1',
          type: MovementType.IN,
          quantity: 50,
          reference_no: 'PO-001',
          notes: 'Penerimaan stok',
          created_at: new Date(),
          batch: {
            batch_number: 'PAR-2026-001',
            product: {
              name: 'Paracetamol 500mg',
              sku: 'MED-PAR-500',
            },
          },
          user: {
            name: 'Staff Farmasi',
          },
        },
      ]),
      query: jest.fn().mockResolvedValue([
        {
          date: new Date().toISOString().split('T')[0],
          in_qty: 50,
          out_qty: 10,
        },
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: getRepositoryToken(Product),
          useValue: productRepository,
        },
        {
          provide: getRepositoryToken(Batch),
          useValue: batchRepository,
        },
        {
          provide: getRepositoryToken(StockMovement),
          useValue: stockMovementRepository,
        },
        {
          provide: getRepositoryToken(Category),
          useValue: categoryRepository,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSummary', () => {
    it('mengembalikan agregasi KPI, grafik 7 hari, dan mutasi terbaru', async () => {
      const result = await service.getSummary();

      // Verifikasi KPI
      expect(result.kpi.total_products).toBe(10);
      expect(result.kpi.total_categories).toBe(4);
      expect(result.kpi.total_stock_units).toBe(150);
      expect(result.kpi.low_stock_products_count).toBe(2);
      expect(result.kpi.expiring_batches_count).toBe(3);

      // Verifikasi Grafik 7 Hari
      expect(result.chart_data_7_days).toHaveLength(7);
      const todayStr = new Date().toISOString().split('T')[0];
      const todayChart = result.chart_data_7_days.find((c) => c.date === todayStr);
      expect(todayChart).toBeDefined();
      expect(todayChart?.stock_in).toBe(50);
      expect(todayChart?.stock_out).toBe(10);

      // Verifikasi Mutasi Terbaru
      expect(result.recent_movements).toHaveLength(1);
      expect(result.recent_movements[0].product_name).toBe('Paracetamol 500mg');
      expect(result.recent_movements[0].batch_number).toBe('PAR-2026-001');
      expect(result.recent_movements[0].user_name).toBe('Staff Farmasi');
    });
  });
});
