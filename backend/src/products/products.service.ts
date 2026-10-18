import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../categories/entities/category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  /**
   * Membuat produk baru.
   * Memvalidasi keberadaan kategori dan keunikan kode SKU.
   */
  async create(createProductDto: CreateProductDto): Promise<Product> {
    // 1. Validasi keberadaan kategori
    const category = await this.categoryRepository.findOne({
      where: { id: createProductDto.category_id },
    });

    if (!category) {
      throw new NotFoundException(
        `Kategori dengan ID "${createProductDto.category_id}" tidak ditemukan`,
      );
    }

    // 2. Validasi keunikan SKU
    const existingSku = await this.productRepository.findOne({
      where: { sku: createProductDto.sku },
    });

    if (existingSku) {
      throw new ConflictException(
        `Produk dengan SKU "${createProductDto.sku}" sudah terdaftar`,
      );
    }

    // 3. Simpan produk
    const product = this.productRepository.create(createProductDto);
    const saved = await this.productRepository.save(product);

    // Kembalikan produk dengan relasi kategorinya
    return this.findOne(saved.id);
  }

  /**
   * Mengambil daftar produk dengan filter search, kategori, status aktif,
   * pagination, serta kalkulasi total stok dari seluruh batch.
   */
  async findAll(query: ProductQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      category_id,
      is_active,
      low_stock,
      skip,
    } = query;

    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.batches', 'batches')
      .orderBy('product.created_at', 'DESC');

    if (search) {
      qb.andWhere(
        '(product.name ILIKE :search OR product.sku ILIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }

    if (category_id) {
      qb.andWhere('product.category_id = :categoryId', {
        categoryId: category_id,
      });
    }

    if (is_active !== undefined) {
      qb.andWhere('product.is_active = :isActive', { isActive: is_active });
    }

    const [products, total] = await qb.skip(skip).take(limit).getManyAndCount();

    // Hitung total saldo stok dari seluruh batch produk
    const items = products.map((product) => {
      const totalStock = (product.batches || []).reduce(
        (sum, batch) => sum + (batch.current_stock || 0),
        0,
      );
      return {
        ...product,
        total_stock: totalStock,
        is_low_stock: totalStock <= product.minimum_stock,
      };
    });

    // Filter tambahan jika user meminta produk dengan stok menipis saja
    const finalItems = low_stock
      ? items.filter((item) => item.is_low_stock)
      : items;

    return {
      items: finalItems,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mengambil detail satu produk lengkap beserta kategori
   * dan daftar batch yang diurutkan tanggal kedaluwarsa (FEFO).
   */
  async findOne(id: string): Promise<Product & { total_stock: number; is_low_stock: boolean }> {
    const product = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.batches', 'batches')
      .where('product.id = :id', { id })
      .orderBy('batches.expiry_date', 'ASC') // Urutan FEFO
      .getOne();

    if (!product) {
      throw new NotFoundException(`Produk dengan ID "${id}" tidak ditemukan`);
    }

    const totalStock = (product.batches || []).reduce(
      (sum, batch) => sum + (batch.current_stock || 0),
      0,
    );

    return {
      ...product,
      total_stock: totalStock,
      is_low_stock: totalStock <= product.minimum_stock,
    };
  }

  /**
   * Memperbarui data produk.
   */
  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

    // Cek duplikasi SKU jika SKU diubah
    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const duplicateSku = await this.productRepository.findOne({
        where: { sku: updateProductDto.sku },
      });

      if (duplicateSku) {
        throw new ConflictException(
          `Produk dengan SKU "${updateProductDto.sku}" sudah digunakan`,
        );
      }
    }

    // Cek keberadaan kategori jika kategori diubah
    if (
      updateProductDto.category_id &&
      updateProductDto.category_id !== product.category_id
    ) {
      const category = await this.categoryRepository.findOne({
        where: { id: updateProductDto.category_id },
      });

      if (!category) {
        throw new NotFoundException(
          `Kategori dengan ID "${updateProductDto.category_id}" tidak ditemukan`,
        );
      }
    }

    // Hindari menimpa properti virtual kalkulasi
    const { total_stock, is_low_stock, ...entityData } = product;
    Object.assign(entityData, updateProductDto);
    await this.productRepository.save(entityData);

    return this.findOne(id);
  }

  /**
   * Menghapus atau menonaktifkan produk:
   * - Jika sudah memiliki riwayat batch -> dinonaktifkan (is_active = false)
   * - Jika belum ada batch sama sekali -> dihapus permanen
   */
  async remove(id: string): Promise<{ action: 'deactivated' | 'deleted'; message: string }> {
    const product = await this.findOne(id);

    if (product.batches && product.batches.length > 0) {
      // Soft deactivate sesuai prinsip blueprint
      product.is_active = false;
      const { total_stock, is_low_stock, ...entityData } = product;
      await this.productRepository.save(entityData);
      return {
        action: 'deactivated',
        message: 'Produk memiliki riwayat batch sehingga dinonaktifkan (is_active = false)',
      };
    }

    const { total_stock, is_low_stock, ...entityData } = product;
    await this.productRepository.remove(entityData as Product);
    return {
      action: 'deleted',
      message: 'Produk berhasil dihapus permanen karena belum memiliki riwayat batch',
    };
  }
}
