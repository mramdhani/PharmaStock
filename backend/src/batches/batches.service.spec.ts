import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { BatchesService } from './batches.service';
import { Batch } from './entities/batch.entity';

describe('BatchesService', () => {
  let service: BatchesService;
  let batchRepo: jest.Mocked<Partial<Repository<Batch>>>;
  let productRepo: jest.Mocked<Partial<Repository<Product>>>;

  const mockProduct: Product = {
    id: 'p1111111-1111-1111-1111-111111111111',
    category_id: 'c1111111-1111-1111-1111-111111111111',
    category: null as any,
    sku: 'MED-AMX-500',
    name: 'Amoxicillin 500mg',
    unit: 'Strip',
    minimum_stock: 50,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    batches: [],
  };

  const mockBatch: Batch = {
    id: 'b1111111-1111-1111-1111-111111111111',
    product_id: mockProduct.id,
    product: mockProduct,
    batch_number: 'BAT-2027-01',
    expiry_date: '2027-12-31',
    current_stock: 0,
    created_at: new Date(),
    updated_at: new Date(),
    stock_movements: [],
  };

  beforeEach(async () => {
    batchRepo = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    productRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatchesService,
        {
          provide: getRepositoryToken(Batch),
          useValue: batchRepo,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: productRepo,
        },
      ],
    }).compile();

    service = module.get<BatchesService>(BatchesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('melempar NotFoundException jika produk tidak ditemukan', async () => {
      productRepo.findOne!.mockResolvedValue(null);

      await expect(
        service.create({
          product_id: 'non-existent-product',
          batch_number: 'BAT-01',
          expiry_date: '2028-01-01',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('melempar BadRequestException jika tanggal kedaluwarsa di masa lalu', async () => {
      productRepo.findOne!.mockResolvedValue(mockProduct);

      await expect(
        service.create({
          product_id: mockProduct.id,
          batch_number: 'BAT-01',
          expiry_date: '2020-01-01', // masa lalu
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('melempar ConflictException jika nomor batch sudah ada untuk produk yang sama', async () => {
      productRepo.findOne!.mockResolvedValue(mockProduct);
      batchRepo.findOne!.mockResolvedValue(mockBatch);

      await expect(
        service.create({
          product_id: mockProduct.id,
          batch_number: 'BAT-2027-01',
          expiry_date: '2028-01-01',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('berhasil membuat batch baru dengan saldo stok 0', async () => {
      productRepo.findOne!.mockResolvedValue(mockProduct);
      batchRepo.findOne!.mockResolvedValue(null);
      batchRepo.create!.mockReturnValue(mockBatch);
      batchRepo.save!.mockResolvedValue(mockBatch);

      const result = await service.create({
        product_id: mockProduct.id,
        batch_number: 'BAT-2027-01',
        expiry_date: '2028-01-01',
      });

      expect(result).toEqual(mockBatch);
      expect(batchRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ current_stock: 0 }),
      );
    });
  });
});
