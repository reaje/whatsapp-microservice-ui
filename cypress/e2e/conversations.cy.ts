describe('Conversas - Sessões WhatsApp embutidas', () => {
  it('deve exibir a seção de Sessões e permitir abrir a tela de conversas', () => {
    cy.uiLogin();

    // Ir para Conversas
    cy.visit('/conversations');

    // Verifica a seção de Sessões embutida
    cy.contains('Sessões WhatsApp').should('be.visible');
    cy.contains('Nova Sessão').should('be.visible');

    // Verifica que a lista de contatos carrega
    cy.contains('Selecionar').should('not.exist'); // placeholder defensivo
    cy.get('div').contains('Conversas').should('be.visible');
  });
});

