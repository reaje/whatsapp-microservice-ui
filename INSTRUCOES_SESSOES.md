# 🚀 Instruções para Testar a Tela de Sessões

## ✅ Configurações Atualizadas

O frontend foi configurado para se conectar ao backend em:
- **Backend URL**: `https://localhost:44316/api/v1`

### Arquivos Atualizados:
1. ✅ `frontend/.env` - URL da API atualizada
2. ✅ `frontend/src/utils/constants.ts` - Fallback da URL atualizado
3. ✅ `frontend/vite.config.ts` - Proxy configurado com `secure: false`
4. ✅ `frontend/src/services/auth.service.ts` - Endpoints de autenticação corrigidos
5. ✅ `frontend/src/services/session.service.ts` - Endpoints de sessão corrigidos
6. ✅ `frontend/src/types/session.types.ts` - Tipos atualizados para corresponder à API

---

## 🔧 Passo 1: Aceitar o Certificado SSL Self-Signed

Como o backend usa HTTPS com certificado self-signed, você precisa aceitar o certificado no navegador:

1. **Abra o navegador** e acesse: `https://localhost:44316/scalar/v1`
2. O navegador mostrará um aviso de segurança
3. Clique em **"Avançado"** ou **"Advanced"**
4. Clique em **"Continuar para localhost (não seguro)"** ou **"Proceed to localhost (unsafe)"**
5. Você verá a documentação Scalar da API - isso confirma que o certificado foi aceito

---

## 🔧 Passo 2: Reiniciar o Frontend

Para aplicar as novas configurações, você precisa reiniciar o servidor de desenvolvimento:

1. **Pare o servidor frontend** (Ctrl+C no terminal onde está rodando)
2. **Inicie novamente**:
   ```bash
   cd frontend
   npm run dev
   ```
3. Aguarde a mensagem: `Local: http://localhost:3000/`

---

## 🔧 Passo 3: Fazer Login

1. Abra o navegador em: `http://localhost:3000`
2. Você será redirecionado para a tela de login
3. Use as credenciais padrão:
   - **Client ID**: `a4876b9d-8ce5-4b67-ab69-c04073ce2f80`
   - **Email**: `admin@test.com`
   - **Senha**: `Admin@123`
4. Clique em **"Entrar"**

---

## 🔧 Passo 4: Acessar a Tela de Sessões

1. Após o login, você será redirecionado para o Dashboard
2. No menu lateral, clique em **"Sessões"** ou acesse diretamente: `http://localhost:3000/sessions`
3. A tela de sessões deve carregar e exibir:
   - **Header**: "Sessões WhatsApp" com botões "Atualizar" e "Nova Sessão"
   - **Lista de Sessões**: Todas as sessões ativas do tenant

---

## 🎯 Funcionalidades da Tela de Sessões

### 1. **Visualizar Sessões**
- Lista todas as sessões WhatsApp do tenant
- Mostra status (Conectado/Desconectado/Conectando)
- Exibe provider (Baileys/Meta API)
- Mostra data de conexão e última atualização

### 2. **Criar Nova Sessão**
1. Clique no botão **"Nova Sessão"**
2. Preencha o formulário:
   - **Número de Telefone**: Ex: `5571991776091` (apenas números)
   - **Provider**: Selecione "Baileys" ou "Meta API"
3. Clique em **"Inicializar"**
4. Se escolheu Baileys, um QR Code será exibido para escanear com WhatsApp

### 3. **Ver QR Code**
- Para sessões Baileys desconectadas, clique no ícone de QR Code
- Escaneie o QR Code com o WhatsApp do celular
- A sessão será conectada automaticamente

### 4. **Atualizar Status**
- Clique no ícone de refresh em uma sessão específica
- Ou clique no botão **"Atualizar"** no header para atualizar todas

### 5. **Desconectar Sessão**
1. Clique no menu (três pontos) de uma sessão
2. Clique em **"Desconectar"**
3. Confirme a ação

---

## 🐛 Troubleshooting

### Erro: "Network Error" ou "ERR_CONNECTION_REFUSED"

**Causa**: O navegador não aceitou o certificado SSL ou o backend não está rodando.

