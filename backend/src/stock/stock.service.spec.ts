import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Batch } from '../batches/entities/batch.entity';
import { Product } from '../products/entities/product.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { MovementType, StockMovement } from './entities/stock-movement.entity';
import { StockService } from './stock.service';

describe('StockService', () => {
  let service: StockService;
  let dataSource: any;
  let queryRunner: any;
  let stockMovementRepo: jest.Mocked<Partial<Repository<StockMovement>>>;
  let batchRepo: jest.Mocked<Partial<Repository<Batch>>>;
  let userRepo: jest.Mocked<Partial<Repository<User>>>;

  const mockUser: User = {
    id: 'u1111111-1111-1111-1111-111111111111',
    name: 'Gudang Staff',
    email: 'staff@pharmastock.com',
    password_hash: 'hashed',
    role: UserRole.STAFF,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    stock_movements: [],
  };

  const mockBatch: Batch = {
    id: 'b1111111-1111-1111-1111-111111111111',
    product_id: 'p1111111-1111-1111-1111-111111111111',
    product: { is_active: true } as any,
    batch_number: 'BAT-2028-01',
    expiry_date: '2028-12-31',
    current_stock: 50,
    created_at: new Date(),
    updated_at: new Date(),
    stock_movements: [],
  };

  beforeEach(async () => {
    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
      },
    };

    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    };

    stockMovementRepo = {};
    batchRepo = {};
    userRepo = {
      findOne: jest.fn().mockResolvedValue(mockUser),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        {
          provide: DataSource,
          useValue: dataSource,
        },
        {
          provide: getRepositoryToken(StockMovement),
          useValue: stockMovementRepo,
        },
        {
          provide: getRepositoryToken(Batch),
          useValue: batchRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepo,
        },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordStockOut', () => {
    it('melempar NotFoundException jika batch tidak ditemukan', async () => {
      queryRunner.manager.findOne.mockResolvedValue(null);

      await expect(
        service.recordStockOut({
          batch_id: 'non-existent-batch',
          quantity: 10,
        }),
      ).rejects.toThrow(NotFoundException);

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('melempar ConflictException jika stok tidak mencukupi (insufficient stock)', async () => {
      queryRunner.manager.findOne.mockResolvedValue({
        ...mockBatch,
        current_stock: 10, // hanya ada 10
      });

      await expect(
        service.recordStockOut({
          batch_id: mockBatch.id,
          quantity: 25, // minta 25
        }),
      ).rejects.toThrow(ConflictException);

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('melempar ConflictException jika obat pada batch sudah kedaluwarsa', async () => {
      queryRunner.manager.findOne.mockResolvedValue({
        ...mockBatch,
        expiry_date: '2020-01-01', // masa lalu
      });

      await expect(
        service.recordStockOut({
          batch_id: mockBatch.id,
          quantity: 5,
        }),
      ).rejects.toThrow(ConflictException);

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('berhasil memproses Stock Out, mengurangi stok, dan melakukan commit transaksi', async () => {
      const batchInstance = { ...mockBatch, current_stock: 50 };
      queryRunner.manager.findOne.mockResolvedValue(batchInstance);
      queryRunner.manager.create.mockReturnValue({
        id: 'm1111111-1111-1111-1111-111111111111',
        type: MovementType.OUT,
        quantity: 20,
      });
      queryRunner.manager.save.mockResolvedValue({});

      const result = await service.recordStockOut({
        batch_id: mockBatch.id,
        quantity: 20,
      });

      expect(result.remaining_stock).toBe(30);
      expect(batchInstance.current_stock).toBe(30);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });

  describe('recordStockIn', () => {
    it('berhasil memproses Stock In, menambah saldo stok, dan melakukan commit', async () => {
      const batchInstance = { ...mockBatch, current_stock: 10 };
      queryRunner.manager.findOne.mockImplementation((entity: any) => {
        if (entity === Batch) return Promise.resolve(batchInstance);
        if (entity === Product) return Promise.resolve({ id: mockBatch.product_id, is_active: true });
        return Promise.resolve(null);
      });
      queryRunner.manager.create.mockReturnValue({
        id: 'm2222222-2222-2222-2222-222222222222',
        type: MovementType.IN,
        quantity: 40,
      });
      queryRunner.manager.save.mockResolvedValue({});

      const result = await service.recordStockIn({
        batch_id: mockBatch.id,
        quantity: 40,
      });

      expect(result.current_stock).toBe(50);
      expect(batchInstance.current_stock).toBe(50);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });
});
