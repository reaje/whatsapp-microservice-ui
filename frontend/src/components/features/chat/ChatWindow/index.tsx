import { useEffect, useRef } from 'react';
import { User, MoreVertical, Phone, Video, Search } from 'lucide-react';
import MessageBubble from '../MessageBubble';
import MessageInput from '../MessageInput';
import { useMessage } from '@/hooks/useMessage';
import { formatPhoneNumber } from '@/utils/helpers';
import type { Contact } from '@/types';

interface ChatWindowProps {
  contact: Contact;
  sessionId: string;
}

export default function ChatWindow({ contact, sessionId }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, loading, sendText, sendMedia, sendAudio, sendLocation, isSending } = useMessage(contact.id);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    try {
      await sendText({
        to: contact.phoneNumber,
        content: text,
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSendMedia = async (
    file: File,
    base64: string,
    type: 'image' | 'video' | 'document',
    caption?: string
  ) => {
    try {
      await sendMedia({
        to: contact.phoneNumber,
        mediaBase64: base64,
        mediaType: type,
        caption,
      });
    } catch (error) {
      console.error('Error sending media:', error);
    }
  };

  const handleSendAudio = async (
    audioBlob: Blob,
    base64: string,
    duration: number
  ) => {
    try {
      await sendAudio({
        to: contact.phoneNumber,
        audioBase64: base64,
      });
    } catch (error) {
      console.error('Error sending audio:', error);
    }
  };

  const handleSendLocation = async (
    latitude: number,
    longitude: number,
    address?: string
  ) => {
    try {
      await sendLocation({
        to: contact.phoneNumber,
        latitude,
        longitude,
      });
    } catch (error) {
      console.error('Error sending location:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {contact.avatar ? (
              <img
                src={contact.avatar}
                alt={contact.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
            )}
            {/* Online indicator (can be dynamic) */}
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          </div>

          {/* Contact Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-800 truncate">
              {contact.name}
            </h3>
            <p className="text-sm text-gray-500 truncate">
              {formatPhoneNumber(contact.phoneNumber)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Pesquisar"
          >
            <Search className="w-5 h-5 text-gray-600" />
          </button>
          <button
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Chamada de voz"
          >
            <Phone className="w-5 h-5 text-gray-600" />
          </button>
          <button
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Chamada de vídeo"
          >
            <Video className="w-5 h-5 text-gray-600" />
          </button>
          <button
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Mais opções"
          >
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando mensagens...</p>
            </div>
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">Nenhuma mensagem ainda</p>
              <p className="text-sm">
                Envie uma mensagem para iniciar a conversa
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Date Separator (can be dynamic) */}
            <div className="flex items-center justify-center my-4">
              <div className="bg-white px-3 py-1 rounded-full shadow-sm">
                <span className="text-xs text-gray-600">Hoje</span>
              </div>
            </div>

            {/* Messages */}
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.fromNumber === 'self'}
              />
            ))}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <MessageInput
        onSend={handleSendMessage}
        onSendMedia={handleSendMedia}
        onSendAudio={handleSendAudio}
        onSendLocation={handleSendLocation}
        disabled={isSending}
        placeholder="Digite uma mensagem..."
      />
    </div>
  );
}
