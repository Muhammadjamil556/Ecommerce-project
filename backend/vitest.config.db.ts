import { defineConfig } from 'vitest/config';

// Runs against the real development project named in .env, so it is separate from
// the other tests. Creates temporary users and deletes them afterwards.
process.loadEnvFile('.env');

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['test/**/*.db-spec.ts'],
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
