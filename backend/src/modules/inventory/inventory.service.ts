import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { toHttpError } from '../../common/database/database-error.js';
import { toSearchPatterns } from '../../common/database/search-pattern.js';
import { PageQueryDto } from '../../common/pagination/page-query.dto.js';
import { Page } from '../../common/pagination/page.js';
import { SupabaseService } from '../../supabase/supabase.service.js';
import {
  AdjustStockDto,
  InventoryItemDto,
  InventoryQueryDto,
  StockMovementDto,
  UpdateInventoryDto,
} from './dto/inventory.dto.js';
import {
  INVENTORY_COLUMNS,
  InventoryRow,
  MOVEMENT_COLUMNS,
  MovementRow,
} from './inventory.types.js';

// Codes raised by the database.
const BELOW_ZERO = '23514';
const VARIANT_MISSING = 'P0002';
const PAGE_OUT_OF_RANGE = 'PGRST103';

/** Uses the system client, so RLS does not apply. The controller checks the role. */
@Injectable()
export class InventoryService {
  constructor(private readonly supabase: SupabaseService) {}

  async search(query: InventoryQueryDto): Promise<Page<InventoryItemDto>> {
    const { from, to } = range(query);
    const { data, count, error } = await this.filtered(query, false)
      .order('product_name')
      .order('variant_name')
      .order('variant_id')
      .range(from, to)
      .returns<InventoryRow[]>();

    if (error?.code === PAGE_OUT_OF_RANGE) {
      const total = await this.filtered(query, true);
      if (total.error) throw toHttpError(total.error, 'Counting inventory');
      return new Page<InventoryItemDto>([], total.count ?? 0, query);
    }
    if (error) throw toHttpError(error, 'Reading inventory');
    return new Page(data.map(toItem), count ?? 0, query);
  }

  async findOne(variantId: string): Promise<InventoryItemDto> {
    const { data, error } = await this.database()
      .from('inventory_overview')
      .select(INVENTORY_COLUMNS)
      .eq('variant_id', variantId)
      .maybeSingle<InventoryRow>();

    if (error) throw toHttpError(error, 'Reading inventory');
    if (!data) throw variantMissing();
    return toItem(data);
  }

  /** The database function changes the stock and records it, both or neither. */
  async adjust(
    variantId: string,
    dto: AdjustStockDto,
    userId: string,
  ): Promise<InventoryItemDto> {
    const { error } = await this.database().rpc('adjust_stock', {
      p_variant_id: variantId,
      p_change: dto.change,
      p_reason: dto.reason,
      p_note: dto.note ?? null,
      p_user_id: userId,
    });

    if (error?.code === VARIANT_MISSING) throw variantMissing();
    if (error?.code === BELOW_ZERO) {
      throw new ConflictException('There is not enough stock to remove that.');
    }
    if (error) throw toHttpError(error, 'Adjusting stock');
    return this.findOne(variantId);
  }

  async update(
    variantId: string,
    dto: UpdateInventoryDto,
  ): Promise<InventoryItemDto> {
    const { data, error } = await this.database()
      .from('inventory')
      .update({ low_stock_threshold: dto.lowStockThreshold })
      .eq('variant_id', variantId)
      .select('variant_id')
      .maybeSingle();

    if (error) throw toHttpError(error, 'Updating inventory');
    if (!data) throw variantMissing();
    return this.findOne(variantId);
  }

  async findMovements(
    variantId: string,
    query: PageQueryDto,
  ): Promise<Page<StockMovementDto>> {
    await this.findOne(variantId);

    const { from, to } = range(query);
    const { data, count, error } = await this.movements(variantId, false)
      .order('created_at', { ascending: false })
      .order('id')
      .range(from, to)
      .returns<MovementRow[]>();

    if (error?.code === PAGE_OUT_OF_RANGE) {
      const total = await this.movements(variantId, true);
      if (total.error) throw toHttpError(total.error, 'Counting history');
      return new Page<StockMovementDto>([], total.count ?? 0, query);
    }
    if (error) throw toHttpError(error, 'Reading stock history');

    const names = await this.findNames(data);
    return new Page(
      data.map((row) => toMovement(row, names)),
      count ?? 0,
      query,
    );
  }

  private async findNames(rows: MovementRow[]): Promise<Map<string, string>> {
    const ids = [...new Set(rows.flatMap((row) => row.created_by ?? []))];
    if (ids.length === 0) return new Map();

    const { data, error } = await this.database()
      .from('profiles')
      .select('id, full_name')
      .in('id', ids)
      .returns<{ id: string; full_name: string | null }[]>();

    if (error) throw toHttpError(error, 'Reading names');
    return new Map(data.map((row) => [row.id, row.full_name ?? 'Unnamed']));
  }

  private filtered(query: InventoryQueryDto, head: boolean) {
    let filter = this.database()
      .from('inventory_overview')
      .select(INVENTORY_COLUMNS, { count: 'exact', head });
    if (query.low !== undefined) filter = filter.eq('is_low', query.low);
    for (const pattern of toSearchPatterns(query.search ?? '')) {
      filter = filter.ilike('search_text', pattern);
    }
    return filter;
  }

  private movements(variantId: string, head: boolean) {
    return this.database()
      .from('stock_movements')
      .select(MOVEMENT_COLUMNS, { count: 'exact', head })
      .eq('variant_id', variantId);
  }

  private database() {
    return this.supabase.asSystem();
  }
}

function range({ page, limit }: PageQueryDto) {
  const from = (page - 1) * limit;
  return { from, to: from + limit - 1 };
}

function toItem(row: InventoryRow): InventoryItemDto {
  return {
    variantId: row.variant_id,
    sku: row.sku,
    variantName: row.variant_name,
    isActive: row.is_active,
    productId: row.product_id,
    productName: row.product_name,
    productStatus: row.product_status,
    quantity: row.quantity,
    lowStockThreshold: row.low_stock_threshold,
    isLow: row.is_low,
  };
}

function toMovement(
  row: MovementRow,
  names: Map<string, string>,
): StockMovementDto {
  return {
    id: row.id,
    change: row.change,
    quantityAfter: row.quantity_after,
    reason: row.reason,
    note: row.note,
    createdByName: row.created_by ? (names.get(row.created_by) ?? null) : null,
    createdAt: row.created_at,
  };
}

function variantMissing() {
  return new NotFoundException('Variant not found.');
}
