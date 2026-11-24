import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Fixed values, so tests do not depend on a developer's .env file.
    env: { NODE_ENV: 'test', FRONTEND_URL: 'http://localhost:5173' },
  },
});
