import { defineConfig } from 'vitest/config';
import { webdriverio } from '@vitest/browser-webdriverio';

export default defineConfig({
  optimizeDeps: {
    include: ['@ja-platform/parser-schema', '@ja-platform/parser-type-system', '@ja-platform/parser-expressions']
  },
  test: {
    globals: true,
    include: ['./tests/**/*.test.ts'],
    reporters: 'default',
    browser: {
      provider: webdriverio(),
      instances: [{ browser: 'chrome' }],
      enabled: true,
      headless: true
    }
  }
});
