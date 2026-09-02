import { defineConfig, devices } from '@playwright/test';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npx cross-env NEXT_DIST_DIR=.next-playwright NEXT_PUBLIC_RECAPTCHA_SITE_KEY=e2e-test-key RECAPTCHA_E2E_TOKEN=e2e-recaptcha-token next dev --port 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: false,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});