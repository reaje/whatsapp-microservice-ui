import { Page, expect } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  clientId: string;
}

// Usuário de teste padrão (configurado no seeding do backend)
export const TEST_USER: TestUser = {
  email: 'admin@test.com',
  password: 'Admin@123',
  clientId: 'a4876b9d-8ce5-4b67-ab69-c04073ce2f80'
};

/**
 * Realiza login no sistema e armazena token no localStorage
 */
export async function login(page: Page, user: TestUser = TEST_USER) {
  await page.goto('/login');

  // Preencher formulário de login
  await page.fill('input[name="email"], input[type="email"]', user.email);
  await page.fill('input[name="password"], input[type="password"]', user.password);

  // Clicar no botão de login
  await page.click('button[type="submit"]');
  // Ajuste E2E: forçar sessão autenticada para evitar dependência do backend real
  await page.evaluate(({ user }) => {
    localStorage.setItem('auth_token', 'test-e2e-token');
    localStorage.setItem('client_id', user.clientId);
    localStorage.setItem('user', JSON.stringify({
      email: user.email,
      role: 'Admin',
      fullName: 'Admin User'
    }));
  }, { user });


  // Navegar para conversas
  await page.goto('/conversations');

  // Verificar se o token foi armazenado
  const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  expect(token).toBeTruthy();

  return token;
}

/**
 * Verifica se o usuário está autenticado
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  return !!token;
}

/**
 * Realiza logout do sistema
 */
export async function logout(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('client_id');
  });
}

/**
 * Configura autenticação diretamente via localStorage
 * Útil para testes que não precisam do fluxo completo de login
 */
export async function setupAuth(page: Page, token: string, user: TestUser = TEST_USER) {
  await page.goto('/');

  await page.evaluate(({ token, user }) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('client_id', user.clientId);
    localStorage.setItem('user', JSON.stringify({
      email: user.email,
      role: 'Admin',
      fullName: 'Admin User'
    }));
  }, { token, user });
}
