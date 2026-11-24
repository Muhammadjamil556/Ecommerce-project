import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../config/env.validation.js';
import { SupabaseService } from './supabase.service.js';

const URL = 'https://example.supabase.co';
const ALGORITHM = { name: 'ECDSA', namedCurve: 'P-256' };

const encode = (value: object) =>
  Buffer.from(JSON.stringify(value)).toString('base64url');

describe('SupabaseService.verifyAccessToken', () => {
  const now = Math.floor(Date.now() / 1000);
  const validClaims = {
    iss: `${URL}/auth/v1`,
    aud: 'authenticated',
    role: 'authenticated',
    sub: 'user-1',
    email: 'ann@example.com',
    iat: now,
    exp: now + 3600,
  };
  const fetchMock = vi.fn<typeof fetch>();
  let keys: CryptoKeyPair;
  let service: SupabaseService;

  async function sign(claims: object, kid = 'key-1') {
    const input = `${encode({ alg: 'ES256', typ: 'JWT', kid })}.${encode(claims)}`;
    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      keys.privateKey,
      Buffer.from(input),
    );
    return `${input}.${Buffer.from(signature).toString('base64url')}`;
  }

  beforeAll(async () => {
    keys = await crypto.subtle.generateKey(ALGORITHM, true, ['sign', 'verify']);
  });

  beforeEach(async () => {
    const publicKey = await crypto.subtle.exportKey('jwk', keys.publicKey);
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () =>
      Response.json({ keys: [{ ...publicKey, kid: 'key-1', alg: 'ES256' }] }),
    );
    vi.stubGlobal('fetch', fetchMock);
    service = new SupabaseService(
      new ConfigService<EnvironmentVariables, true>({
        SUPABASE_URL: URL,
        SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
        SUPABASE_SECRET_KEY: 'sb_secret_test',
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('accepts a valid token', async () => {
    const token = await sign(validClaims);
    expect(await service.verifyAccessToken(token)).toEqual({
      id: 'user-1',
      email: 'ann@example.com',
      accessToken: token,
    });
  });

  it.each([
    ['expired', { exp: now - 60 }],
    ['from another project', { iss: 'https://other.supabase.co/auth/v1' }],
    ['for another audience', { aud: 'something-else' }],
    ['not for a logged-in user', { role: 'anon' }],
    ['without a user', { sub: undefined }],
  ])('rejects a token that is %s', async (_name, change) => {
    const token = await sign({ ...validClaims, ...change });
    await expect(service.verifyAccessToken(token)).rejects.toMatchObject({
      status: HttpStatus.UNAUTHORIZED,
    });
  });

  it('reports 503, not 401, when Supabase cannot be reached', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));
    // A key that is not cached yet, so the verifier has to ask Supabase for it.
    const token = await sign(validClaims, 'uncached-key');
    await expect(service.verifyAccessToken(token)).rejects.toMatchObject({
      status: HttpStatus.SERVICE_UNAVAILABLE,
    });
  });
});
