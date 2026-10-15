import { defineConfig, devices } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const apiPort = Number(process.env.GEOVR_TEST_API_PORT || 8091)
const webPort = Number(process.env.GEOVR_TEST_WEB_PORT || 5174)

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 10000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${webPort}`,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
  ],
  webServer: [
    {
      command: `uv run uvicorn app.main:app --host 127.0.0.1 --port ${apiPort}`,
      cwd: path.resolve(root, '../backend'),
      env: { GEOVR_DATA_DIR: path.resolve(root, '../.runtime/e2e-data') },
      url: `http://127.0.0.1:${apiPort}/api/v1/health`,
      reuseExistingServer: false,
      timeout: 30000,
    },
    {
      command: `pnpm dev --port ${webPort} --strictPort`,
      cwd: root,
      env: { GEOVR_API_URL: `http://127.0.0.1:${apiPort}` },
      url: `http://127.0.0.1:${webPort}`,
      reuseExistingServer: false,
      timeout: 30000,
    },
  ],
})
