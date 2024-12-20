import { resolve } from 'path'
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },

  test: {
    include: [
      './test/unit/**/*.ts',
      './test/integration/**/*.ts',
    ]
  }
});