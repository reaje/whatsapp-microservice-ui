import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import ContactList from '@/components/features/chat/ContactList';
import ChatWindow from '@/components/features/chat/ChatWindow';
import NewContactModal from '@/components/features/chat/NewContactModal';
import { setActiveContact, setContacts, addContact, addMessage, updateMessageStatus } from '@/store/slices/chatSlice';
import { messageService } from '@/services/message.service';
import { supabaseService } from '@/services/supabase.service';
import type { RootState } from '@/store';
import type { Contact } from '@/types';

export default function ConversationsPage() {
  const dispatch = useDispatch();
  const { contacts, activeContact } = useSelector((state: RootState) => state.chat);
  const { sessions } = useSelector((state: RootState) => state.session);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewContactModal, setShowNewContactModal] = useState(false);

  // Get active session ID
  const activeSession = sessions.find(s => s.status === 'connected');
  const sessionId = activeSession?.id || null;

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

  // Subscribe to realtime messages via Supabase
  useEffect(() => {
    const tenantId = localStorage.getItem('clientId');
    if (!tenantId) {
      console.warn('[Conversations] No tenant ID found in localStorage');
      return;
    }

    console.log('[Conversations] Setting up realtime subscriptions...');

    // Subscribe to new messages
    const messagesChannel = supabaseService.subscribeToMessagesByTenant(
      tenantId,
      (message) => {
        console.log('[Conversations] New message received via realtime:', message);

        // Determinar contactId baseado se mensagem é incoming ou outgoing
        const contactId = message.fromNumber === 'self'
          ? message.toNumber
          : message.fromNumber;

        // Adicionar mensagem ao Redux store
        dispatch(addMessage({
          contactId,
          message: {
            id: message.id,
            sessionId: message.sessionId,
            messageId: message.messageId,
            fromNumber: message.fromNumber,
            toNumber: message.toNumber,
            type: message.type,
            content: message.content,
            status: message.status,
            timestamp: message.timestamp,
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

    // Cleanup on unmount
    return () => {
      console.log('[Conversations] Cleaning up realtime subscriptions...');
      supabaseService.unsubscribe(`messages-tenant:${tenantId}`);
      supabaseService.unsubscribe(`message-status-tenant:${tenantId}`);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />
      <div className="ml-64 mt-16 h-[calc(100vh-4rem)] flex bg-gray-100">
        {/* Contact List - Left Sidebar */}
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
    </div>
  );
}
