# Teste da Tela Conversations

## Configuração

A tela de Conversations foi implementada e configurada para integrar com a API local.

### Configuração da API

O frontend está configurado para conectar com a API em: `http://localhost:5278/api/v1`

Arquivo: `.env`
```env
VITE_API_URL=http://localhost:5278/api/v1
```

## Endpoints Utilizados

### 1. Listar Conversas
- **Endpoint**: `GET /api/v1/Message/conversations`
- **Headers**:
  - `X-Client-Id: <tenant-client-id>`
  - `Authorization: Bearer <jwt-token>`
- **Resposta**: Array de conversas com informações de contato e última mensagem

### 2. Histórico de Mensagens
- **Endpoint**: `GET /api/v1/Message/history/{phoneNumber}?limit=100`
- **Headers**:
  - `X-Client-Id: <tenant-client-id>`
  - `Authorization: Bearer <jwt-token>`
- **Parâmetros**:
  - `phoneNumber`: Número do contato (path parameter)
  - `limit`: Quantidade de mensagens (query parameter, padrão: 100)

### 3. Enviar Mensagem de Texto
- **Endpoint**: `POST /api/v1/Message/text`
- **Headers**:
  - `X-Client-Id: <tenant-client-id>`
  - `Authorization: Bearer <jwt-token>`
- **Body**:
```json
{
  "to": "5511999999999",
  "content": "Mensagem de texto"
}
```

### 4. Enviar Mídia
- **Endpoint**: `POST /api/v1/Message/media`
- **Headers**:
  - `X-Client-Id: <tenant-client-id>`
  - `Authorization: Bearer <jwt-token>`
- **Body**:
```json
{
  "to": "5511999999999",
  "mediaBase64": "data:image/png;base64,...",
  "mediaType": "image",
  "caption": "Legenda opcional"
}
```
- **mediaType**: `image` | `video` | `document`

### 5. Enviar Áudio
- **Endpoint**: `POST /api/v1/Message/audio`
- **Headers**:
  - `X-Client-Id: <tenant-client-id>`
  - `Authorization: Bearer <jwt-token>`
- **Body**:
```json
{
  "to": "5511999999999",
  "audioBase64": "data:audio/ogg;base64,..."
}
```

### 6. Enviar Localização
- **Endpoint**: `POST /api/v1/Message/location`
- **Headers**:
  - `X-Client-Id: <tenant-client-id>`
  - `Authorization: Bearer <jwt-token>`
- **Body**:
```json
{
  "to": "5511999999999",
  "latitude": -23.550520,
  "longitude": -46.633308
}
```

## Como Testar

### Pré-requisitos

1. **Backend API rodando**:
   ```bash
   cd backend/src/WhatsApp.API
   dotnet run --urls "http://localhost:5278"
   ```

2. **Baileys Service rodando**:
   ```bash
   cd baileys-service
   npm run dev
   ```

3. **Frontend rodando**:
   ```bash
   cd frontend
   npm run dev
   ```

### Passo a Passo

1. **Login**:
   - Acesse: http://localhost:3000/login
   - Use as credenciais de teste:
     - Email: `admin@test.com`
     - Password: `Admin@123`
     - Client ID: `test-client-001`

2. **Conectar Sessão WhatsApp**:
   - Acesse: http://localhost:3000/sessions
   - Clique em "Nova Sessão"
   - Escaneie o QR Code com WhatsApp
   - Aguarde status "Conectado"

3. **Acessar Conversations**:
   - Acesse: http://localhost:3000/conversations
   - Verifique se a lista de conversas carrega
   - Selecione um contato da lista

