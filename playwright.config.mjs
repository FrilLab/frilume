import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.mjs',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'node tests/preview.mjs',
    url: 'http://127.0.0.1:4173/tests/fixture.html',
    reuseExistingServer: !process.env.CI,
    timeout: 10_000
  }
});
