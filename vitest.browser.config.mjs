import { resolve } from 'path'
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },

  test: {
    browser: {
      enabled: true,
      name: "chromium",
      provider: playwright(),
      instances: [
        { browser: 'chromium' },
      ],
      headless: true,
      viewport: { width: 960, height: 540 }
    },
    include: [
      './test/e2e/**/*.ts',
    ]
  }
});