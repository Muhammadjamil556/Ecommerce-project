import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { toHttpError } from '../../common/database/database-error.js';
import { Page } from '../../common/pagination/page.js';
import { SupabaseService } from '../../supabase/supabase.service.js';
import { PublicProductQueryDto } from './dto/product-query.dto.js';
import {
  ProductDetailDto,
  ProductSummaryDto,
} from './dto/product-response.dto.js';
import { ProductSearchService } from './product-search.service.js';
import { toDetail, toSummary } from './product.mapper.js';
import {
  IMAGE_BUCKET,
  PUBLIC_PRODUCT_COLUMNS,
  ProductRow,
} from './product.types.js';

/** The public catalog. Row Level Security hides everything that is not published. */
@Injectable()
export class ProductsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly productSearch: ProductSearchService,
  ) {}

  async search(query: PublicProductQueryDto): Promise<Page<ProductSummaryDto>> {
    const { minPrice, maxPrice } = query;
    if (
      minPrice !== undefined &&
      maxPrice !== undefined &&
      minPrice > maxPrice
    ) {
      throw new BadRequestException('minPrice must not be above maxPrice.');
    }

    const { rows, total } = await this.productSearch.search(
      this.supabase.asVisitor(),
      query,
      { requireVariant: true },
    );
    return new Page(
      rows.map((row) => toSummary(row, this.imageUrl)),
      total,
      query,
    );
  }

  async findBySlug(slug: string): Promise<ProductDetailDto> {
    const { data, error } = await this.supabase
      .asVisitor()
      .from('products')
      .select(PUBLIC_PRODUCT_COLUMNS)
      .eq('slug', slug)
      .maybeSingle<ProductRow>();

    if (error) throw toHttpError(error, 'Reading product');
    // Without an active variant there is nothing to buy.
    if (!data || data.variants.length === 0) {
      throw new NotFoundException('Product not found.');
    }
    return toDetail(data, this.imageUrl);
  }

  private readonly imageUrl = (path: string): string =>
    this.supabase.asVisitor().storage.from(IMAGE_BUCKET).getPublicUrl(path).data
      .publicUrl;
}
