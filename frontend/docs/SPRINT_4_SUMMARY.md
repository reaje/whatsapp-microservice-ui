# Sprint 4 - Envio de Mídia, Áudio e Localização ✅

## 📅 Data: 2025-01-10
## Status: ✅ Concluído

---

## 🎯 Objetivos da Sprint

Implementar funcionalidade completa para envio de diferentes tipos de mensagens:
- ✅ Upload de imagens com preview
- ✅ Upload de vídeos com preview
- ✅ Upload de documentos
- ✅ Gravação e envio de áudio
- ✅ Seleção e envio de localização GPS
- ✅ Menu de anexos interativo
- ✅ Preview antes de enviar mídia
- ✅ Conversão de arquivos para base64
- ✅ Validação de tamanho e tipo de arquivo

---

## 📦 Componentes Implementados

### 1. **FileUpload** (`src/components/common/FileUpload/`)

Componente universal para upload de arquivos com suporte a drag-and-drop.

**Funcionalidades:**
- ✅ Drag-and-drop de arquivos
- ✅ Validação de tipo de arquivo
- ✅ Validação de tamanho (configurável por tipo)
- ✅ Preview de imagens
- ✅ Preview de vídeos com player
- ✅ Conversão automática para base64
- ✅ Estados de loading e erro
- ✅ Suporte para 3 tipos: image, video, document
- ✅ Limites de tamanho: Imagem (10MB), Vídeo (50MB), Documento (10MB)

**Props:**
```typescript
interface FileUploadProps {
  accept?: string;
  maxSize?: number; // in MB
  fileType: 'image' | 'video' | 'document';
  onFileSelect: (file: File, base64: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
}
```

**Features Especiais:**
- Área clicável e arrastar-soltar
- Ícones diferenciados por tipo
- Mensagens de erro amigáveis
- Limpeza automática de recursos

---

### 2. **VoiceRecorder** (`src/components/common/VoiceRecorder/`)

Componente completo para gravação de áudio com controles avançados.

**Funcionalidades:**
- ✅ Gravação de áudio usando MediaRecorder API
- ✅ Controles: Gravar, Pausar, Retomar, Parar
- ✅ Timer em tempo real (MM:SS)
- ✅ Limite de tempo configurável (padrão: 5 minutos)
- ✅ Preview com player de áudio
- ✅ Visualização de forma de onda (simulada)
- ✅ Conversão para base64
- ✅ Retorno de duração da gravação
- ✅ Cancelamento com limpeza de recursos
- ✅ Gerenciamento de permissões de microfone

**Props:**
```typescript
interface VoiceRecorderProps {
  onAudioReady: (audioBlob: Blob, base64: string, duration: number) => void;
  onCancel?: () => void;
  maxDuration?: number; // in seconds, default: 300
}
```

**Fluxo de Gravação:**
```
1. Solicitar permissão do microfone
2. Iniciar gravação → Timer começa
3. Pausar/Retomar conforme necessário
4. Parar gravação
5. Preview do áudio gravado
6. Enviar ou Deletar
```

**Configurações de Áudio:**
- Echo cancellation: ativado
- Noise suppression: ativado
- Sample rate: 44100 Hz
- Formato: webm ou mp4 (conforme suporte do navegador)

---

### 3. **LocationPicker** (`src/components/common/LocationPicker/`)

Componente para captura e envio de localização GPS.

**Funcionalidades:**
- ✅ Geolocalização automática usando Geolocation API
- ✅ Mapa estático com marcador de localização
- ✅ Reverse geocoding para obter endereço
- ✅ Exibição de latitude/longitude
- ✅ Link para Google Maps
- ✅ Botão de atualização de localização
- ✅ Estados de loading e erro
- ✅ Tratamento de permissões negadas

**Props:**
```typescript
interface LocationPickerProps {
  onLocationSelect: (location: {
    latitude: number;
    longitude: number;
    address?: string;
  }) => void;
  onCancel?: () => void;
}
```

**APIs Utilizadas:**
- **Geolocation API**: Captura de coordenadas GPS
- **Nominatim (OpenStreetMap)**: Reverse geocoding gratuito
- **Static Map Service**: Renderização de mapa estático

