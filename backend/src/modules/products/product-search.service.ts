import { Injectable } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import { toHttpError } from '../../common/database/database-error.js';
import {
  escapeLike,
  toSearchPatterns,
} from '../../common/database/search-pattern.js';
import {
  AdminProductQueryDto,
  ProductSort,
  PublicProductQueryDto,
} from './dto/product-query.dto.js';
import { SUMMARY_COLUMNS, SummaryRow } from './product.types.js';

const SORT_COLUMNS: Record<
  ProductSort,
  { column: string; ascending: boolean }
> = {
  newest: { column: 'created_at', ascending: false },
  price_asc: { column: 'min_price_minor', ascending: true },
  price_desc: { column: 'min_price_minor', ascending: false },
  name_asc: { column: 'name', ascending: true },
};

// The requested page lies after the last one.
const PAGE_OUT_OF_RANGE = 'PGRST103';

export type SearchFilters = Partial<PublicProductQueryDto> &
  Partial<AdminProductQueryDto> & {
    page: number;
    limit: number;
    sort: ProductSort;
  };

interface SearchResult {
  rows: SummaryRow[];
  total: number;
}

/** Searches the product_summaries view. Shared by the storefront and the admin list. */
@Injectable()
export class ProductSearchService {
  async search(
    client: SupabaseClient,
    filters: SearchFilters,
    { requireVariant = false } = {},
  ): Promise<SearchResult> {
    const from = (filters.page - 1) * filters.limit;
    const { column, ascending } = SORT_COLUMNS[filters.sort];

    const { data, count, error } = await this.filtered(
      client,
      filters,
      requireVariant,
      false,
    )
      .order(column, { ascending, nullsFirst: false })
      // Keeps pages stable when several products share the same value.
      .order('id')
      .range(from, from + filters.limit - 1)
      .returns<SummaryRow[]>();

    if (error?.code === PAGE_OUT_OF_RANGE) {
      return {
        rows: [],
        total: await this.count(client, filters, requireVariant),
      };
    }
    if (error) throw toHttpError(error, 'Searching products');
    return { rows: data, total: count ?? 0 };
  }

  private async count(
    client: SupabaseClient,
    filters: SearchFilters,
    requireVariant: boolean,
  ): Promise<number> {
    const { count, error } = await this.filtered(
      client,
      filters,
      requireVariant,
      true,
    );
    if (error) throw toHttpError(error, 'Counting products');
    return count ?? 0;
  }

  private filtered(
    client: SupabaseClient,
    filters: SearchFilters,
    requireVariant: boolean,
    head: boolean,
  ) {
    let query = client
      .from('product_summaries')
      .select(SUMMARY_COLUMNS, { count: 'exact', head });

    if (requireVariant) query = query.not('min_price_minor', 'is', null);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.category) query = query.eq('category_slug', filters.category);
    // ILIKE without wildcards: "nikon" and "Nikon" match, but "Nik" does not.
    if (filters.brand) query = query.ilike('brand', escapeLike(filters.brand));
    if (filters.inStock !== undefined) {
      query = query.eq('is_in_stock', filters.inStock);
    }
    // A product matches when its price range overlaps the requested range.
    if (filters.minPrice !== undefined) {
      query = query.gte('max_price_minor', filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      query = query.lte('min_price_minor', filters.maxPrice);
    }
    for (const pattern of toSearchPatterns(filters.search ?? '')) {
      query = query.ilike('search_text', pattern);
    }
    return query;
  }
}
