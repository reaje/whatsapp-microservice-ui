import { Page, Route } from '@playwright/test';

/**
 * Configura interceptação de requisições da API para simular webhooks
 */
export class ApiMock {
  constructor(private page: Page) {}

  /**
   * Intercepta requisição de envio de mensagem e simula resposta de sucesso
   */
  async mockSendMessage(phoneNumber: string, messageId: string = 'mock-message-id') {
    await this.page.route('**/api/v1/message/text', async (route: Route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      if (postData.to === phoneNumber) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: messageId,
            messageId: messageId,
            sessionId: 'test-session-id',
            fromNumber: 'self',
            toNumber: phoneNumber,
            type: 'text',
            content: {
              text: postData.text
            },
            status: 'sent',
            timestamp: new Date().toISOString()
          })
        });
      } else {
        await route.continue();
      }
    });
  }

  /**
   * Intercepta requisição de histórico de mensagens
   */
  async mockMessageHistory(phoneNumber: string, messages: any[] = []) {
    await this.page.route(`**/api/v1/message/history/${phoneNumber}*`, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(messages)
      });
    });
  }

  /**
   * Intercepta requisição de conversas
   */
  async mockConversations(conversations: any[] = []) {
    await this.page.route('**/api/v1/message/conversations', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(conversations)
      });
    });
  }

  /**
   * Intercepta criação de agente de IA
   */
  async mockCreateAIAgent(agentData: any) {
    await this.page.route('**/api/v1/AIAgent', async (route: Route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(agentData)
        });
      } else {
        await route.continue();
      }
    });
  }

  /**
   * Simula webhook de mensagem recebida
   * Injeta mensagem diretamente no Redux store
   */
  async simulateIncomingWebhook(contactId: string, message: any) {
    await this.page.evaluate(({ contactId, message }) => {
      // Dispatchar ação Redux para adicionar mensagem
      const event = new CustomEvent('webhook:incoming-message', {
        detail: { contactId, message }
      });
      window.dispatchEvent(event);
    }, { contactId, message });
  }

  /**
   * Limpa todas as interceptações
   */
  async clearMocks() {
    await this.page.unrouteAll({ behavior: 'ignoreErrors' });
  }
}

/**
 * Helper para criar dados de mensagem mock
 */
export function createMockMessage(
  from: string,
  to: string,
  text: string,
  timestamp: Date = new Date()
) {
  return {
    id: `mock-${Date.now()}`,
    messageId: `whatsapp-${Date.now()}`,
    sessionId: 'test-session-id',
    fromNumber: from,
    toNumber: to,
    type: 'text',
    content: {
      text: text
    },
    status: 'received',
    timestamp: timestamp.toISOString()
  };
}

/**
 * Helper para criar dados de contato mock
 */
export function createMockContact(
  id: string,
  name: string,
  phoneNumber: string,
  lastMessage?: any
) {
  return {
    id,
    name,
    phoneNumber,
    unreadCount: 0,
    lastMessage
  };
}