**Solução**:
1. Verifique se o backend está rodando em `https://localhost:44316`
2. Acesse `https://localhost:44316/scalar/v1` no navegador e aceite o certificado
3. Reinicie o frontend (Ctrl+C e `npm run dev`)
4. Faça um hard refresh no navegador (Ctrl+Shift+R)

### Erro: "401 Unauthorized"

**Causa**: Token de autenticação inválido ou expirado.

**Solução**:
1. Faça logout (se houver opção)
2. Limpe o localStorage do navegador:
   - Abra DevTools (F12)
   - Vá em "Application" > "Local Storage" > `http://localhost:3000`
   - Clique com botão direito e "Clear"
3. Recarregue a página e faça login novamente

### Erro: "400 Bad Request" ao criar sessão

**Causa**: Dados inválidos no formulário.

**Solução**:
1. Certifique-se de que o número de telefone contém apenas dígitos
2. Inclua o código do país (Ex: 55 para Brasil)
3. Formato correto: `5571991776091` (sem espaços, parênteses ou hífens)

### Sessões não aparecem na lista

**Causa**: Pode não haver sessões criadas para o tenant.

**Solução**:
1. Crie uma nova sessão usando o botão "Nova Sessão"
2. Verifique o console do navegador (F12) para erros
3. Verifique se o `X-Client-Id` está sendo enviado nos headers da requisição

---

## 📊 Verificar Requisições no DevTools

Para debugar problemas, abra o DevTools (F12) e vá em "Network":

1. **Filtrar por "Session"** para ver requisições relacionadas
2. **Verificar Headers**:
   - `Authorization: Bearer <token>`
   - `X-Client-Id: a4876b9d-8ce5-4b67-ab69-c04073ce2f80`
3. **Verificar Response**:
   - Status 200 = Sucesso
   - Status 401 = Não autenticado
   - Status 400 = Dados inválidos
   - Status 500 = Erro no servidor

---

## 🎨 Componentes da Tela

### Estrutura de Componentes:
```
SessionsPage (pages/Sessions/index.tsx)
├── MainLayout (layout wrapper)
├── Header (título + botões)
├── SessionsList (lista de sessões)
│   └── SessionCard (card individual)
│       ├── Status badge
│       ├── Provider info
│       ├── Datas
│       └── Botões de ação
├── InitializeSessionModal (modal de criação)
└── QRCodeDisplay (modal de QR Code)
```

### Hooks Utilizados:
- `useSession()` - Gerencia estado e operações de sessões
- `useQuery()` - Cache e refetch automático (React Query)
- `useDispatch()` / `useSelector()` - Redux para estado global

---

## 📝 Logs de Debug

O serviço de sessões inclui logs no console para facilitar debug:

```
🔄 Fetching all sessions from /Session endpoint
✅ Sessions API response: [...]
✅ Mapped sessions: [...]
```

Se houver erro:
```
❌ Error fetching sessions: AxiosError {...}
```

Verifique esses logs no console do navegador (F12 > Console).

---

## ✅ Checklist de Teste

- [ ] Backend rodando em `https://localhost:44316`
- [ ] Certificado SSL aceito no navegador
- [ ] Frontend rodando em `http://localhost:3000`
- [ ] Login realizado com sucesso
- [ ] Tela de sessões carrega sem erros
- [ ] Lista de sessões é exibida (ou mensagem "Nenhuma sessão encontrada")
- [ ] Botão "Nova Sessão" abre o modal
- [ ] Formulário de nova sessão valida campos
- [ ] QR Code é exibido para sessões Baileys
- [ ] Botão "Atualizar" recarrega a lista
- [ ] Botão "Desconectar" funciona corretamente

---

## 🚀 Próximos Passos

Após confirmar que a tela está funcionando:

1. **Testar criação de sessão Baileys**
2. **Escanear QR Code e conectar WhatsApp**
3. **Enviar mensagens de teste**
4. **Verificar atualização de status em tempo real**
5. **Testar desconexão de sessão**

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do console do navegador (F12)
2. Verifique os logs do backend no terminal
3. Verifique se todas as configurações foram aplicadas corretamente
4. Reinicie tanto o frontend quanto o backend se necessário

