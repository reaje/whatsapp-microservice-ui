import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, CheckCheck, Clock, XCircle, MapPin, FileText } from 'lucide-react';
import { cn } from '@/utils/helpers';
import type { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'sending':
      return <Clock className="w-3 h-3" />;
    case 'sent':
      return <Check className="w-3 h-3" />;
    case 'delivered':
      return <CheckCheck className="w-3 h-3" />;
    case 'read':
      return <CheckCheck className="w-3 h-3 text-blue-500" />;
    case 'failed':
      return <XCircle className="w-3 h-3 text-red-500" />;
    default:
      return null;
  }
};

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const renderMessageContent = () => {
    switch (message.type) {
      case 'text':
        return (
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content?.text || message.content}
          </p>
        );

      case 'image':
        return (
          <div className="space-y-2">
            {message.content?.mediaUrl && (
              <img
                src={message.content.mediaUrl}
                alt="Imagem"
                className="rounded-lg max-w-sm w-full"
              />
            )}
            {message.content?.caption && (
              <p className="text-sm">{message.content.caption}</p>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="space-y-2">
            {message.content?.mediaUrl && (
              <video
                src={message.content.mediaUrl}
                controls
                className="rounded-lg max-w-sm w-full"
              />
            )}
            {message.content?.caption && (
              <p className="text-sm">{message.content.caption}</p>
            )}
          </div>
        );

      case 'audio':
        return (
          <div className="flex items-center gap-3">
            <audio
              src={message.content?.mediaUrl}
              controls
              className="max-w-xs"
            />
          </div>
        );

      case 'document':
        return (
          <a
            href={message.content?.mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <FileText className="w-8 h-8 text-gray-600 dark:text-gray-400" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {message.content?.fileName || 'Documento'}
              </p>
              {message.content?.fileSize && (
                <p className="text-xs text-gray-500">
                  {(message.content.fileSize / 1024).toFixed(0)} KB
                </p>
              )}
            </div>
          </a>
        );

      case 'location':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4" />
              <span>Localização</span>
            </div>
            {message.content?.latitude && message.content?.longitude && (
              <a
                href={`https://www.google.com/maps?q=${message.content.latitude},${message.content.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full h-32 bg-gray-200 rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
              >
                <img
                  src={`https://maps.googleapis.com/maps/api/staticmap?center=${message.content.latitude},${message.content.longitude}&zoom=15&size=300x150&markers=color:red%7C${message.content.latitude},${message.content.longitude}&key=YOUR_API_KEY`}
                  alt="Mapa"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback if Google Maps API is not available
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5NYXBhPC90ZXh0Pjwvc3ZnPg==';
                  }}
                />
              </a>
            )}
          </div>
        );

      default:
        return (
          <p className="text-sm text-gray-500 italic">
            Tipo de mensagem não suportado
          </p>
        );
    }
  };

  return (
    <div
      className={cn(
        'flex w-full mb-4',
        isOwn ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[70%] rounded-lg px-4 py-2 shadow-sm',
          isOwn
            ? 'bg-primary text-white rounded-br-none'
            : 'bg-white text-gray-800 rounded-bl-none'
        )}
      >
        {/* Message Content */}
        <div className="mb-1">
          {renderMessageContent()}
        </div>

        {/* Message Footer */}
        <div
          className={cn(
            'flex items-center justify-end gap-1 text-xs',
            isOwn ? 'text-white/70' : 'text-gray-500'
          )}
        >
          <span>
            {format(new Date(message.timestamp), 'HH:mm', { locale: ptBR })}
          </span>
          {isOwn && getStatusIcon(message.status)}
        </div>

        {/* Error Message */}
        {message.status === 'failed' && message.error && (
          <div className="mt-2 text-xs text-red-200 bg-red-500/20 rounded px-2 py-1">
            Erro: {message.error}
          </div>
        )}
      </div>
    </div>
  );
}
