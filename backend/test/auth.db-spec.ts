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

describe('API authentication with the real Supabase project', () => {
  const system = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SECRET_KEY,
    options,
  );
  const email = `db-test-${randomUUID()}@example.com`;
  let app: INestApplication<App>;
  let userId: string | undefined;
  let token: string;

  function get(path: string, accessToken: string) {
    return request(app.getHttpServer())
      .get(`/api/v1${path}`)
      .set('Authorization', `Bearer ${accessToken}`);
  }

  async function setRole(role: 'customer' | 'admin') {
    const { error } = await system
      .from('user_roles')
      .update({ role })
      .eq('user_id', userId);
    if (error) throw error;
  }

  beforeAll(async () => {
    // The prefix satisfies any password rules set in Supabase.
    const password = `Aa1!${randomUUID()}`;
    const created = await system.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: 'Test User' },
    });
    if (created.error) throw created.error;
    userId = created.data.user.id;

    const login = await createClient(
      env.SUPABASE_URL,
      env.SUPABASE_PUBLISHABLE_KEY,
      options,
    ).auth.signInWithPassword({ email, password });
    if (login.error) throw login.error;
    token = login.data.session.access_token;

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    if (userId) {
      const { error } = await system.auth.admin.deleteUser(userId);
      if (error) throw error;
    }
  });

  it('returns the logged-in user', async () => {
    const response = await get('/users/me', token).expect(200);
    expect(response.body.data).toEqual({
      id: userId,
      email,
      fullName: 'Test User',
      phone: null,
      role: 'customer',
    });
  });

  it('rejects changed, unsigned and malformed tokens', async () => {
    const [header, payload, signature] = token.split('.');
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
    const encode = (value: object) =>
      Buffer.from(JSON.stringify(value)).toString('base64url');
    const otherUser = encode({ ...claims, sub: randomUUID() });
    const noneHeader = encode({ alg: 'none', typ: 'JWT' });

    await get('/users/me', `${header}.${otherUser}.${signature}`).expect(401);
    await get('/users/me', `${noneHeader}.${payload}.x`).expect(401);
    await get('/users/me', `${noneHeader}.${payload}.`).expect(401);
    await get('/users/me', 'not-a-token').expect(401);
    await get('/users/me', 'a.b.c').expect(401);
    await get('/users/me', env.SUPABASE_PUBLISHABLE_KEY).expect(401);
  });

  it('gives 403 to a customer and 200 to an admin', async () => {
    await get('/admin/summary', token).expect(403);

    await setRole('admin');
    const response = await get('/admin/summary', token).expect(200);
    expect(response.body.data.customerCount).toEqual(expect.any(Number));
  });

  it('applies a removed role immediately, with the same token', async () => {
    await setRole('customer');
    await get('/admin/summary', token).expect(403);
  });

  it('rejects the token of a deleted account', async () => {
    const { error } = await system.auth.admin.deleteUser(userId!);
    expect(error).toBeNull();
    userId = undefined;

    await get('/users/me', token).expect(401);
  });
});
