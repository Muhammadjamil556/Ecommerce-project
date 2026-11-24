import { validateEnv } from './env.validation.js';

describe('validateEnv', () => {
  const validEnv = { FRONTEND_URL: 'http://localhost:5173' };

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
    const env = validateEnv({ FRONTEND_URL: 'http://localhost:5173/' });
    expect(env.FRONTEND_URL).toBe('http://localhost:5173');
  });

  it.each([
    ['FRONTEND_URL', {}],
    ['FRONTEND_URL', { FRONTEND_URL: 'not-a-url' }],
    ['PORT', { ...validEnv, PORT: 'abc' }],
    ['PORT', { ...validEnv, PORT: '70000' }],
    ['NODE_ENV', { ...validEnv, NODE_ENV: 'staging' }],
  ])('rejects an invalid %s', (name, env) => {
    expect(() => validateEnv(env)).toThrow(name);
  });
});
