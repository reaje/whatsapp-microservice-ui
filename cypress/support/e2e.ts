// Cypress global support for E2E tests

// Fail test on console error (optional, can be relaxed if noisy)
Cypress.on('window:before:load', (win) => {
  const originalConsoleError = win.console.error;
  win.console.error = (...args: any[]) => {
    originalConsoleError.apply(win.console, args);
  };
});

// Small helper: do UI login using the default seeded credentials
Cypress.Commands.add('uiLogin', () => {
  cy.visit('/login');
  // ClientId and Email already have defaults; only type the password
  cy.get('input[type="password"]').type('Admin@123');
  cy.contains('button', 'Entrar').click();
});

// Types for custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      uiLogin(): Chainable<void>;
    }
  }
}

