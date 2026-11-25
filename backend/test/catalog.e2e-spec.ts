import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/config/configure-app.js';
import { SupabaseService } from '../src/supabase/supabase.service.js';

const ID = '3f0f3c1e-5b1a-4c55-9d53-0a4f3f1d2b6c';

// Login and role come from fake data. No request here may reach the catalog tables:
// each one must be stopped by a guard or by validation.
let role = 'customer';
const roleQuery = {
  select: () => roleQuery,
  eq: () => roleQuery,
  maybeSingle: () => Promise.resolve({ data: { role }, error: null }),
};
const catalogClient = {
  from: () => {
    throw new Error('The database must not be reached.');
  },
};
const fakeSupabase = {
  verifyAccessToken: () =>
    Promise.resolve({ id: ID, email: 'a@example.com', accessToken: 'token' }),
  forUser: () => ({ from: () => roleQuery }),
  asVisitor: () => catalogClient,
  asSystem: () => catalogClient,
};

const ADMIN_ROUTES = [
  ['get', '/admin/categories'],
  ['post', '/admin/categories'],
  ['patch', `/admin/categories/${ID}`],
  ['delete', `/admin/categories/${ID}`],
  ['get', '/admin/products'],
  ['get', `/admin/products/${ID}`],
  ['post', '/admin/products'],
  ['patch', `/admin/products/${ID}`],
  ['delete', `/admin/products/${ID}`],
  ['post', `/admin/products/${ID}/variants`],
  ['patch', `/admin/products/${ID}/variants/${ID}`],
  ['delete', `/admin/products/${ID}/variants/${ID}`],
] as const;

describe('Catalog rules (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(SupabaseService)
      .useValue(fakeSupabase)
      .compile();
    app = moduleRef.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  function call(method: 'get' | 'post' | 'patch' | 'delete', path: string) {
    return request(app.getHttpServer())[method](`/api/v1${path}`);
  }

  it.each(ADMIN_ROUTES)('%s %s needs login', async (method, path) => {
    await call(method, path).expect(401);
  });

  it.each(ADMIN_ROUTES)('%s %s refuses customers', async (method, path) => {
    role = 'customer';
    await call(method, path).set('Authorization', 'Bearer token').expect(403);
  });

  it.each([
    'page=0',
    'page=abc',
    'limit=49',
    'sort=random',
    'minPrice=-1',
    'minPrice=1.5',
    'minPrice=200&maxPrice=100',
    'inStock=maybe',
    'category=Not%20A%20Slug',
    `search=${'x'.repeat(101)}`,
    'search=a&search=b',
    'status=draft',
    'unknown=1',
  ])('rejects the filter %s', async (query) => {
    await call('get', `/products?${query}`).expect(400);
  });

  it('rejects an invalid slug', async () => {
    await call('get', '/products/Not_A_Slug').expect(400);
  });

  const product = { categoryId: ID, name: 'Z8', brand: 'Nikon' };
  const variant = { sku: 'A-1', name: 'Body', priceMinor: 100 };

  it.each([
    ['post', '/admin/products', { ...product, name: '   ' }],
    ['post', '/admin/products', { ...product, categoryId: 'x' }],
    ['post', '/admin/products', { ...product, slug: 'Bad Slug' }],
    ['post', '/admin/products', { ...product, status: 'published' }],
    ['post', '/admin/products', { ...product, specifications: { a: 1 } }],
    ['patch', `/admin/products/${ID}`, {}],
    ['patch', `/admin/products/${ID}`, { name: null }],
    ['patch', `/admin/products/${ID}`, { status: 'sold' }],
    ['patch', '/admin/products/not-an-id', { name: 'A' }],
    ['post', `/admin/products/${ID}/variants`, { ...variant, priceMinor: 0 }],
    ['post', `/admin/products/${ID}/variants`, { ...variant, priceMinor: 1.5 }],
    ['post', `/admin/products/${ID}/variants`, { ...variant, sku: 'bad sku' }],
    ['post', `/admin/products/${ID}/variants`, { ...variant, isInStock: true }],
    ['patch', `/admin/products/${ID}/variants/${ID}`, { priceMinor: null }],
    ['post', '/admin/categories', { name: 'A', sortOrder: -1 }],
    ['post', '/admin/categories', { name: '???' }],
    ['patch', `/admin/categories/${ID}`, { isActive: 'yes' }],
  ] as const)('%s %s rejects %j', async (method, path, body) => {
    role = 'admin';
    await call(method, path)
      .set('Authorization', 'Bearer token')
      .send(body)
      .expect(400);
  });
});
