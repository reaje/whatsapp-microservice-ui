# Testes E2E - WhatsApp Multi-Tenant Frontend

Este diretório contém os testes end-to-end (E2E) do frontend usando Playwright.

## 📋 Pré-requisitos

Antes de executar os testes, certifique-se de que:

1. **Backend API** está rodando em `http://localhost:5000`
2. **Baileys Service** está rodando em `http://localhost:3000` (se testar envio real de mensagens)
3. **Banco de dados** está configurado com os dados de seeding (usuário de teste)

## 🚀 Instalação

Os browsers do Playwright já devem estar instalados. Se não estiverem, execute:

```bash
npx playwright install
```

## ▶️ Executando os Testes

### Executar todos os testes E2E

```bash
npm run test:e2e
```

### Executar testes em modo UI (interativo)

```bash
npx playwright test --ui
```

### Executar testes em modo debug

```bash
npx playwright test --debug
```

### Executar teste específico

```bash
npx playwright test e2e/conversations-ai-webhook.spec.ts
```

### Executar apenas um teste dentro do arquivo

```bash
npx playwright test -g "deve iniciar uma conversa e receber resposta"
```

### Executar em um browser específico

```bash
# Apenas Chromium
npx playwright test --project=chromium

# Apenas Firefox
npx playwright test --project=firefox

# Apenas Webkit (Safari)
npx playwright test --project=webkit
```

## 📊 Relatórios

Após executar os testes, um relatório HTML é gerado automaticamente:

```bash
npx playwright show-report
```

O relatório inclui:
- Screenshots de falhas
- Traces de execução
- Logs de console
- Requisições de rede

## 🧪 Estrutura dos Testes

```
e2e/
├── helpers/
│   ├── auth.ts           # Helpers de autenticação
│   └── api-mock.ts       # Helpers para mock de API
├── conversations-ai-webhook.spec.ts  # Testes principais
└── README.md             # Esta documentação
```

## 📝 Testes Implementados

### 1. **Conversas e Interações via Webhook com Agente de IA**

- ✅ Iniciar conversa e receber resposta automática do agente IA
- ✅ Exibir histórico de conversas com agente de IA
- ✅ Configurar agente de IA para o tenant
- ✅ Validar formato de número de telefone
- ✅ Mostrar indicador de "digitando" durante interação

### 2. **Autenticação e Navegação**

- ✅ Login com sucesso
- ✅ Redirecionamento quando não autenticado

## 🔧 Configuração

### Variáveis de Ambiente

Os testes usam as mesmas variáveis de ambiente do `.env`:

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SUPABASE_URL=<sua-url-supabase>
VITE_SUPABASE_ANON_KEY=<sua-chave-supabase>
```

### Usuário de Teste Padrão

Os testes usam o usuário de teste configurado no seeding do backend:

```typescript
{
  email: 'admin@test.com',
  password: 'Admin@123',
  clientId: 'a4876b9d-8ce5-4b67-ab69-c04073ce2f80'
}
```

## 🐛 Debugging

### Ver execução dos testes em modo headed

```bash
npx playwright test --headed
```

### Ver execução em slow motion

```bash
npx playwright test --headed --slow-mo=1000
```

### Abrir Playwright Inspector

```bash
npx playwright test --debug
```

### Gerar trace para análise

```bash
npx playwright test --trace on
```

E depois visualizar:

```bash
npx playwright show-trace trace.zip
```

## ⚠️ Notas Importantes

### Webhooks Simulados

Os testes simulam webhooks de agentes IA usando eventos customizados JavaScript. Para testar webhooks reais:

1. Configure um agente de IA no backend
2. Configure o webhook URL do tenant
3. Use a API do backend para enviar mensagens que acionem o agente

### Realtime Updates

Alguns testes dependem de Supabase Realtime para funcionar completamente. Se você não tiver Supabase configurado:

- Os testes ainda vão passar
- Mas alguns recursos de atualização em tempo real podem não funcionar
- Verifique os logs do console para avisos

### Timeouts

Se os testes estiverem falhando por timeout:

1. Aumente o timeout no `playwright.config.ts`
2. Verifique se o backend está respondendo
3. Verifique se o frontend está buildando corretamente

## 📚 Recursos Adicionais

- [Documentação do Playwright](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging no Playwright](https://playwright.dev/docs/debug)
- [Trace Viewer](https://playwright.dev/docs/trace-viewer)

## 🤝 Contribuindo

Ao adicionar novos testes:

1. Use os helpers existentes em `helpers/`
2. Siga o padrão AAA (Arrange, Act, Assert)
3. Adicione comentários explicativos
4. Use logs `console.log` para feedback útil
5. Certifique-se que os testes são determinísticos

## 🔍 Troubleshooting

### Erro: "Test timeout"

- Verifique se os serviços (backend + frontend) estão rodando
- Aumente o timeout no teste específico

### Erro: "Navigation timeout"

- Backend pode estar lento
- Verifique conexão com banco de dados
- Aumente `navigationTimeout` no config

### Erro: "Element not found"

- Os seletores podem ter mudado
- Use Playwright Inspector para verificar seletores
- Adicione `waitForSelector` antes de interagir com elementos

### Screenshots não aparecem

- Screenshots são gerados apenas quando testes falham
- Use `await page.screenshot({ path: 'debug.png' })` para forçar screenshot
