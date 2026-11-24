import { validateEnv } from './env.validation.js';

describe('validateEnv', () => {
  const validEnv = {
    FRONTEND_URL: 'http://localhost:5173',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
    SUPABASE_SECRET_KEY: 'sb_secret_test',
  };

  it('applies defaults for optional variables', () => {
    expect(validateEnv(validEnv)).toMatchObject({
      NODE_ENV: 'development',
      PORT: 3000,
    });
  });

  it('converts PORT to a number', () => {
    expect(validateEnv({ ...validEnv, PORT: '4000' }).PORT).toBe(4000);
  });

  it('removes a trailing slash from FRONTEND_URL', () => {
    const env = validateEnv({
      ...validEnv,
      FRONTEND_URL: 'http://localhost:5173/',
    });
    expect(env.FRONTEND_URL).toBe('http://localhost:5173');
  });

  it('removes a path from SUPABASE_URL', () => {
    const env = validateEnv({
      ...validEnv,
      SUPABASE_URL: 'https://example.supabase.co/rest/v1/',
    });
    expect(env.SUPABASE_URL).toBe('https://example.supabase.co');
  });

  it.each([
    ['FRONTEND_URL', { ...validEnv, FRONTEND_URL: undefined }],
    ['FRONTEND_URL', { ...validEnv, FRONTEND_URL: 'not-a-url' }],
    ['SUPABASE_URL', { ...validEnv, SUPABASE_URL: undefined }],
    ['SUPABASE_URL', { ...validEnv, SUPABASE_URL: 'http://example.com' }],
    [
      'SUPABASE_PUBLISHABLE_KEY',
      { ...validEnv, SUPABASE_PUBLISHABLE_KEY: 'sb_secret_test' },
    ],
    [
      'SUPABASE_SECRET_KEY',
      { ...validEnv, SUPABASE_SECRET_KEY: 'sb_publishable_test' },
    ],
    [
      'SUPABASE_SECRET_KEY',
      { ...validEnv, SUPABASE_SECRET_KEY: 'sb_secret_replace_me' },
    ],
    ['PORT', { ...validEnv, PORT: 'abc' }],
    ['PORT', { ...validEnv, PORT: '70000' }],
    ['NODE_ENV', { ...validEnv, NODE_ENV: 'staging' }],
  ])('rejects an invalid %s', (name, env) => {
    expect(() => validateEnv(env)).toThrow(name);
  });
});
