import { Smartphone } from 'lucide-react';
import SessionCard from '../SessionCard';
import type { Session } from '@/types';

interface SessionsListProps {
  sessions: Session[];
  loading: boolean;
  onDisconnect: (phoneNumber: string) => void;
  onViewQRCode: (phoneNumber: string) => void;
  onRefresh: (phoneNumber: string) => void;
}

export default function SessionsList({
  sessions,
  loading,
  onDisconnect,
  onViewQRCode,
  onRefresh
}: SessionsListProps) {
  console.log('🎨 SessionsList render - sessions:', sessions, 'loading:', loading);

  if (loading) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando sessões...</p>
        </div>
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-12 text-gray-500">
          <Smartphone className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium mb-2">Nenhuma sessão ativa</p>
          <p className="text-sm">Clique em "Nova Sessão" para inicializar uma conexão</p>
        </div>
      </div>
    );
  }

  // Separate sessions by status
  const activeSessions = sessions.filter(s => s.isActive);
  const inactiveSessions = sessions.filter(s => !s.isActive);

  return (
    <div className="space-y-6">
      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Sessões Ativas ({activeSessions.length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onDisconnect={onDisconnect}
                onViewQRCode={onViewQRCode}
                onRefresh={onRefresh}
              />
            ))}
          </div>
        </div>
      )}

      {/* Inactive Sessions */}
      {inactiveSessions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Sessões Inativas ({inactiveSessions.length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {inactiveSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onDisconnect={onDisconnect}
                onViewQRCode={onViewQRCode}
                onRefresh={onRefresh}
              />
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="flex items-center justify-center gap-6 py-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>{activeSessions.length} Conectadas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>{inactiveSessions.length} Desconectadas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
          <span>{sessions.length} Total</span>
        </div>
      </div>
    </div>
  );
}
