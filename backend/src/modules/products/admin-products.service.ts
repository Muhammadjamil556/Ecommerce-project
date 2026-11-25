import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { toHttpError } from '../../common/database/database-error.js';
import { Page } from '../../common/pagination/page.js';
import { requireChanges } from '../../common/utils/require-changes.js';
import { slugify } from '../../common/utils/slugify.js';
import { SupabaseService } from '../../supabase/supabase.service.js';
import { CreateProductDto, UpdateProductDto } from './dto/product-input.dto.js';
import { AdminProductQueryDto } from './dto/product-query.dto.js';
import {
  AdminProductDetailDto,
  AdminProductSummaryDto,
} from './dto/product-response.dto.js';
import { ProductSearchService } from './product-search.service.js';
import { toAdminDetail, toAdminSummary } from './product.mapper.js';
import {
  ADMIN_PRODUCT_COLUMNS,
  AdminProductRow,
  IMAGE_BUCKET,
} from './product.types.js';

const CONFLICTS = {
  duplicate: 'Another product already uses this slug.',
  reference: 'The category does not exist.',
};

/** Uses the system client, so RLS does not apply. The controller checks the role. */
@Injectable()
export class AdminProductsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly productSearch: ProductSearchService,
  ) {}

  async search(
    query: AdminProductQueryDto,
  ): Promise<Page<AdminProductSummaryDto>> {
    const { rows, total } = await this.productSearch.search(
      this.supabase.asSystem(),
      query,
    );
    return new Page(
      rows.map((row) => toAdminSummary(row, this.imageUrl)),
      total,
      query,
    );
  }

  async findOne(id: string): Promise<AdminProductDetailDto> {
    return toAdminDetail(await this.getRow(id), this.imageUrl);
  }

  /** New products start as drafts, so customers never see half-finished ones. */
  async create(dto: CreateProductDto): Promise<AdminProductDetailDto> {
    const slug = dto.slug ?? slugify(dto.name);
    if (!slug) throw new BadRequestException('Please provide a slug.');

    const { data, error } = await this.table()
      .insert({ ...toColumns(dto), slug })
      .select(ADMIN_PRODUCT_COLUMNS)
      .single<AdminProductRow>();

    if (error) throw toHttpError(error, 'Creating product', CONFLICTS);
    return toAdminDetail(data, this.imageUrl);
  }

  async update(
    id: string,
    dto: UpdateProductDto,
  ): Promise<AdminProductDetailDto> {
    const changes = requireChanges(toColumns(dto));

    if (dto.status === 'published') {
      const { variants } = await this.getRow(id);
      if (!variants.some((variant) => variant.is_active)) {
        throw new ConflictException('Add an active variant before publishing.');
      }
    }

    const { data, error } = await this.table()
      .update(changes)
      .eq('id', id)
      .select(ADMIN_PRODUCT_COLUMNS)
      .maybeSingle<AdminProductRow>();

    if (error) throw toHttpError(error, 'Updating product', CONFLICTS);
    if (!data) throw productMissing();
    return toAdminDetail(data, this.imageUrl);
  }

  /** Only drafts. Anything customers have seen is archived instead. */
  async remove(id: string): Promise<void> {
    // The status is part of the delete, so it cannot be published in between.
    const { data, error } = await this.table()
      .delete()
      .eq('id', id)
      .eq('status', 'draft')
      .select('id')
      .maybeSingle();

    if (error) throw toHttpError(error, 'Deleting product');
    if (!data) {
      await this.getRow(id);
      throw new ConflictException(
        'Only drafts can be deleted. Archive it instead.',
      );
    }
  }

  private async getRow(id: string): Promise<AdminProductRow> {
    const { data, error } = await this.table()
      .select(ADMIN_PRODUCT_COLUMNS)
      .eq('id', id)
      .maybeSingle<AdminProductRow>();

    if (error) throw toHttpError(error, 'Reading product');
    if (!data) throw productMissing();
    return data;
  }

  private table() {
    return this.supabase.asSystem().from('products');
  }

  private readonly imageUrl = (path: string): string =>
    this.supabase.asSystem().storage.from(IMAGE_BUCKET).getPublicUrl(path).data
      .publicUrl;
}

function toColumns(dto: UpdateProductDto) {
  return {
    category_id: dto.categoryId,
    name: dto.name,
    slug: dto.slug,
    brand: dto.brand,
    description: dto.description,
    specifications: dto.specifications,
    status: dto.status,
  };
}

function productMissing() {
  return new NotFoundException('Product not found.');
}
