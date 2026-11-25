import {
  AdminProductDetailDto,
  AdminProductSummaryDto,
  AdminVariantDto,
  ProductDetailDto,
  ProductSummaryDto,
} from './dto/product-response.dto.js';
import {
  AdminProductRow,
  AdminVariantRow,
  CURRENCY,
  ProductRow,
  SummaryRow,
  VariantRow,
} from './product.types.js';

/** Turns a path inside the image bucket into a web address. */
export type ImageUrl = (path: string) => string;

export function toSummary(
  row: SummaryRow,
  imageUrl: ImageUrl,
): ProductSummaryDto {
  return summaryFields(row, imageUrl);
}

export function toAdminSummary(
  row: SummaryRow,
  imageUrl: ImageUrl,
): AdminProductSummaryDto {
  return { ...summaryFields(row, imageUrl), status: row.status };
}

function summaryFields(row: SummaryRow, imageUrl: ImageUrl) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    brand: row.brand,
    currency: CURRENCY,
    category: {
      id: row.category_id,
      name: row.category_name,
      slug: row.category_slug,
    },
    minPriceMinor: row.min_price_minor,
    maxPriceMinor: row.max_price_minor,
    isInStock: row.is_in_stock,
    image: row.image_path
      ? { url: imageUrl(row.image_path), alt: row.image_alt ?? row.name }
      : null,
  };
}

export function toDetail(
  row: ProductRow,
  imageUrl: ImageUrl,
): ProductDetailDto {
  return {
    ...detailFields(row, imageUrl),
    variants: bySortOrder(row.variants).map(variantFields),
  };
}

export function toAdminDetail(
  row: AdminProductRow,
  imageUrl: ImageUrl,
): AdminProductDetailDto {
  return {
    ...detailFields(row, imageUrl),
    status: row.status,
    variants: bySortOrder(row.variants).map(toAdminVariant),
  };
}

export function toAdminVariant(row: AdminVariantRow): AdminVariantDto {
  return {
    ...variantFields(row),
    isActive: row.is_active,
    sortOrder: row.sort_order,
    quantity: row.inventory.quantity,
    lowStockThreshold: row.inventory.low_stock_threshold,
  };
}

function variantFields(row: VariantRow) {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    options: row.options,
    priceMinor: row.price_minor,
    isInStock: row.is_in_stock,
  };
}

function detailFields(row: ProductRow, imageUrl: ImageUrl) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    brand: row.brand,
    currency: CURRENCY,
    category: row.category,
    description: row.description,
    specifications: row.specifications,
    images: bySortOrder(row.images).map((image) => ({
      id: image.id,
      url: imageUrl(image.storage_path),
      alt: image.alt_text,
      credit: image.credit,
      license: image.license,
      sourceUrl: image.source_url,
    })),
  };
}

function bySortOrder<T extends { id: string; sort_order: number }>(
  rows: T[],
): T[] {
  return rows.toSorted(
    (a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id),
  );
}
