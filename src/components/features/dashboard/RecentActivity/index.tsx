import { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  MessageSquare,
  UserPlus,
  Power,
  PowerOff,
  Image,
  Video,
  FileText,
  Mic,
  MapPin,
  CheckCheck,
  Clock
} from 'lucide-react';
import { cn } from '@/utils/helpers';

type ActivityType =
  | 'message_sent'
  | 'message_received'
  | 'session_connected'
  | 'session_disconnected'
  | 'contact_added'
  | 'media_sent'
  | 'audio_sent'
  | 'location_sent';

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: Date;
  metadata?: {
    messageType?: 'text' | 'image' | 'video' | 'document' | 'audio' | 'location';
    phoneNumber?: string;
    status?: string;
  };
}

interface RecentActivityProps {
  activities?: Activity[];
  loading?: boolean;
  maxItems?: number;
}

// Generate mock activities
const generateMockActivities = (): Activity[] => {
  const now = new Date();
  return [
    {
      id: '1',
      type: 'message_sent',
      title: 'Mensagem enviada',
      description: 'Mensagem de texto para +55 11 99999-9999',
      timestamp: new Date(now.getTime() - 1000 * 60 * 5), // 5 min ago
      metadata: { messageType: 'text', phoneNumber: '5511999999999' }
    },
    {
      id: '2',
      type: 'session_connected',
      title: 'Sessão conectada',
      description: 'WhatsApp +55 11 98888-8888 conectado com sucesso',
      timestamp: new Date(now.getTime() - 1000 * 60 * 15), // 15 min ago
      metadata: { phoneNumber: '5511988888888' }
    },
    {
      id: '3',
      type: 'media_sent',
      title: 'Imagem enviada',
      description: 'Foto enviada para +55 11 97777-7777',
      timestamp: new Date(now.getTime() - 1000 * 60 * 30), // 30 min ago
      metadata: { messageType: 'image', phoneNumber: '5511977777777' }
    },
    {
      id: '4',
      type: 'message_received',
      title: 'Mensagem recebida',
      description: 'Nova mensagem de +55 11 96666-6666',
      timestamp: new Date(now.getTime() - 1000 * 60 * 60), // 1 hour ago
      metadata: { messageType: 'text', phoneNumber: '5511966666666' }
    },
    {
      id: '5',
      type: 'session_disconnected',
      title: 'Sessão desconectada',
      description: 'WhatsApp +55 11 95555-5555 foi desconectado',
      timestamp: new Date(now.getTime() - 1000 * 60 * 120), // 2 hours ago
      metadata: { phoneNumber: '5511955555555' }
    },
  ];
};

export default function RecentActivity({
  activities,
  loading = false,
  maxItems = 10
}: RecentActivityProps) {
  const activityData = activities || generateMockActivities();

  const recentActivities = useMemo(() => {
    return activityData.slice(0, maxItems);
  }, [activityData, maxItems]);

  const getActivityIcon = (activity: Activity) => {
    switch (activity.type) {
      case 'message_sent':
        if (activity.metadata?.messageType === 'image') return Image;
        if (activity.metadata?.messageType === 'video') return Video;
        if (activity.metadata?.messageType === 'document') return FileText;
        if (activity.metadata?.messageType === 'audio') return Mic;
        if (activity.metadata?.messageType === 'location') return MapPin;
        return MessageSquare;
      case 'message_received':
        return MessageSquare;
      case 'session_connected':
        return Power;
      case 'session_disconnected':
        return PowerOff;
      case 'contact_added':
        return UserPlus;
      case 'media_sent':
        return Image;
      case 'audio_sent':
        return Mic;
      case 'location_sent':
        return MapPin;
      default:
        return Clock;
    }
  };

  const getActivityColor = (activity: Activity) => {
    switch (activity.type) {
      case 'message_sent':
      case 'media_sent':
      case 'audio_sent':
      case 'location_sent':
        return {
          bg: 'bg-primary/10',
          icon: 'text-primary',
          dot: 'bg-primary'
        };
      case 'message_received':
        return {
          bg: 'bg-blue-100',
          icon: 'text-blue-600',
          dot: 'bg-blue-500'
        };
      case 'session_connected':
      case 'contact_added':
        return {
          bg: 'bg-green-100',
          icon: 'text-green-600',
          dot: 'bg-green-500'
        };
      case 'session_disconnected':
        return {
          bg: 'bg-red-100',
          icon: 'text-red-600',
          dot: 'bg-red-500'
        };
      default:
        return {
          bg: 'bg-gray-100',
          icon: 'text-gray-600',
          dot: 'bg-gray-500'
        };
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Atividade Recente
          </h3>
          <p className="text-sm text-gray-500">
            Últimas ações no sistema
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-500">Ao vivo</span>
        </div>
      </div>

      {/* Activities List */}
      {recentActivities.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Nenhuma atividade recente</p>
        </div>
      ) : (
        <div className="space-y-1">
          {recentActivities.map((activity, index) => {
            const Icon = getActivityIcon(activity);
            const colors = getActivityColor(activity);
            const isLast = index === recentActivities.length - 1;

            return (
              <div key={activity.id} className="relative">
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  {/* Icon */}
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', colors.bg)}>
                    <Icon className={cn('w-5 h-5', colors.icon)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 mb-0.5">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          {activity.description}
                        </p>
                      </div>

                      {/* Timestamp */}
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDistanceToNow(activity.timestamp, {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </span>
                    </div>

                    {/* Status badge if available */}
                    {activity.metadata?.status && (
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                        <CheckCheck className="w-3 h-3" />
                        {activity.metadata.status}
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline line */}
                {!isLast && (
                  <div className="absolute left-8 top-14 bottom-0 w-px bg-gray-200"></div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* View all button */}
      {recentActivities.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <button className="text-sm text-primary hover:text-primary-dark font-medium">
            Ver todas as atividades →
          </button>
        </div>
      )}
    </div>
  );
}
