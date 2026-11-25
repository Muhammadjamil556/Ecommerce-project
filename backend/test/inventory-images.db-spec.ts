import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
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
const DETAILS = { altText: 'Front', credit: 'Test', license: 'CC0' };

type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

// The tests follow one product, so they run in order.
describe('Inventory and photos with the real Supabase project', () => {
  const system = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SECRET_KEY,
    options,
  );
  const run = randomUUID();
  const key = `db-test-${run}`;
  let app: INestApplication<App>;
  let userId: string;
  let token: string;
  let productId: string;
  let variantId: string;
  let imageIds: string[] = [];
  let photo: Buffer;

  function admin(method: Method, path: string) {
    return request(app.getHttpServer())
      [method](`/api/v1/admin${path}`)
      .set('Authorization', `Bearer ${token}`);
  }

  function adjust(change: number, extra: object = {}) {
    return admin('post', `/inventory/${variantId}/adjustments`).send({
      change,
      reason: 'received',
      ...extra,
    });
  }

  function upload(file: Buffer, details: Record<string, string> = DETAILS) {
    const call = admin('post', `/products/${productId}/images`).attach(
      'file',
      file,
      'photo.jpg',
    );
    return call.field(details);
  }

  async function storedFiles(): Promise<string[]> {
    const { data, error } = await system.storage
      .from('product-images')
      .list(productId);
    expect(error).toBeNull();
    return (data ?? []).map((file) => file.name);
  }

  beforeAll(async () => {
    const email = `${key}@example.com`;
    const password = `Aa1!${randomUUID()}`;
    const created = await system.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: 'Stock Tester' },
    });
    if (created.error) throw created.error;
    userId = created.data.user.id;
    const promoted = await system
      .from('user_roles')
      .update({ role: 'admin' })
      .eq('user_id', userId);
    if (promoted.error) throw promoted.error;

    const login = await createClient(
      env.SUPABASE_URL,
      env.SUPABASE_PUBLISHABLE_KEY,
      options,
    ).auth.signInWithPassword({ email, password });
    if (login.error) throw login.error;
    token = login.data.session.access_token;

    photo = await sharp({
      create: { width: 60, height: 40, channels: 3, background: '#336699' },
    })
      .withExif({ IFD0: { Copyright: 'private-marker' } })
      .jpeg()
      .toBuffer();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();

    const category = await admin('post', '/categories')
      .send({ name: 'Test', slug: key })
      .expect(201);
    const product = await admin('post', '/products')
      .send({
        categoryId: category.body.data.id,
        name: 'Test',
        slug: key,
        brand: 'Testbrand',
      })
      .expect(201);
    productId = product.body.data.id;
    const variant = await admin('post', `/products/${productId}/variants`)
      .send({
        sku: `DBTEST-${run.toUpperCase()}`,
        name: 'One',
        priceMinor: 100,
      })
      .expect(201);
    variantId = variant.body.data.id;
  });

  // Deletes only what this run created: its slugs contain a random ID.
  afterAll(async () => {
    await app?.close();
    if (productId) {
      const { data } = await system.storage
        .from('product-images')
        .list(productId);
      const paths = (data ?? []).map((file) => `${productId}/${file.name}`);
      if (paths.length > 0) {
        await system.storage.from('product-images').remove(paths);
      }
    }
    const products = await system.from('products').delete().eq('slug', key);
    const categories = await system.from('categories').delete().eq('slug', key);
    const user = userId
      ? await system.auth.admin.deleteUser(userId)
      : { error: null };
    const error = products.error ?? categories.error ?? user.error;
    if (error) throw error;
  });

  it('adds and removes stock, and records who and why', async () => {
    const added = await adjust(10, { note: 'Delivery' }).expect(200);
    expect(added.body.data).toMatchObject({ quantity: 10, isLow: false });
    const removed = await adjust(-7, { reason: 'damaged' }).expect(200);
    expect(removed.body.data).toMatchObject({ quantity: 3, isLow: true });

    const history = await admin(
      'get',
      `/inventory/${variantId}/movements`,
    ).expect(200);
    expect(history.body.meta.total).toBe(2);
    expect(history.body.data).toMatchObject([
      {
        change: -7,
        quantityAfter: 3,
        reason: 'damaged',
        note: null,
        createdByName: 'Stock Tester',
      },
      { change: 10, quantityAfter: 10, reason: 'received', note: 'Delivery' },
    ]);
  });

  it('refuses to go below zero, without a history row', async () => {
    await adjust(-4).expect(409);
    const history = await admin(
      'get',
      `/inventory/${variantId}/movements`,
    ).expect(200);
    expect(history.body.meta.total).toBe(2);
  });

  it('adds up simultaneous changes, and never goes below zero', async () => {
    await Promise.all([1, 2, 3, 4].map(() => adjust(1).expect(200)));
    const results = await Promise.all([1, 2, 3].map(() => adjust(-3)));
    const statuses = results
      .map((result) => result.status)
      .toSorted((a, b) => a - b);
    expect(statuses).toEqual([200, 200, 409]);

    const item = await admin('get', `/inventory/${variantId}`).expect(200);
    expect(item.body.data.quantity).toBe(1);

    const { data } = await system
      .from('stock_movements')
      .select('change')
      .eq('variant_id', variantId);
    const total = (data ?? []).reduce((sum, row) => sum + row.change, 0);
    expect(total).toBe(1);
  });

  it('filters low stock and searches', async () => {
    const find = async (query: string) => {
      const response = await admin(
        'get',
        `/inventory?search=${run}&${query}`,
      ).expect(200);
      return response.body.data.length;
    };
    expect(await find('low=true')).toBe(1);
    expect(await find('low=false')).toBe(0);

    await admin('patch', `/inventory/${variantId}`)
      .send({ lowStockThreshold: 0 })
      .expect(200);
    expect(await find('low=true')).toBe(0);
    expect(await find('page=9')).toBe(0);
  });

  it('answers 404 for an unknown variant', async () => {
    const unknown = randomUUID();
    await admin('get', `/inventory/${unknown}`).expect(404);
    await admin('get', `/inventory/${unknown}/movements`).expect(404);
    await admin('patch', `/inventory/${unknown}`)
      .send({ lowStockThreshold: 1 })
      .expect(404);
    await admin('post', `/inventory/${unknown}/adjustments`)
      .send({ change: 1, reason: 'received' })
      .expect(404);
  });

  it('stores an uploaded photo as public WebP without hidden data', async () => {
    const response = await upload(photo).expect(201);
    const image = response.body.data;
    imageIds.push(image.id);
    expect(image).toMatchObject({
      alt: 'Front',
      credit: 'Test',
      license: 'CC0',
      sourceUrl: null,
      width: 60,
      height: 40,
    });

    const file = await fetch(image.url);
    expect(file.status).toBe(200);
    expect(file.headers.get('content-type')).toBe('image/webp');
    const bytes = Buffer.from(await file.arrayBuffer());
    expect(bytes.includes('private-marker')).toBe(false);
  });

  it('refuses files that are not photos, and stores nothing', async () => {
    const before = await storedFiles();
    await upload(Buffer.from('<svg></svg>')).expect(400);
    await upload(Buffer.from('<?php echo 1;')).expect(400);
    await upload(photo, { ...DETAILS, credit: '' }).expect(400);
    await admin('post', `/products/${randomUUID()}/images`)
      .attach('file', photo, 'photo.jpg')
      .field(DETAILS)
      .expect(404);
    expect(await storedFiles()).toEqual(before);
  });

  it('does not let the bucket accept another file type', async () => {
    const { error } = await system.storage
      .from('product-images')
      .upload(`${productId}/page.html`, Buffer.from('<html></html>'), {
        contentType: 'text/html',
      });
    expect(error).not.toBeNull();
  });

  it('reorders photos and uses the first as the main photo', async () => {
    for (const altText of ['Second', 'Third']) {
      const response = await upload(photo, { ...DETAILS, altText }).expect(201);
      imageIds.push(response.body.data.id);
    }
    imageIds = [imageIds[2], imageIds[0], imageIds[1]];
    const response = await admin('put', `/products/${productId}/images/order`)
      .send({ imageIds })
      .expect(200);
    expect(response.body.data.map((image: { id: string }) => image.id)).toEqual(
      imageIds,
    );

    const list = await admin('get', `/products?category=${key}`).expect(200);
    expect(list.body.data[0].image.alt).toBe('Third');

    const reorder = (ids: string[]) =>
      admin('put', `/products/${productId}/images/order`).send({
        imageIds: ids,
      });
    await reorder(imageIds.slice(1)).expect(409);
    await reorder([...imageIds, randomUUID()]).expect(409);
  });

  it('changes photo details, and clears the source', async () => {
    const path = `/products/${productId}/images/${imageIds[0]}`;
    const response = await admin('patch', path)
      .send({ credit: 'New', sourceUrl: 'https://example.com/a' })
      .expect(200);
    expect(response.body.data).toMatchObject({
      credit: 'New',
      sourceUrl: 'https://example.com/a',
    });
    const cleared = await admin('patch', path)
      .send({ sourceUrl: null })
      .expect(200);
    expect(cleared.body.data.sourceUrl).toBeNull();

    await admin('patch', `/products/${randomUUID()}/images/${imageIds[0]}`)
      .send({ credit: 'X' })
      .expect(404);
  });

  it('deletes the file together with the photo', async () => {
    expect(await storedFiles()).toHaveLength(3);
    const path = `/products/${productId}/images/${imageIds[0]}`;
    await admin('delete', path).expect(204);
    await admin('delete', path).expect(404);
    expect(await storedFiles()).toHaveLength(2);
  });

  it('deletes all files together with the draft', async () => {
    await admin('delete', `/products/${productId}`).expect(204);
    expect(await storedFiles()).toEqual([]);
  });
});
