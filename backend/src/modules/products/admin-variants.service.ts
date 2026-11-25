import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { toHttpError } from '../../common/database/database-error.js';
import { requireChanges } from '../../common/utils/require-changes.js';
import { SupabaseService } from '../../supabase/supabase.service.js';
import { CreateVariantDto, UpdateVariantDto } from './dto/product-input.dto.js';
import { AdminVariantDto } from './dto/product-response.dto.js';
import { toAdminVariant } from './product.mapper.js';
import {
  ADMIN_VARIANT_COLUMNS,
  AdminVariantRow,
  ProductStatus,
} from './product.types.js';

const CONFLICTS = {
  duplicate:
    'This SKU is already used, or the product has a variant with this name.',
  reference: 'The product does not exist.',
};

/** Uses the system client, so RLS does not apply. The controller checks the role. */
@Injectable()
export class AdminVariantsService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(
    productId: string,
    dto: CreateVariantDto,
  ): Promise<AdminVariantDto> {
    await this.getProductState(productId);

    // Stock starts at 0: a database trigger creates the inventory row.
    const { data, error } = await this.table()
      .insert({ ...toColumns(dto), product_id: productId })
      .select('id')
      .single<{ id: string }>();

    if (error) throw toHttpError(error, 'Creating variant', CONFLICTS);
    return this.findOne(productId, data.id);
  }

  async update(
    productId: string,
    id: string,
    dto: UpdateVariantDto,
  ): Promise<AdminVariantDto> {
    const changes = requireChanges(toColumns(dto));
    if (dto.isActive === false) await this.requireAnotherVariant(productId, id);

    const { data, error } = await this.table()
      .update(changes)
      .eq('id', id)
      .eq('product_id', productId)
      .select(ADMIN_VARIANT_COLUMNS)
      .maybeSingle<AdminVariantRow>();

    if (error) throw toHttpError(error, 'Updating variant', CONFLICTS);
    if (!data) throw variantMissing();
    return toAdminVariant(data);
  }

  async remove(productId: string, id: string): Promise<void> {
    await this.requireAnotherVariant(productId, id);

    const { data, error } = await this.table()
      .delete()
      .eq('id', id)
      .eq('product_id', productId)
      .select('id')
      .maybeSingle();

    if (error) throw toHttpError(error, 'Deleting variant');
    if (!data) throw variantMissing();
  }

  private async findOne(
    productId: string,
    id: string,
  ): Promise<AdminVariantDto> {
    const { data, error } = await this.table()
      .select(ADMIN_VARIANT_COLUMNS)
      .eq('id', id)
      .eq('product_id', productId)
      .maybeSingle<AdminVariantRow>();

    if (error) throw toHttpError(error, 'Reading variant');
    if (!data) throw variantMissing();
    return toAdminVariant(data);
  }

  /** A published product must keep at least one active variant. */
  private async requireAnotherVariant(productId: string, id: string) {
    const { status, variants } = await this.getProductState(productId);
    const hasAnother = variants.some(
      (variant) => variant.id !== id && variant.is_active,
    );
    if (status === 'published' && !hasAnother) {
      throw new ConflictException(
        'A published product needs an active variant. Add another one or archive the product.',
      );
    }
  }

  private async getProductState(productId: string) {
    const { data, error } = await this.supabase
      .asSystem()
      .from('products')
      .select('status, variants:product_variants (id, is_active)')
      .eq('id', productId)
      .maybeSingle<{
        status: ProductStatus;
        variants: { id: string; is_active: boolean }[];
      }>();

    if (error) throw toHttpError(error, 'Reading product');
    if (!data) throw new NotFoundException('Product not found.');
    return data;
  }

  private table() {
    return this.supabase.asSystem().from('product_variants');
  }
}

function toColumns(dto: UpdateVariantDto) {
  return {
    sku: dto.sku,
    name: dto.name,
    options: dto.options,
    price_minor: dto.priceMinor,
    is_active: dto.isActive,
    sort_order: dto.sortOrder,
  };
}

function variantMissing() {
  return new NotFoundException('Variant not found.');
}