4. **Testar Envio de Mensagens**:

   **Mensagem de Texto**:
   - Digite uma mensagem no campo de input
   - Pressione Enter ou clique no botão enviar
   - Verifique se a mensagem aparece na tela
   - Verifique o status da mensagem (enviando → enviado)

   **Mídia (Imagem/Vídeo/Documento)**:
   - Clique no ícone de anexo
   - Selecione "Imagem", "Vídeo" ou "Documento"
   - Escolha um arquivo
   - Adicione legenda (opcional)
   - Clique em enviar
   - Verifique se a mídia aparece na conversa

   **Áudio**:
   - Clique no ícone de anexo
   - Selecione "Áudio"
   - Grave um áudio
   - Clique em enviar
   - Verifique se o áudio aparece na conversa

   **Localização**:
   - Clique no ícone de anexo
   - Selecione "Localização"
   - Escolha uma localização no mapa
   - Clique em enviar
   - Verifique se a localização aparece na conversa

5. **Testar Recebimento de Mensagens**:
   - Envie uma mensagem do WhatsApp para o número conectado
   - Verifique se a mensagem aparece na lista de conversas
   - Verifique se a mensagem aparece na janela de chat
   - Verifique se o contador de não lidas é atualizado

6. **Testar Realtime (Supabase)**:
   - Com uma conversa aberta, envie uma mensagem de outro dispositivo
   - Verifique se a mensagem aparece automaticamente sem refresh
   - Verifique se o status da mensagem é atualizado em tempo real

## Arquivos Modificados

1. **`.env`**: Atualizado URL da API para `http://localhost:5278/api/v1`

2. **`src/hooks/useMessage.ts`**:
   - Alterado para buscar mensagens via `messageService.getMessageHistory()`
   - Mapeamento correto dos dados da API para o tipo `Message`

3. **`src/components/features/chat/ChatWindow/index.tsx`**:
   - Corrigidos parâmetros de `sendMedia()` para usar `mediaBase64`
   - Corrigidos parâmetros de `sendAudio()` para usar `audioBase64`
   - Removidos parâmetros não utilizados pela API

## Troubleshooting

### Erro: "Network Error" ou CORS

**Sintoma**: `Access to XMLHttpRequest blocked by CORS policy: No 'Access-Control-Allow-Origin' header`

**Causa**: O backend .NET não está configurado para permitir requisições do frontend.

**Solução**: Configure CORS no backend. Veja instruções detalhadas em **CORS_FIX.md**.

**Passos rápidos**:

1. Abra `backend/src/WhatsApp.API/Program.cs`

2. Adicione antes de `builder.Build()`:
   ```csharp
   builder.Services.AddCors(options =>
   {
       options.AddPolicy("AllowFrontend", policy =>
       {
           policy.WithOrigins("http://localhost:3000")
                 .AllowAnyHeader()
                 .AllowAnyMethod()
                 .AllowCredentials();
       });
   });
   ```

3. Adicione depois de `app.UseRouting()` e ANTES de `app.UseAuthentication()`:
   ```csharp
   app.UseCors("AllowFrontend");
   ```

4. Reinicie o backend:
   ```bash
   cd backend/src/WhatsApp.API
   dotnet run --urls "http://localhost:5278"
   ```

### Erro: "Unauthorized" (401)
- Verifique se o token JWT é válido
- Faça logout e login novamente
- Verifique se o `X-Client-Id` header está sendo enviado

### Erro: "Nenhuma sessão ativa"
- Acesse a página Sessions
- Conecte uma sessão WhatsApp
- Aguarde o status "Conectado"

### Mensagens não aparecem
- Abra o DevTools (F12)
- Verifique a aba Network para ver as chamadas à API
- Verifique a aba Console para erros JavaScript
- Verifique se a resposta da API está no formato esperado

### Realtime não funciona
- Verifique se as credenciais do Supabase estão corretas no `.env`
- Verifique se a tabela `messages` existe no Supabase
- Verifique o console do navegador para erros de WebSocket

## Próximos Passos

- [ ] Implementar paginação no histórico de mensagens
- [ ] Implementar busca de mensagens
- [ ] Implementar filtros de tipo de mensagem
- [ ] Implementar notificações desktop
- [ ] Implementar indicador de "digitando..."
- [ ] Implementar agrupamento de mensagens por data
- [ ] Implementar download de mídias
- [ ] Implementar compartilhamento de contatos
