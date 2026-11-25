import type { ProductStatus } from '../products/product.types.js';

export const STOCK_CHANGE_REASONS = [
  'received',
  'returned',
  'damaged',
  'correction',
] as const;
export type StockChangeReason = (typeof STOCK_CHANGE_REASONS)[number];

export interface InventoryRow {
  variant_id: string;
  sku: string;
  variant_name: string;
  is_active: boolean;
  product_id: string;
  product_name: string;
  product_status: ProductStatus;
  quantity: number;
  low_stock_threshold: number;
  is_low: boolean;
}

export const INVENTORY_COLUMNS =
  'variant_id, sku, variant_name, is_active, product_id, product_name, ' +
  'product_status, quantity, low_stock_threshold, is_low';

export interface MovementRow {
  id: string;
  change: number;
  quantity_after: number;
  reason: StockChangeReason;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

export const MOVEMENT_COLUMNS =
  'id, change, quantity_after, reason, note, created_by, created_at';
