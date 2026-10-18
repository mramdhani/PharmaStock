import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../categories/entities/category.entity';
import { Product } from './entities/product.entity';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepo: jest.Mocked<Partial<Repository<Product>>>;
  let categoryRepo: jest.Mocked<Partial<Repository<Category>>>;

  const mockCategory: Category = {
    id: 'c1111111-1111-1111-1111-111111111111',
    name: 'Analgesic',
    created_at: new Date(),
    products: [],
  };

  const mockProduct: Product = {
    id: 'p1111111-1111-1111-1111-111111111111',
    category_id: mockCategory.id,
    category: mockCategory,
    sku: 'MED-001',
    name: 'Paracetamol 500mg',
    unit: 'Box',
    minimum_stock: 10,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    batches: [],
  };

  beforeEach(async () => {
    productRepo = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    categoryRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: productRepo,
        },
        {
          provide: getRepositoryToken(Category),
          useValue: categoryRepo,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('melempar NotFoundException jika kategori tidak ditemukan', async () => {
      categoryRepo.findOne!.mockResolvedValue(null);

      await expect(
        service.create({
          category_id: 'non-existent-category',
          sku: 'MED-001',
          name: 'Paracetamol 500mg',
          unit: 'Box',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('melempar ConflictException jika SKU sudah ada', async () => {
      categoryRepo.findOne!.mockResolvedValue(mockCategory);
      productRepo.findOne!.mockResolvedValue(mockProduct);

      await expect(
        service.create({
          category_id: mockCategory.id,
          sku: 'MED-001',
          name: 'Paracetamol 500mg',
          unit: 'Box',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
