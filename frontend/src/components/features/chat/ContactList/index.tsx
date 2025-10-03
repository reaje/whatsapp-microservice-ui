import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, User, CheckCheck } from 'lucide-react';
import { cn, formatPhoneNumber, truncateText } from '@/utils/helpers';
import type { Contact } from '@/types';

interface ContactListProps {
  contacts: Contact[];
  activeContactId?: string;
  onSelectContact: (contact: Contact) => void;
  loading?: boolean;
}

export default function ContactList({
  contacts,
  activeContactId,
  onSelectContact,
  loading = false,
}: ContactListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter contacts by search query
  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phoneNumber.includes(searchQuery)
  );

  const renderLastMessage = (contact: Contact) => {
    if (!contact.lastMessage) {
      return <span className="text-gray-400 italic text-sm">Sem mensagens</span>;
    }

    const message = contact.lastMessage;
    let content = '';

    switch (message.type) {
      case 'text':
        content = message.content?.text || message.content || '';
        break;
      case 'image':
        content = '📷 Imagem';
        break;
      case 'video':
        content = '🎥 Vídeo';
        break;
      case 'audio':
        content = '🎵 Áudio';
        break;
      case 'document':
        content = '📄 Documento';
        break;
      case 'location':
        content = '📍 Localização';
        break;
      default:
        content = 'Mensagem';
    }

    return (
      <div className="flex items-center gap-1 text-sm text-gray-600">
        {message.fromNumber === 'self' && message.status === 'read' && (
          <CheckCheck className="w-3 h-3 text-blue-500" />
        )}
        <span className="truncate">{truncateText(content, 30)}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-3">Conversas</h2>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar conversas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Contact List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500 px-4">
              <User className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm">
                {searchQuery
                  ? 'Nenhuma conversa encontrada'
                  : 'Nenhuma conversa ainda'}
              </p>
            </div>
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => onSelectContact(contact)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100',
                activeContactId === contact.id && 'bg-gray-100'
              )}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {contact.avatar ? (
                  <img
                    src={contact.avatar}
                    alt={contact.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                )}

                {/* Unread badge */}
                {contact.unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {contact.unreadCount > 9 ? '9+' : contact.unreadCount}
                  </div>
                )}
              </div>

              {/* Contact Info */}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-800 truncate">
                    {contact.name}
                  </h3>
                  {contact.lastMessage && (
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {format(
                        new Date(contact.lastMessage.timestamp),
                        'HH:mm',
                        { locale: ptBR }
                      )}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  {renderLastMessage(contact)}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
