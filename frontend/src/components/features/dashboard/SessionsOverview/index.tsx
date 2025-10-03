import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Smartphone } from 'lucide-react';
import { formatPhoneNumber } from '@/utils/helpers';
import type { Session } from '@/types';

interface SessionsOverviewProps {
  sessions?: Session[];
  loading?: boolean;
}

export default function SessionsOverview({
  sessions = [],
  loading = false
}: SessionsOverviewProps) {
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const active = sessions.filter(s => s.isActive && s.status === 'connected').length;
    const inactive = sessions.filter(s => !s.isActive || s.status !== 'connected').length;
    const total = sessions.length;

    return { active, inactive, total };
  }, [sessions]);

  const recentSessions = useMemo(() => {
    return [...sessions]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [sessions]);

  const getStatusIcon = (session: Session) => {
    if (session.isActive && session.status === 'connected') {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (session.status === 'connecting') {
      return <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />;
    }
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  const getStatusText = (session: Session) => {
    if (session.isActive && session.status === 'connected') {
      return 'Conectado';
    }
    if (session.status === 'connecting') {
      return 'Conectando...';
    }
    return 'Desconectado';
  };

  const getStatusColor = (session: Session) => {
    if (session.isActive && session.status === 'connected') {
      return 'text-green-600';
    }
    if (session.status === 'connecting') {
      return 'text-yellow-600';
    }
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
            Sessões WhatsApp
          </h3>
          <p className="text-sm text-gray-500">
            Overview de todas as sessões
          </p>
        </div>

        <button
          onClick={() => navigate('/sessions')}
          className="text-sm text-primary hover:text-primary-dark font-medium"
        >
          Ver todas →
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total</span>
            <Smartphone className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-green-600">Ativas</span>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>

        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-red-600">Inativas</span>
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
        </div>
      </div>

      {/* Recent Sessions */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Sessões Recentes
        </h4>

        {recentSessions.length === 0 ? (
          <div className="text-center py-8">
            <Smartphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Nenhuma sessão encontrada</p>
            <button
              onClick={() => navigate('/sessions')}
              className="mt-3 text-sm text-primary hover:text-primary-dark font-medium"
            >
              Criar primeira sessão
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => navigate('/sessions')}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Smartphone className="w-5 h-5 text-primary" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {formatPhoneNumber(session.phoneNumber)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {session.provider === 'baileys' ? 'Baileys' : 'Meta API'}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  {getStatusIcon(session)}
                  <span className={`text-sm font-medium ${getStatusColor(session)}`}>
                    {getStatusText(session)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {stats.total > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Taxa de Conectividade</span>
            <span className="text-sm font-medium text-gray-900">
              {Math.round((stats.active / stats.total) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${(stats.active / stats.total) * 100}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}
