import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MessageSquare } from 'lucide-react';
import ContactList from '@/components/features/chat/ContactList';
import ChatWindow from '@/components/features/chat/ChatWindow';
import { setActiveContact, setContacts } from '@/store/slices/chatSlice';
import { messageService } from '@/services/message.service';
import type { RootState } from '@/store';
import type { Contact } from '@/types';

export default function ConversationsPage() {
  const dispatch = useDispatch();
  const { contacts, activeContact } = useSelector((state: RootState) => state.chat);
  const { sessions } = useSelector((state: RootState) => state.session);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            timestamp: new Date(conv.lastMessage.timestamp),
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

  const handleSelectContact = (contact: Contact) => {
    dispatch(setActiveContact(contact));
  };

  return (
    <div className="fixed inset-0 top-16 left-64 bg-gray-100">
      <div className="h-full flex">
        {/* Contact List - Left Sidebar */}
        <div className="w-96 flex-shrink-0">
          <ContactList
            contacts={contacts}
            activeContactId={activeContact?.id}
            onSelectContact={handleSelectContact}
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
    </div>
  );
}
