import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { createClient } from '@supabase/supabase-js';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/config/configure-app.js';
import { validateEnv } from '../src/config/env.validation.js';

if (process.env.NODE_ENV === 'production') {
  throw new Error('Database tests must not run against production.');
}

const env = validateEnv(process.env);
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const publicClient = () =>
  createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, options);

type Method = 'get' | 'post' | 'patch' | 'delete';

// The tests follow one product through its life, so they run in order.
describe('Catalog API with the real Supabase project', () => {
  const system = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SECRET_KEY,
    options,
  );
  const run = randomUUID();
  const key = `db-test-${run}`;
  const sku = `DBTEST-${run.toUpperCase()}`;
  let app: INestApplication<App>;
  let userId: string;
  let token: string;
  let categoryId: string;
  let productId: string;
  let bodyId: string;
  let kitId: string;

  function admin(method: Method, path: string) {
    return request(app.getHttpServer())
      [method](`/api/v1/admin${path}`)
      .set('Authorization', `Bearer ${token}`);
  }

  function visitor(path: string) {
    return request(app.getHttpServer()).get(`/api/v1${path}`);
  }

  async function find(query: string): Promise<string[]> {
    const response = await visitor(`/products?category=${key}&${query}`).expect(
      200,
    );
    return response.body.data.map((item: { slug: string }) => item.slug);
  }

  async function directRead() {
    const client = publicClient();
    const [products, variants, summaries] = await Promise.all([
      client.from('products').select('id').eq('id', productId),
      client.from('product_variants').select('id').eq('product_id', productId),
      client.from('product_summaries').select('id').eq('id', productId),
    ]);
    return [products, variants, summaries].map((result) => {
      expect(result.error).toBeNull();
      return result.data?.length;
    });
  }

  beforeAll(async () => {
    const email = `${key}@example.com`;
    const password = `Aa1!${randomUUID()}`;
    const created = await system.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (created.error) throw created.error;
    userId = created.data.user.id;
    const promoted = await system
      .from('user_roles')
      .update({ role: 'admin' })
      .eq('user_id', userId);
    if (promoted.error) throw promoted.error;

    const login = await publicClient().auth.signInWithPassword({
      email,
      password,
    });
    if (login.error) throw login.error;
    token = login.data.session.access_token;

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();
  });

  // Deletes only what this run created: its slugs contain a random ID.
  afterAll(async () => {
    await app?.close();
    const products = await system
      .from('products')
      .delete()
      .like('slug', `${key}%`);
    const categories = await system
      .from('categories')
      .delete()
      .like('slug', `${key}%`);
    const user = userId
      ? await system.auth.admin.deleteUser(userId)
      : { error: null };
    const error = products.error ?? categories.error ?? user.error;
    if (error) throw error;
  });

  it('creates a category, and refuses the same slug twice', async () => {
    const body = { name: 'Test category', slug: key };
    const response = await admin('post', '/categories').send(body).expect(201);
    categoryId = response.body.data.id;

    const repeat = await admin('post', '/categories').send(body).expect(409);
    expect(repeat.body.error.code).toBe('CONFLICT');
  });

  it('creates a draft that visitors cannot see', async () => {
    const response = await admin('post', '/products')
      .send({
        categoryId,
        name: 'Test 100% camera',
        slug: key,
        brand: 'Testbrand',
        specifications: { Weight: '1 g' },
      })
      .expect(201);
    productId = response.body.data.id;

    expect(response.body.data).toMatchObject({ status: 'draft', variants: [] });
    await visitor(`/products/${key}`).expect(404);
    expect(await find('')).toEqual([]);
    expect(await directRead()).toEqual([0, 0, 0]);
  });

  it('refuses a missing category', async () => {
    await admin('post', '/products')
      .send({
        categoryId: randomUUID(),
        name: 'X',
        slug: `${key}-x`,
        brand: 'X',
      })
      .expect(409);
  });

  it('cannot publish without a variant', async () => {
    await admin('patch', `/products/${productId}`)
      .send({ status: 'published' })
      .expect(409);
  });

  it('adds variants that start out of stock', async () => {
    const add = (body: object) =>
      admin('post', `/products/${productId}/variants`).send(body);

    const body = await add({
      sku: `${sku}-B`,
      name: 'Body',
      priceMinor: 100_000,
      options: { Kit: 'Body' },
    }).expect(201);
    const kit = await add({
      sku: `${sku}-K`,
      name: 'Kit',
      priceMinor: 300_000,
      sortOrder: 1,
    }).expect(201);
    bodyId = body.body.data.id;
    kitId = kit.body.data.id;

    expect(body.body.data).toMatchObject({ quantity: 0, isInStock: false });
    await add({ sku: `${sku}-B`, name: 'Other', priceMinor: 1 }).expect(409);
  });

  it('shows a published product, without private fields', async () => {
    await admin('patch', `/products/${productId}`)
      .send({ status: 'published' })
      .expect(200);

    const response = await visitor(`/products/${key}`).expect(200);
    expect(response.body.data).toMatchObject({
      slug: key,
      currency: 'PKR',
      category: { slug: key },
      specifications: { Weight: '1 g' },
      images: [],
    });
    expect(
      response.body.data.variants.map((item: { name: string }) => item.name),
    ).toEqual(['Body', 'Kit']);
    const text = JSON.stringify(response.body);
    expect(text).not.toMatch(/quantity|lowStock|status|isActive/);
    expect(await directRead()).toEqual([1, 2, 1]);
  });

  it('keeps availability in step with stock', async () => {
    const addStock = (change: number) =>
      admin('post', `/inventory/${bodyId}/adjustments`)
        .send({ change, reason: 'correction' })
        .expect(200);

    expect(await find('inStock=true')).toEqual([]);
    await addStock(2);
    expect(await find('inStock=true')).toEqual([key]);
    expect(await find('inStock=false')).toEqual([]);
    await addStock(-2);
    expect(await find('inStock=false')).toEqual([key]);
  });

  it('does not let the backend set availability directly', async () => {
    const { error } = await system
      .from('product_variants')
      .update({ is_in_stock: true })
      .eq('id', bodyId);
    expect(error?.code).toBe('42501');
  });

  it('searches by words and treats wildcards as text', async () => {
    expect(await find('search=CAMERA%20testbrand')).toEqual([key]);
    expect(await find('search=100%25')).toEqual([key]);
    expect(await find('search=1%250')).toEqual([]);
    expect(await find('search=camera%20missing')).toEqual([]);
    expect(await find('search=%25),id.eq.1,(')).toEqual([]);
    expect(await find('brand=TESTBRAND')).toEqual([key]);
    expect(await find('brand=Test')).toEqual([]);
    expect(await find('brand=Test%25')).toEqual([]);
  });

  it('filters by price', async () => {
    expect(await find('minPrice=150000&maxPrice=200000')).toEqual([key]);
    expect(await find('minPrice=300001')).toEqual([]);
    expect(await find('maxPrice=99999')).toEqual([]);
  });

  it('sorts and pages', async () => {
    const second = await admin('post', '/products')
      .send({
        categoryId,
        name: 'Another',
        slug: `${key}-2`,
        brand: 'Testbrand',
      })
      .expect(201);
    const secondId = second.body.data.id;
    await admin('post', `/products/${secondId}/variants`)
      .send({ sku: `${sku}-2`, name: 'One', priceMinor: 200_000 })
      .expect(201);
    await admin('patch', `/products/${secondId}`)
      .send({ status: 'published' })
      .expect(200);

    const other = `${key}-2`;
    expect(await find('sort=newest')).toEqual([other, key]);
    expect(await find('sort=price_asc')).toEqual([key, other]);
    expect(await find('sort=price_desc')).toEqual([other, key]);
    expect(await find('sort=name_asc')).toEqual([other, key]);

    const page = await visitor(
      `/products?category=${key}&sort=price_asc&limit=1&page=2`,
    ).expect(200);
    expect(page.body.data).toHaveLength(1);
    expect(page.body.data[0].slug).toBe(other);
    expect(page.body.meta).toEqual({
      page: 2,
      limit: 1,
      total: 2,
      totalPages: 2,
    });

    const beyond = await visitor(
      `/products?category=${key}&limit=1&page=99`,
    ).expect(200);
    expect(beyond.body).toMatchObject({ data: [], meta: { total: 2 } });
  });

  it('keeps one active variant on a published product', async () => {
    const path = `/products/${productId}/variants`;
    await admin('patch', `${path}/${kitId}`)
      .send({ isActive: false })
      .expect(200);
    await admin('patch', `${path}/${bodyId}`)
      .send({ isActive: false })
      .expect(409);
    await admin('delete', `${path}/${bodyId}`).expect(409);

    const response = await visitor(`/products/${key}`).expect(200);
    expect(response.body.data.variants).toHaveLength(1);
  });

  it('does not change a variant through another product', async () => {
    await admin('patch', `/products/${randomUUID()}/variants/${bodyId}`)
      .send({ priceMinor: 1 })
      .expect(404);
  });

  it('hides products in an inactive category', async () => {
    const setActive = (isActive: boolean) =>
      admin('patch', `/categories/${categoryId}`)
        .send({ isActive })
        .expect(200);

    await setActive(false);
    await visitor(`/products/${key}`).expect(404);
    expect(await directRead()).toEqual([0, 0, 0]);
    await setActive(true);
    await visitor(`/products/${key}`).expect(200);
  });

  it('refuses to delete a category in use or a published product', async () => {
    await admin('delete', `/categories/${categoryId}`).expect(409);
    await admin('delete', `/products/${productId}`).expect(409);
  });

  it('hides archived products, and deletes drafts', async () => {
    const setStatus = (status: string) =>
      admin('patch', `/products/${productId}`).send({ status }).expect(200);

    await setStatus('archived');
    await visitor(`/products/${key}`).expect(404);
    expect(await directRead()).toEqual([0, 0, 0]);

    const list = await admin(
      'get',
      `/products?category=${key}&status=archived`,
    ).expect(200);
    expect(list.body.data).toHaveLength(1);

    await setStatus('draft');
    await admin('delete', `/products/${productId}`).expect(204);
    await admin('get', `/products/${productId}`).expect(404);
    await admin('delete', `/products/${productId}`).expect(404);
  });
});
