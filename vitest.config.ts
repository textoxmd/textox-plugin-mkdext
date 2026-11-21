import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // toc 的 NodeView 与 emoji 的 widget 构建器直接操作 DOM，整仓统一用 happy-dom。
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
  },
});
