import { defineConfig } from 'vitest/config';
import { webdriverio } from '@vitest/browser-webdriverio';

export default defineConfig({
  optimizeDeps: {
    include: [
      '@ja-platform/parser-schema',
      '@ja-platform/parser-schema-json',
      '@ja-platform/parser-core',
      '@ja-platform/parser-type-system',
      '@ja-platform/parser-expressions',
      '@journeyapps/common-xml'
    ]
  },
  test: {
    alias: {
      stream: 'stream-browserify'
    },
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
