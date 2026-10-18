import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repository: jest.Mocked<Partial<Repository<Category>>>;

  const mockCategory: Category = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Analgesic',
    created_at: new Date(),
    products: [],
  };

  beforeEach(async () => {
    repository = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getRepositoryToken(Category),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('berhasil membuat kategori baru', async () => {
      repository.findOne!.mockResolvedValue(null);
      repository.create!.mockReturnValue(mockCategory as Category);
      repository.save!.mockResolvedValue(mockCategory as Category);

      const result = await service.create({ name: 'Analgesic' });
      expect(result).toEqual(mockCategory);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { name: 'Analgesic' },
      });
    });

    it('melempar ConflictException jika nama kategori sudah ada', async () => {
      repository.findOne!.mockResolvedValue(mockCategory as Category);

      await expect(service.create({ name: 'Analgesic' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findOne', () => {
    it('berhasil mengambil kategori jika ID ditemukan', async () => {
      repository.findOne!.mockResolvedValue(mockCategory as Category);

      const result = await service.findOne(mockCategory.id);
      expect(result).toEqual(mockCategory);
    });

    it('melempar NotFoundException jika ID tidak ditemukan', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
