import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Batch } from '../batches/entities/batch.entity';
import { Category } from '../categories/entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { StockMovement } from '../stock/entities/stock-movement.entity';

export interface DashboardSummaryResponse {
  kpi: {
    total_products: number;
    total_categories: number;
    total_stock_units: number;
    low_stock_products_count: number;
    expiring_batches_count: number;
    expired_batches_count: number;
  };
  chart_data_7_days: Array<{
    date: string;
    stock_in: number;
    stock_out: number;
  }>;
  recent_movements: Array<{
    id: string;
    type: string;
    quantity: number;
    reference_no: string | null;
    notes: string | null;
    created_at: Date;
    product_name: string;
    product_sku: string;
    batch_number: string;
    user_name: string;
  }>;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Batch)
    private readonly batchRepository: Repository<Batch>,
    @InjectRepository(StockMovement)
    private readonly stockMovementRepository: Repository<StockMovement>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async getSummary(): Promise<DashboardSummaryResponse> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const in30Days = new Date(today);
    in30Days.setDate(in30Days.getDate() + 30);

    const todayStr = today.toISOString().split('T')[0];
    const in30DaysStr = in30Days.toISOString().split('T')[0];

    // Eksekusi agregasi metrik KPI secara paralel
    const [
      totalProducts,
      totalCategories,
      totalStockUnitsRaw,
      lowStockCountRaw,
      expiringBatchesCount,
      expiredBatchesCount,
      recentMovementsData,
      chartAggRaw,
    ] = await Promise.all([
      // 1. Total Produk Aktif
      this.productRepository.count({ where: { is_active: true } }),

      // 2. Total Kategori
      this.categoryRepository.count(),

      // 3. Total Fisik Stok Seluruh Batch
      this.batchRepository
        .createQueryBuilder('batch')
        .select('COALESCE(SUM(batch.current_stock), 0)', 'total')
        .getRawOne<{ total: string }>(),

      // 4. Jumlah Produk Menipis (Stok <= Minimum Stock)
      this.productRepository.query(`
        SELECT COUNT(*)::int as count
        FROM (
          SELECT p.id
          FROM products p
          LEFT JOIN batches b ON b.product_id = p.id
          WHERE p.is_active = true
          GROUP BY p.id, p.minimum_stock
          HAVING COALESCE(SUM(b.current_stock), 0) <= p.minimum_stock
        ) sub
      `),

      // 5. Batch Mendekati Kedaluwarsa (<= 30 hari ke depan dan ada sisa stok)
      this.batchRepository
        .createQueryBuilder('batch')
        .where('batch.current_stock > 0')
        .andWhere('batch.expiry_date >= :today', { today: todayStr })
        .andWhere('batch.expiry_date <= :in30Days', { in30Days: in30DaysStr })
        .getCount(),

      // 6. Batch Sudah Kedaluwarsa (Expired) yang masih tersisa stok
      this.batchRepository
        .createQueryBuilder('batch')
        .where('batch.current_stock > 0')
        .andWhere('batch.expiry_date < :today', { today: todayStr })
        .getCount(),

      // 7. 5 Transaksi Terakhir
      this.stockMovementRepository.find({
        relations: {
          batch: { product: true },
          user: true,
        },
        order: { created_at: 'DESC' },
        take: 5,
      }),

      // 8. Agregasi Mutasi Stok 7 Hari Terakhir
      this.stockMovementRepository.query(`
        SELECT 
          TO_CHAR(sm.created_at, 'YYYY-MM-DD') as date,
          COALESCE(SUM(CASE WHEN sm.type = 'IN' THEN sm.quantity ELSE 0 END), 0)::int as in_qty,
          COALESCE(SUM(CASE WHEN sm.type = 'OUT' THEN sm.quantity ELSE 0 END), 0)::int as out_qty
        FROM stock_movements sm
        WHERE sm.created_at >= CURRENT_DATE - INTERVAL '6 days'
        GROUP BY TO_CHAR(sm.created_at, 'YYYY-MM-DD')
        ORDER BY date ASC
      `),
    ]);

    // Format 7-hari kontigu agar grafik di Next.js rapi meskipun ada hari kosong
    const chartMap = new Map<string, { stock_in: number; stock_out: number }>();
    if (Array.isArray(chartAggRaw)) {
      for (const row of chartAggRaw) {
        chartMap.set(row.date, {
          stock_in: Number(row.in_qty) || 0,
          stock_out: Number(row.out_qty) || 0,
        });
      }
    }

    const chartData7Days: Array<{ date: string; stock_in: number; stock_out: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const entry = chartMap.get(dStr) || { stock_in: 0, stock_out: 0 };
      chartData7Days.push({
        date: dStr,
        stock_in: entry.stock_in,
        stock_out: entry.stock_out,
      });
    }

    // Format mutasi terbaru
    const recentMovements = recentMovementsData.map((m) => ({
      id: m.id,
      type: m.type,
      quantity: m.quantity,
      reference_no: m.reference_no,
      notes: m.notes,
      created_at: m.created_at,
      product_name: m.batch?.product?.name ?? 'Unknown',
      product_sku: m.batch?.product?.sku ?? 'Unknown',
      batch_number: m.batch?.batch_number ?? 'Unknown',
      user_name: m.user?.name ?? 'System',
    }));

    const totalStockUnits = Number(totalStockUnitsRaw?.total || 0);
    const lowStockProductsCount = Number(lowStockCountRaw?.[0]?.count || 0);

    return {
      kpi: {
        total_products: totalProducts,
        total_categories: totalCategories,
        total_stock_units: totalStockUnits,
        low_stock_products_count: lowStockProductsCount,
        expiring_batches_count: expiringBatchesCount,
        expired_batches_count: expiredBatchesCount,
      },
      chart_data_7_days: chartData7Days,
      recent_movements: recentMovements,
    };
  }
}
