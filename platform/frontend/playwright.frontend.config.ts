import { defineConfig, devices } from '@playwright/test'
const port = Number(process.env.GEOVR_DEMO_TEST_PORT || 5176)
export default defineConfig({
  testDir: './e2e', testMatch: ['**/demo.spec.ts', '**/methods.spec.ts'], outputDir: 'test-results/frontend', workers: 1, timeout: 90000,
  expect: { timeout: 10000 }, reporter: [['list'], ['html', { outputFolder: 'playwright-report/frontend', open: 'never' }]],
  use: { baseURL: `http://127.0.0.1:${port}`, channel: process.env.PLAYWRIGHT_CHANNEL, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop-demo', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile-demo', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
  ],
  webServer: { command: `node node_modules/vite/bin/vite.js --host 127.0.0.1 --port ${port} --strictPort`, url: `http://127.0.0.1:${port}`, reuseExistingServer: false },
})
