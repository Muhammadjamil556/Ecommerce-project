export const PRODUCT_STATUSES = ['draft', 'published', 'archived'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const CURRENCY = 'PKR';
export const IMAGE_BUCKET = 'product-images';

// Database rows, as selected below.

export interface SummaryRow {
  id: string;
  name: string;
  slug: string;
  brand: string;
  status: ProductStatus;
  category_id: string;
  category_name: string;
  category_slug: string;
  min_price_minor: number | null;
  max_price_minor: number | null;
  is_in_stock: boolean;
  image_path: string | null;
  image_alt: string | null;
}

export const SUMMARY_COLUMNS =
  'id, name, slug, brand, status, category_id, category_name, category_slug, ' +
  'min_price_minor, max_price_minor, is_in_stock, image_path, image_alt';

export interface VariantRow {
  id: string;
  sku: string;
  name: string;
  options: Record<string, string>;
  price_minor: number;
  is_active: boolean;
  is_in_stock: boolean;
  sort_order: number;
}

export const VARIANT_COLUMNS =
  'id, sku, name, options, price_minor, is_active, is_in_stock, sort_order';

export interface ImageRow {
  id: string;
  storage_path: string;
  alt_text: string;
  credit: string;
  license: string;
  source_url: string | null;
  width: number;
  height: number;
  sort_order: number;
}

export const IMAGE_COLUMNS =
  'id, storage_path, alt_text, credit, license, source_url, width, height, sort_order';

export interface ProductRow {
  id: string;
  name: string;
  slug: string;
  brand: string;
  description: string;
  specifications: Record<string, string>;
  status: ProductStatus;
  category: { id: string; name: string; slug: string };
  variants: VariantRow[];
  images: ImageRow[];
}

const PRODUCT_COLUMNS =
  'id, name, slug, brand, description, specifications, status, ' +
  'category:categories (id, name, slug), ' +
  `images:product_images (${IMAGE_COLUMNS})`;

export const PUBLIC_PRODUCT_COLUMNS = `${PRODUCT_COLUMNS}, variants:product_variants (${VARIANT_COLUMNS})`;

export interface AdminVariantRow extends VariantRow {
  inventory: { quantity: number; low_stock_threshold: number };
}

export interface AdminProductRow extends ProductRow {
  variants: AdminVariantRow[];
}

export const ADMIN_VARIANT_COLUMNS = `${VARIANT_COLUMNS}, inventory (quantity, low_stock_threshold)`;
export const ADMIN_PRODUCT_COLUMNS = `${PRODUCT_COLUMNS}, variants:product_variants (${ADMIN_VARIANT_COLUMNS})`;
