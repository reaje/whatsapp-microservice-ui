import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração do Playwright para testes E2E
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',

  /* Tempo máximo que um teste pode levar */
  timeout: 30 * 1000,

  /* Configuração de expect timeout */
  expect: {
    timeout: 5000
  },

  /* Executar testes em paralelo */
  fullyParallel: true,

  /* Falhar build se você deixar test.only no código */
  forbidOnly: !!process.env.CI,

  /* Retry nos testes falhados apenas no CI */
  retries: process.env.CI ? 2 : 0,

  /* Reporter para usar */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],

  /* Configurações compartilhadas para todos os projetos */
  use: {
    /* URL base para usar nas ações como `await page.goto('/')` */
    baseURL: 'http://localhost:5173',

    /* Coleta de traces apenas quando falhar */
    trace: 'on-first-retry',

    /* Screenshot apenas quando falhar */
    screenshot: 'only-on-failure',

    /* Timeout de navegação */
    navigationTimeout: 10000,
  },

  /* Configurar projetos para browsers principais */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },

    // Temporariamente desabilitados para destravar a execução local de E2E
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Testes mobile */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  /* Executar servidor local antes de iniciar os testes */
  webServer: {
    command: 'npm run dev -- --port 5173',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