**Precisão:**
- High accuracy mode habilitado
- Timeout: 10 segundos
- Máximo age: 0 (sempre busca nova posição)

---

### 4. **MediaPreview** (`src/components/features/chat/MediaPreview/`)

Modal de preview antes de enviar mídia.

**Funcionalidades:**
- ✅ Preview de imagens em alta resolução
- ✅ Preview de vídeos com controles
- ✅ Preview de documentos com ícone e informações
- ✅ Campo de legenda opcional (até 1024 caracteres)
- ✅ Auto-resize da textarea de legenda
- ✅ Exibição de nome e tamanho do arquivo
- ✅ Botões: Cancelar e Enviar
- ✅ Modal responsivo com scroll

**Props:**
```typescript
interface MediaPreviewProps {
  file: File;
  base64: string;
  type: 'image' | 'video' | 'document';
  onSend: (base64: string, caption?: string) => void;
  onCancel: () => void;
}
```

**Layout:**
- Header: Título + Nome do arquivo
- Preview Area: Conteúdo visual ou ícone
- Caption Input: Textarea com contador
- Footer: Informações do arquivo (tamanho, tipo)

---

### 5. **AttachmentMenu** (`src/components/features/chat/AttachmentMenu/`)

Menu popup com opções de anexo.

**Funcionalidades:**
- ✅ Grid de 3 colunas com 5 opções
- ✅ Ícones coloridos por tipo
- ✅ Animação de abertura/fechamento
- ✅ Clique fora para fechar
- ✅ Tecla ESC para fechar
- ✅ Design responsivo

**Opções Disponíveis:**
1. **Imagem** 📷 (roxo)
2. **Vídeo** 🎥 (vermelho)
3. **Documento** 📄 (azul)
4. **Áudio** 🎵 (verde)
5. **Localização** 📍 (laranja)

**Props:**
```typescript
interface AttachmentMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: AttachmentType) => void;
}

type AttachmentType = 'image' | 'video' | 'document' | 'audio' | 'location';
```

---

### 6. **MessageInput (Atualizado)** (`src/components/features/chat/MessageInput/`)

Input de mensagens agora integrado com todos os tipos de anexo.

**Novas Funcionalidades:**
- ✅ Botão de anexo que abre AttachmentMenu
- ✅ Gerenciamento de modais para cada tipo
- ✅ Integração com FileUpload para imagens/vídeos/documentos
- ✅ Integração com VoiceRecorder para áudio
- ✅ Integração com LocationPicker para localização
- ✅ Integração com MediaPreview para confirmação
- ✅ Callbacks para cada tipo de envio

**Props Atualizadas:**
```typescript
interface MessageInputProps {
  onSend: (message: string) => void;
  onSendMedia?: (file: File, base64: string, type: MessageType, caption?: string) => void;
  onSendAudio?: (audioBlob: Blob, base64: string, duration: number) => void;
  onSendLocation?: (latitude: number, longitude: number, address?: string) => void;
  disabled?: boolean;
  placeholder?: string;
}
```

**Estados Gerenciados:**
- `showAttachmentMenu`: Controla menu de anexos
- `showFileUpload`: Modal de upload de arquivo
- `showVoiceRecorder`: Modal de gravação de áudio
- `showLocationPicker`: Modal de seleção de localização
- `selectedFile`: Arquivo selecionado aguardando preview

---

### 7. **ChatWindow (Atualizado)** (`src/components/features/chat/ChatWindow/`)

Janela de chat agora com handlers para todos os tipos de mensagem.

**Novos Handlers:**
```typescript
// Envio de mídia (imagem, vídeo, documento)
const handleSendMedia = async (
  file: File,
  base64: string,
  type: 'image' | 'video' | 'document',
  caption?: string
) => {
  await sendMedia({
    to: contact.phoneNumber,
    mediaType: type,
    mediaData: base64,
    caption,
    fileName: file.name,
  });
};

// Envio de áudio
const handleSendAudio = async (
  audioBlob: Blob,
  base64: string,
  duration: number
) => {
  await sendAudio({
    to: contact.phoneNumber,
    audioData: base64,
    duration,
  });
};

// Envio de localização
const handleSendLocation = async (
  latitude: number,
  longitude: number,
  address?: string
) => {
  await sendLocation({
    to: contact.phoneNumber,
    latitude,
    longitude,
    address,
  });
};
```

