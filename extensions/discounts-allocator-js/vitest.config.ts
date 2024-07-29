import tsconfigPaths from 'vite-tsconfig-paths';
import {defineConfig} from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    // Forces dev to explicitly call in via the CLI
    watch: false,
    clearMocks: true,
    include: ['./src/**/*.test.[jt]s?(x)'],
    watchExclude: ['.*\\/node_modules\\/.*', '.*\\/build\\/.*'],
    poolMatchGlobs: [
      // Run database tests in child_process - Prisma crashes when run in 'node:worker_threads'
      ['**/database/tests/**', 'child_process'],
    ],
  },
});
