import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Mengambil seluruh daftar pengguna dengan pagination.
   */
  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 10, skip } = query;

    const [items, total] = await this.userRepository.findAndCount({
      order: { created_at: 'ASC' },
      skip,
      take: limit,
    });

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mengambil detail satu user berdasarkan ID.
   */
  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Pengguna dengan ID "${id}" tidak ditemukan`);
    }
    return user;
  }

  /**
   * Membuat akun pengguna baru.
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const existing = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existing) {
      throw new ConflictException(
        `Email "${createUserDto.email}" sudah terdaftar pada sistem`,
      );
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    const user = this.userRepository.create({
      name: createUserDto.name,
      email: createUserDto.email,
      password_hash: passwordHash,
      role: createUserDto.role,
      is_active: true,
    });

    return this.userRepository.save(user);
  }

  /**
   * Memperbarui akun pengguna dengan proteksi akun Master Admin.
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Proteksi akun master admin
    if (user.email === 'admin@pharmastock.com') {
      if (updateUserDto.is_active === false) {
        throw new BadRequestException(
          'Akun master admin utama tidak boleh dinonaktifkan demi keamanan',
        );
      }
      if (updateUserDto.role && updateUserDto.role !== UserRole.ADMIN) {
        throw new BadRequestException(
          'Role akun master admin utama tidak boleh diubah',
        );
      }
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const duplicate = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (duplicate) {
        throw new ConflictException(
          `Email "${updateUserDto.email}" sudah digunakan oleh akun lain`,
        );
      }
    }

    if (updateUserDto.password) {
      user.password_hash = await bcrypt.hash(updateUserDto.password, 10);
    }

    if (updateUserDto.name) user.name = updateUserDto.name;
    if (updateUserDto.email) user.email = updateUserDto.email;
    if (updateUserDto.role) user.role = updateUserDto.role;
    if (updateUserDto.is_active !== undefined)
      user.is_active = updateUserDto.is_active;

    return this.userRepository.save(user);
  }
}