---

## 🔄 Fluxos Implementados

### **Fluxo 1: Enviar Imagem/Vídeo/Documento**
```
1. Usuário clica no botão de anexo
2. AttachmentMenu abre com opções
3. Usuário seleciona tipo (imagem/vídeo/documento)
4. Modal FileUpload abre
5. Usuário seleciona arquivo (clique ou drag-and-drop)
6. Validação de tipo e tamanho
7. Conversão para base64
8. MediaPreview abre com preview do arquivo
9. Usuário adiciona legenda (opcional)
10. Usuário clica "Enviar"
11. Handler apropriado é chamado
12. useMessage envia para backend
13. Mensagem aparece no chat
```

### **Fluxo 2: Gravar e Enviar Áudio**
```
1. Usuário clica no botão de anexo
2. AttachmentMenu abre
3. Usuário seleciona "Áudio"
4. Modal VoiceRecorder abre
5. Permissão de microfone solicitada
6. Usuário inicia gravação
7. Timer conta o tempo (até 5 min)
8. Usuário pode pausar/retomar
9. Usuário para a gravação
10. Preview do áudio é exibido
11. Usuário ouve o preview (opcional)
12. Usuário clica "Enviar Áudio"
13. Conversão para base64
14. Handler sendAudio é chamado
15. Mensagem de áudio aparece no chat
```

### **Fluxo 3: Enviar Localização**
```
1. Usuário clica no botão de anexo
2. AttachmentMenu abre
3. Usuário seleciona "Localização"
4. Modal LocationPicker abre
5. Permissão de geolocalização solicitada
6. GPS captura coordenadas
7. Reverse geocoding busca endereço
8. Mapa estático é carregado
9. Endereço, lat/lng são exibidos
10. Usuário pode atualizar localização
11. Usuário clica "Enviar Localização"
12. Handler sendLocation é chamado
13. Mensagem de localização aparece no chat
```

---

## 🎨 Design e UX

### **Modais**
- Fundo escuro com opacidade (bg-black/80)
- Tamanho máximo: 2xl (672px)
- Altura máxima: 90vh (scroll interno)
- Animação de fade-in
- Botão X para fechar

### **AttachmentMenu**
- Grid 3x2 responsivo
- Ícones grandes (56px) com cores temáticas
- Efeito de hover: scale(1.05)
- Posicionamento: bottom-full (acima do botão)
- Z-index: 50

