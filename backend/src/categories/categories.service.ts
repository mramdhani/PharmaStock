import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  /**
   * Membuat kategori baru.
   * Melakukan validasi duplikasi nama sebelum menyimpan.
   */
  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const existing = await this.categoryRepository.findOne({
      where: { name: createCategoryDto.name },
    });

    if (existing) {
      throw new ConflictException(
        `Kategori dengan nama "${createCategoryDto.name}" sudah ada`,
      );
    }

    const category = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(category);
  }

  /**
   * Mengambil daftar kategori dengan dukungan pagination & search.
   */
  async findAll(paginationQuery: PaginationQueryDto) {
    const { page = 1, limit = 10, search, skip } = paginationQuery;

    const whereCondition = search
      ? { name: ILike(`%${search.trim()}%`) }
      : {};

    const [items, total] = await this.categoryRepository.findAndCount({
      where: whereCondition,
      order: { created_at: 'DESC' },
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
   * Mengambil detail satu kategori berdasarkan UUID.
   */
  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Kategori dengan ID "${id}" tidak ditemukan`);
    }

    return category;
  }

  /**
   * Mengupdate data kategori.
   */
  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findOne(id);

    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const duplicate = await this.categoryRepository.findOne({
        where: { name: updateCategoryDto.name },
      });

      if (duplicate) {
        throw new ConflictException(
          `Kategori dengan nama "${updateCategoryDto.name}" sudah digunakan`,
        );
      }
    }

    Object.assign(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }

  /**
   * Menghapus kategori.
   * Menolak penghapusan jika kategori masih memiliki relasi produk.
   */
  async remove(id: string): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: { products: true },
    });

    if (!category) {
      throw new NotFoundException(`Kategori dengan ID "${id}" tidak ditemukan`);
    }

    if (category.products && category.products.length > 0) {
      throw new ConflictException(
        `Tidak dapat menghapus kategori karena masih memiliki ${category.products.length} produk terkait`,
      );
    }

    await this.categoryRepository.remove(category);
  }
}
