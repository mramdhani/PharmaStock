import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { UsersService } from './users.service';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<Partial<Repository<User>>>;

  const mockAdminUser: User = {
    id: 'admin-uuid-1',
    name: 'Master Administrator',
    email: 'admin@pharmastock.com',
    password_hash: '$2a$10$hashedpassword',
    role: UserRole.ADMIN,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockStaffUser: User = {
    id: 'staff-uuid-1',
    name: 'Staff Farmasi',
    email: 'staff@pharmastock.com',
    password_hash: '$2a$10$hashedpassword',
    role: UserRole.STAFF,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    repository = {
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('mengembalikan daftar user dan metadata pagination', async () => {
      repository.findAndCount!.mockResolvedValue([[mockAdminUser, mockStaffUser], 2]);

      const result = await service.findAll({ page: 1, limit: 10, skip: 0 });
      expect(result.items).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.totalPages).toBe(1);
    });
  });

  describe('findOne', () => {
    it('mengembalikan user jika ID ditemukan', async () => {
      repository.findOne!.mockResolvedValue(mockAdminUser);
      const result = await service.findOne(mockAdminUser.id);
      expect(result).toEqual(mockAdminUser);
    });

    it('melempar NotFoundException jika ID tidak ditemukan', async () => {
      repository.findOne!.mockResolvedValue(null);
      await expect(service.findOne('invalid-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('berhasil membuat user baru', async () => {
      repository.findOne!.mockResolvedValue(null);
      repository.create!.mockReturnValue(mockStaffUser);
      repository.save!.mockResolvedValue(mockStaffUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2a$10$hashedpassword');

      const result = await service.create({
        name: 'Staff Farmasi',
        email: 'staff@pharmastock.com',
        password: 'PharmaStock123!',
        role: UserRole.STAFF,
      });

      expect(result).toEqual(mockStaffUser);
      expect(repository.save).toHaveBeenCalled();
    });

    it('melempar ConflictException jika email sudah terdaftar', async () => {
      repository.findOne!.mockResolvedValue(mockStaffUser);

      await expect(
        service.create({
          name: 'Staff Duplikat',
          email: 'staff@pharmastock.com',
          password: 'PharmaStock123!',
          role: UserRole.STAFF,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('melempar BadRequestException jika mencoba menonaktifkan akun master admin', async () => {
      repository.findOne!.mockResolvedValue({ ...mockAdminUser });

      await expect(
        service.update(mockAdminUser.id, { is_active: false }),
      ).rejects.toThrow(BadRequestException);
    });

    it('melempar BadRequestException jika mencoba mengubah role akun master admin', async () => {
      repository.findOne!.mockResolvedValue({ ...mockAdminUser });

      await expect(
        service.update(mockAdminUser.id, { role: UserRole.STAFF }),
      ).rejects.toThrow(BadRequestException);
    });

    it('berhasil memperbarui data user staff', async () => {
      const updatedStaff = { ...mockStaffUser, name: 'Staff Updated' };
      repository.findOne!.mockResolvedValueOnce({ ...mockStaffUser });
      repository.save!.mockResolvedValue(updatedStaff);

      const result = await service.update(mockStaffUser.id, {
        name: 'Staff Updated',
      });

      expect(result.name).toBe('Staff Updated');
    });
  });
});
