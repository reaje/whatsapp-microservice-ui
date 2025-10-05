import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import ContactList from '@/components/features/chat/ContactList';
import ChatWindow from '@/components/features/chat/ChatWindow';
import NewContactModal from '@/components/features/chat/NewContactModal';
import SessionsList from '@/components/features/sessions/SessionsList';
import InitializeSessionModal from '@/components/features/sessions/InitializeSessionModal';
import QRCodeDisplay from '@/components/features/sessions/QRCodeDisplay';
import { useSession } from '@/hooks/useSession';
import { ProviderTypeEnum } from '@/types';
import { setActiveContact, setContacts, addContact, addMessage, updateMessageStatus, setTyping } from '@/store/slices/chatSlice';
import { messageService } from '@/services/message.service';
import { supabaseService } from '@/services/supabase.service';
import { fetchActiveAgents } from '@/store/slices/aiAgentSlice';
import type { RootState } from '@/store';
import type { Contact } from '@/types';

export default function ConversationsPage() {
  const dispatch = useDispatch();
  const { contacts, activeContact } = useSelector((state: RootState) => state.chat);
  const { sessions } = useSelector((state: RootState) => state.session);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewContactModal, setShowNewContactModal] = useState(false);
  // Sessões embutidas na tela de conversas
  const {
    sessions: sessionList,
    loading: sessionsLoading,
    initializeSession,
    disconnectSession,
    getSessionStatus,
    refetchSessions,
  } = useSession();
  const [showInitModal, setShowInitModal] = useState(false);
  const [qrCodePhone, setQrCodePhone] = useState<string | null>(null);

  // Get active session ID
  const activeSession = sessions.find(s => s.status === 'connected');
  const sessionId = activeSession?.id || null;
  const sessionPhone = activeSession?.phoneNumber || null;

  // Fetch conversations from API
  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      setError(null);
      try {
        const conversationsData = await messageService.getConversations();

        // Map backend data to Contact type
        const mappedContacts: Contact[] = conversationsData.map((conv: any) => ({
          id: conv.id,
          name: conv.name,
          phoneNumber: conv.phoneNumber,
          avatar: conv.avatar,
          unreadCount: conv.unreadCount || 0,
          lastMessage: conv.lastMessage ? {
            id: conv.lastMessage.id,
            sessionId: conv.lastMessage.sessionId,
            messageId: conv.lastMessage.messageId,
            fromNumber: conv.lastMessage.fromNumber,
            toNumber: conv.lastMessage.toNumber,
            type: conv.lastMessage.type,
            content: conv.lastMessage.content,
            status: conv.lastMessage.status,
            timestamp: new Date(conv.lastMessage.timestamp).toISOString(),
          } : undefined,
        }));

        dispatch(setContacts(mappedContacts));
      } catch (err: any) {
        console.error('Error fetching conversations:', err);
        setError(err.message || 'Erro ao carregar conversas');
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [dispatch]);

  // Fase 2: Buscar agentes de IA ativos ao montar a página
  useEffect(() => {
    // Ignorar erros silenciosamente em dev/E2E
    // @ts-ignore
    dispatch(fetchActiveAgents());
  }, [dispatch]);

  // Fase 2: Listener de evento de digitação (usado pelos E2E)
  useEffect(() => {
    const onTyping = (e: any) => {
      const { contactId, isTyping } = e.detail || {};
      if (!contactId) return;
      dispatch(setTyping({ contactId, isTyping: !!isTyping }));
    };
    window.addEventListener('test:typing-indicator', onTyping as EventListener);
    return () => window.removeEventListener('test:typing-indicator', onTyping as EventListener);
  }, [dispatch]);

  // Subscribe to realtime messages via Supabase
  useEffect(() => {
    const tenantId = localStorage.getItem('client_id');
    if (!tenantId) {
      console.warn('[Conversations] No tenant ID found in localStorage');
      return;
    }

    console.log('[Conversations] Setting up realtime subscriptions...');

    // Subscribe to new messages
    const messagesChannel = supabaseService.subscribeToMessagesByTenant(
      tenantId,
      (msg: any) => {
        console.log('[Conversations] New message received via realtime:', msg);

        // Normalizar campos vindos do realtime (Supabase/Postgres ou SignalR)
        const fromNumber = msg.fromNumber ?? msg.from ?? msg.from_number;
        const toNumber = msg.toNumber ?? msg.to ?? msg.to_number;
        const id = msg.id ?? msg.messageId ?? msg.message_id;
        const sessionIdMsg = msg.sessionId ?? msg.session_id;
        const type = msg.type ?? msg.message_type;
        const content = msg.content ?? (msg.text ? { text: msg.text } : undefined);
        const status = msg.status;
        const timestamp = msg.timestamp ?? msg.created_at ?? new Date().toISOString();

        // Determinar contactId baseado se mensagem é incoming ou outgoing
        const contactId = sessionPhone && fromNumber === sessionPhone ? toNumber : fromNumber;

        // Adicionar mensagem ao Redux store
        dispatch(addMessage({
          contactId,
          message: {
            id,
            sessionId: sessionIdMsg,
            messageId: msg.messageId ?? msg.message_id ?? id,
            fromNumber,
            toNumber,
            type,
            content,
            status,
            timestamp,
          }
        }));

        // Tocar som de notificação se for mensagem recebida
        if (message.fromNumber !== 'self') {
          try {
            const audio = new Audio('/notification.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => {
              // Ignore se usuário ainda não interagiu com a página
            });
          } catch (error) {
            // Ignore audio errors
          }

          // Mostrar toast notification
          toast(`Nova mensagem de ${contactId}`, {
            icon: '💬',
            duration: 3000,
          });
        }
      }
    );

    // Subscribe to message status updates
    const statusChannel = supabaseService.subscribeToMessageStatusByTenant(
      tenantId,
      (message) => {
        console.log('[Conversations] Message status updated via realtime:', message);

        const contactId = message.fromNumber === 'self'
          ? message.toNumber
          : message.fromNumber;

        dispatch(updateMessageStatus({
          contactId,
          messageId: message.messageId,
          status: message.status,
        }));
      }
    );

    // Subscribe to typing indicators (Supabase Broadcast)
    const typingChannel = supabaseService.subscribeToTypingByTenant(
      tenantId,
      (payload) => {
        if (!payload?.contactId) return;
        dispatch(setTyping({ contactId: payload.contactId, isTyping: !!payload.isTyping }));
      }
    );

    // Cleanup on unmount
    return () => {
      console.log('[Conversations] Cleaning up realtime subscriptions...');
      supabaseService.unsubscribe(`messages-tenant:${tenantId}`);
      supabaseService.unsubscribe(`message-status-tenant:${tenantId}`);
      supabaseService.unsubscribe(`typing-tenant:${tenantId}`);
    };
  }, [dispatch]);

  const handleSelectContact = (contact: Contact) => {
    dispatch(setActiveContact(contact));
  };

  const handleAddContact = async (phoneNumber: string, name: string) => {
    // Cria um novo contato local
    const newContact: Contact = {
      id: phoneNumber, // Usa o número como ID temporário
      name: name,
      phoneNumber: phoneNumber,
      unreadCount: 0,
    };

    // Adiciona o contato à lista
    dispatch(addContact(newContact));

    // Seleciona o contato automaticamente
    dispatch(setActiveContact(newContact));
  };
  // Sessões: handlers embutidos
  const handleInitializeSession = async (data: any) => {
    await initializeSession(data);
    if ((data as any).providerType === ProviderTypeEnum.Baileys || (data as any).providerType === 0) {
      setQrCodePhone(data.phoneNumber);

    }
  };
  const handleDisconnect = async (phoneNumber: string) => {
    if (confirm(`Desconectar sessão ${phoneNumber}?`)) {
      await disconnectSession(phoneNumber);
    }
  };
  const handleViewQRCode = (phoneNumber: string) => setQrCodePhone(phoneNumber);
  const handleRefreshSession = async (phoneNumber: string) => { await getSessionStatus(phoneNumber); };
  const handleReconnect = async (phoneNumber: string) => {
    const phone = phoneNumber.replace(/\D/g, '');
    await initializeSession({ phoneNumber: phone, providerType: ProviderTypeEnum.Baileys } as any);
    setQrCodePhone(phone);
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />
      {/* Sessões WhatsApp - Gerencie suas conexões (embutido) */}
      <div className="ml-64 mt-16 px-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Sessões WhatsApp</h2>
              <p className="text-gray-600">Gerencie suas conexões do WhatsApp</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => refetchSessions()} className="btn-secondary">Atualizar</button>
              <button onClick={() => setShowInitModal(true)} className="btn-primary">Nova Sessão</button>
            </div>
          </div>
          <div className="mt-4">
            <SessionsList
              sessions={sessionList}
              loading={sessionsLoading}
              onDisconnect={handleDisconnect}
              onViewQRCode={handleViewQRCode}
              onRefresh={handleRefreshSession}
              onReconnect={handleReconnect}
            />
          </div>
        </div>
      </div>

      <div className="ml-64 mt-16 h-[calc(100vh-4rem)] flex bg-gray-100">
        {/* Contact List - Left Sidebar */}
        {/* Se n e3o houver sess e3o ativa, o chat fica bloqueado (j e1 h e1 mensagem de aviso abaixo) */}

        <div className="w-96 flex-shrink-0">
          <ContactList
            contacts={contacts}
            activeContactId={activeContact?.id}
            onSelectContact={handleSelectContact}
            onNewContact={() => setShowNewContactModal(true)}
            loading={loading}
          />
        </div>

        {/* Chat Window - Main Area */}
        <div className="flex-1">
          {error ? (
            <div className="h-full flex items-center justify-center bg-gray-50">
              <div className="text-center text-red-500">
                <p className="text-lg font-medium mb-2">Erro ao carregar conversas</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          ) : activeContact && sessionId ? (
            <ChatWindow
              contact={activeContact}
              sessionId={sessionId}
              sessionPhoneNumber={sessionPhone || ''}
            />
          ) : activeContact && !sessionId ? (
            <div className="h-full flex items-center justify-center bg-gray-50">
              <div className="text-center text-yellow-600">
                <p className="text-lg font-medium mb-2">Nenhuma sessão ativa</p>
                <p className="text-sm">Conecte uma sessão WhatsApp para enviar mensagens</p>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-50">
              <div className="text-center text-gray-500">
                <MessageSquare className="w-24 h-24 mx-auto mb-4 text-gray-400" />
                <p className="text-xl font-medium mb-2">
                  Selecione uma conversa
                </p>
                <p className="text-sm">
                  Escolha um contato da lista para iniciar
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Contact Modal */}
      <NewContactModal
        isOpen={showNewContactModal}
        onClose={() => setShowNewContactModal(false)}
        onAddContact={handleAddContact}
      />
      {/* Modais de Sessões embutidos */}
      {showInitModal && (
        <InitializeSessionModal
          onClose={() => setShowInitModal(false)}
          onSubmit={handleInitializeSession}
        />
      )}
      {qrCodePhone && (
        <QRCodeDisplay
          phoneNumber={qrCodePhone}
          onClose={() => setQrCodePhone(null)}
          onConnected={() => {
            refetchSessions();
          }}
        />
      )}

    </div>
  );
}
