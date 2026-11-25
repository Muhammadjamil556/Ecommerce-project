/**
 * Adds the products in catalog.json to the development database.
 * Safe to run again: anything that already exists is left unchanged.
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

interface Catalog {
  categories: { name: string; slug: string; sort_order: number }[];
  products: {
    category: string;
    brand: string;
    name: string;
    slug: string;
    description: string;
    specifications: Record<string, string>;
    variants: {
      sku: string;
      name: string;
      options: Record<string, string>;
      price_minor: number;
      stock: number;
    }[];
  }[];
}

const { NODE_ENV, SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (NODE_ENV === 'production') {
  throw new Error('The seed script must not run against production.');
}
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY?.startsWith('sb_secret_')) {
  throw new Error('Set SUPABASE_URL and SUPABASE_SECRET_KEY in backend/.env.');
}

const catalog = JSON.parse(
  readFileSync(new URL('catalog.json', import.meta.url), 'utf8'),
) as Catalog;
const database = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type Row = Record<string, unknown>;

/** Returns the ID of the row with this unique value, or null. */
async function findId(
  table: string,
  column: string,
  value: string,
): Promise<string | null> {
  const { data, error } = await database
    .from(table)
    .select('id')
    .eq(column, value)
    .maybeSingle<{ id: string }>();
  if (error) throw new Error(`Reading ${table} failed: ${error.message}`);
  return data?.id ?? null;
}

async function insert(table: string, row: Row): Promise<string> {
  const { data, error } = await database
    .from(table)
    .insert(row)
    .select('id')
    .single<{ id: string }>();
  if (error) throw new Error(`Adding to ${table} failed: ${error.message}`);
  return data.id;
}

/** Goes through the stock function, so the history is complete. */
async function addStock(variantId: string, quantity: number) {
  if (quantity === 0) return;
  const { error } = await database.rpc('adjust_stock', {
    p_variant_id: variantId,
    p_change: quantity,
    p_reason: 'received',
    p_note: 'Sample data',
  });
  if (error) throw new Error(`Adding stock failed: ${error.message}`);
}

async function publish(productId: string) {
  const { data, error } = await database
    .from('products')
    .update({ status: 'published' })
    .eq('id', productId)
    .select('id');
  if (error) throw new Error(`Publishing failed: ${error.message}`);
  if (data.length !== 1) throw new Error('Publishing changed no row.');
}

async function seedProduct(
  product: Catalog['products'][number],
  categoryId: string,
): Promise<boolean> {
  if (await findId('products', 'slug', product.slug)) return false;

  const { variants, category: _category, ...columns } = product;
  const productId = await insert('products', {
    ...columns,
    category_id: categoryId,
  });

  try {
    for (const [index, { stock, ...variant }] of variants.entries()) {
      const variantId = await insert('product_variants', {
        ...variant,
        product_id: productId,
        sort_order: index,
      });
      await addStock(variantId, stock);
    }
    // Published last, so a failure never leaves a half-finished product on sale.
    await publish(productId);
  } catch (error) {
    // Removes the unfinished draft, so the next run can start over.
    await database.from('products').delete().eq('id', productId);
    throw error;
  }
  return true;
}

const categoryIds = new Map<string, string>();
for (const category of catalog.categories) {
  const id =
    (await findId('categories', 'slug', category.slug)) ??
    (await insert('categories', category));
  categoryIds.set(category.slug, id);
}

let added = 0;
for (const product of catalog.products) {
  const categoryId = categoryIds.get(product.category);
  if (!categoryId) throw new Error(`Unknown category: ${product.category}`);
  if (await seedProduct(product, categoryId)) added += 1;
}

console.log(
  `Added ${added} products. ${catalog.products.length - added} already existed.`,
);
console.log('Prices and stock are placeholders. Replace them before launch.');