### **Cores por Tipo**
- Imagem: Roxo (#9333EA)
- Vídeo: Vermelho (#DC2626)
- Documento: Azul (#2563EB)
- Áudio: Verde (#16A34A)
- Localização: Laranja (#EA580C)

### **Estados Visuais**
- Loading: Spinner animado
- Error: Banner vermelho com mensagem
- Success: Toast de confirmação
- Disabled: Opacidade 50%

---

## 📊 Estatísticas da Sprint

### Arquivos Criados/Modificados
- `src/components/common/FileUpload/index.tsx` (280 linhas) ✨ NOVO
- `src/components/common/VoiceRecorder/index.tsx` (360 linhas) ✨ NOVO
- `src/components/common/LocationPicker/index.tsx` (270 linhas) ✨ NOVO
- `src/components/features/chat/MediaPreview/index.tsx` (180 linhas) ✨ NOVO
- `src/components/features/chat/AttachmentMenu/index.tsx` (150 linhas) ✨ NOVO
- `src/components/features/chat/MessageInput/index.tsx` (ATUALIZADO +130 linhas)
- `src/components/features/chat/ChatWindow/index.tsx` (ATUALIZADO +60 linhas)

**Total:** ~1,430 linhas de código

### Componentes
- 5 componentes novos
- 2 componentes atualizados
- 7 componentes no total

### Features
- 5 tipos de anexo implementados
- 3 fluxos completos de envio
- Base64 encoding para todos os tipos
- Validações de arquivo

---

## ✅ Checklist da Sprint 4

- [x] Criar componente FileUpload
- [x] Suporte a drag-and-drop
- [x] Validação de tipo de arquivo
- [x] Validação de tamanho de arquivo
- [x] Preview de imagens
- [x] Preview de vídeos
- [x] Conversão para base64
- [x] Criar componente VoiceRecorder
- [x] Gravação de áudio
- [x] Controles de pausar/retomar
- [x] Timer de gravação
- [x] Preview de áudio
- [x] Limite de tempo de gravação
- [x] Criar componente LocationPicker
- [x] Captura de GPS
- [x] Reverse geocoding
- [x] Mapa estático
- [x] Link para Google Maps
- [x] Criar componente MediaPreview
- [x] Preview antes de enviar
- [x] Campo de legenda
- [x] Criar componente AttachmentMenu
- [x] Grid de opções
- [x] Ícones coloridos
- [x] Atualizar MessageInput
- [x] Integrar AttachmentMenu
- [x] Gerenciar modais
- [x] Callbacks para cada tipo
- [x] Atualizar ChatWindow
- [x] Handlers de mídia
- [x] Handlers de áudio
- [x] Handlers de localização

---

## 🧪 Funcionalidades Testáveis

### 1. Upload de Imagem
```
1. Abrir conversa
2. Clicar em botão de anexo
3. Selecionar "Imagem"
4. Arrastar imagem para área de drop
5. Verificar preview da imagem
6. Adicionar legenda
7. Clicar "Enviar"
8. Verificar mensagem no chat
```

### 2. Gravação de Áudio
```
1. Abrir conversa
2. Clicar em botão de anexo
3. Selecionar "Áudio"
4. Permitir acesso ao microfone
5. Clicar "Iniciar Gravação"
6. Falar algo
7. Pausar e retomar
8. Parar gravação
9. Ouvir preview
10. Enviar áudio
11. Verificar mensagem no chat
```

### 3. Envio de Localização
```
1. Abrir conversa
2. Clicar em botão de anexo
3. Selecionar "Localização"
4. Permitir acesso à localização
5. Aguardar GPS capturar
6. Verificar mapa e endereço
7. Clicar "Enviar Localização"
8. Verificar mensagem no chat
```

### 4. Upload de Documento
```
1. Abrir conversa
2. Clicar em botão de anexo
3. Selecionar "Documento"
4. Escolher PDF
5. Verificar validação de tamanho
6. Visualizar preview
7. Enviar
8. Verificar mensagem no chat
```

### 5. Upload de Vídeo
```
1. Abrir conversa
2. Clicar em botão de anexo
3. Selecionar "Vídeo"
4. Escolher arquivo MP4
5. Aguardar preview carregar
6. Reproduzir preview
7. Adicionar legenda
8. Enviar
9. Verificar mensagem no chat
```

---

## 🔧 Integrações

### APIs do Navegador

**FileReader API:**
```typescript
const reader = new FileReader();
reader.readAsDataURL(file);
reader.onload = () => {
  const base64 = reader.result as string;
  const base64Data = base64.split(',')[1];
};
```

**MediaRecorder API:**
```typescript
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const mediaRecorder = new MediaRecorder(stream);
mediaRecorder.ondataavailable = (event) => {
  audioChunks.push(event.data);
};
```

**Geolocation API:**
```typescript
navigator.geolocation.getCurrentPosition(
  (position) => {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
  },
  (error) => { /* handle error */ },
  { enableHighAccuracy: true }
);
```

### Backend API

```typescript
// Endpoints utilizados:
- POST /api/v1/message/media
  Body: { to, mediaType, mediaData, caption?, fileName? }

- POST /api/v1/message/audio
  Body: { to, audioData, duration }

- POST /api/v1/message/location
  Body: { to, latitude, longitude, address? }
```

### Serviços Externos

**Nominatim (OpenStreetMap):**
- URL: https://nominatim.openstreetmap.org/reverse
- Propósito: Reverse geocoding (coordenadas → endereço)
- Gratuito, sem API key

**Static Map Service:**
- URL: https://staticmap.openstreetmap.de/staticmap.php
- Propósito: Renderizar mapa estático
- Gratuito, sem API key

---

## 🐛 Pontos de Atenção

### Permissões do Navegador
⚠️ **Microfone** - Gravação de áudio requer permissão do usuário. Tratar recusas graciosamente.

⚠️ **Geolocalização** - GPS pode ser bloqueado ou impreciso. Fornecer feedback claro.

⚠️ **HTTPS** - MediaRecorder e Geolocation só funcionam em HTTPS (exceto localhost).

### Performance
⚠️ **Tamanho de Arquivo** - Base64 aumenta tamanho em ~33%. Considerar compressão no backend.

⚠️ **Vídeos Grandes** - Upload de vídeos de 50MB pode demorar. Mostrar progresso (futuro).

⚠️ **Memória** - Blob de áudio gravado fica na memória. Limpeza é essencial.

### Compatibilidade
⚠️ **Safari** - MediaRecorder pode ter limitações. Testar em iOS.

⚠️ **Formatos de Áudio** - Alguns navegadores usam webm, outros mp4. Backend deve suportar ambos.

⚠️ **Mapa Estático** - Serviço pode ficar offline. Implementar fallback.

### UX
⚠️ **Feedback de Envio** - Arquivos grandes podem demorar. Considerar barra de progresso.

⚠️ **Cancelamento** - Permitir cancelar uploads em andamento (futuro).

⚠️ **Retentativas** - Implementar retry automático em caso de falha (futuro).

---

## 🚀 Melhorias Futuras

### Funcionalidades
1. **Compressão de Imagem** - Reduzir tamanho antes de enviar
2. **Crop de Imagem** - Editor para cortar/rotacionar imagens
3. **Filtros de Imagem** - Adicionar filtros antes de enviar
4. **Upload de Múltiplos Arquivos** - Enviar várias imagens de uma vez
5. **Galeria** - Picker de mídia do dispositivo
6. **Câmera** - Capturar foto/vídeo direto da câmera
7. **Desenho em Imagem** - Adicionar anotações/setas
8. **GIFs** - Suporte para buscar e enviar GIFs
9. **Stickers** - Criar e enviar stickers personalizados
10. **Visualização de Mapa Interativo** - Mapa draggable para escolher localização

### Performance
1. **Upload em Chunks** - Dividir arquivos grandes
2. **Compressão de Vídeo** - Reduzir qualidade antes de enviar
3. **Lazy Loading de Modais** - Carregar componentes sob demanda
4. **WebWorker para Base64** - Não bloquear UI durante conversão
5. **Service Worker para Cache** - Cachear arquivos localmente

### UX
1. **Barra de Progresso** - Mostrar % de upload
2. **Botão de Cancelar** - Cancelar upload em andamento
3. **Preview em Thumbnail** - Mostrar preview pequeno antes de abrir modal
4. **Histórico de Localização** - Salvar locais frequentes
5. **Templates de Mensagem** - Mensagens rápidas com mídia
6. **Arrastar Mídia Direto** - Drag-and-drop na janela de chat

---

## 📝 Próximos Passos (Sprint 5)

### Dashboard com Métricas
1. Implementar gráficos de mensagens enviadas/recebidas
2. Estatísticas de sessões ativas/inativas
3. Contadores de mensagens por tipo
4. Tempo médio de resposta
5. Taxa de entrega/leitura
6. Overview de uso do sistema

### Estimativa: 1 semana

---

## 🎉 Resultado

✅ **Sprint 4 - 100% Completa**

O sistema agora suporta **envio completo de mídia**:
- ✅ Imagens com preview e legenda
- ✅ Vídeos com preview e player
- ✅ Documentos com validação
- ✅ Áudio com gravação profissional
- ✅ Localização GPS com mapa
- ✅ Menu de anexos intuitivo
- ✅ Conversão automática para base64
- ✅ Validações de segurança
- ✅ UX polida e responsiva

**Próxima etapa:** Sprint 5 - Dashboard com Métricas e Analytics

---

**Desenvolvido por:** Equipe Frontend Ventry
**Data:** Janeiro 2025
**Status:** 🟢 Pronto para Uso
