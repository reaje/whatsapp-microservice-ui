import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Smartphone,
  Circle,
  Trash2,
  QrCode,
  MoreVertical,
  RefreshCw
} from 'lucide-react';
import { cn, formatPhoneNumber } from '@/utils/helpers';
import type { Session } from '@/types';

interface SessionCardProps {
  session: Session;
  onDisconnect: (phoneNumber: string) => void;
  onViewQRCode: (phoneNumber: string) => void;
  onRefresh: (phoneNumber: string) => void;
  onReconnect: (phoneNumber: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'connected':
      return 'text-green-600 bg-green-100';
    case 'disconnected':
      return 'text-red-600 bg-red-100';
    case 'connecting':
      return 'text-yellow-600 bg-yellow-100';
    case 'qr_required':
      return 'text-blue-600 bg-blue-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'connected':
      return 'Conectado';
    case 'disconnected':
      return 'Desconectado';
    case 'connecting':
      return 'Conectando...';
    case 'qr_required':
      return 'QR Code Pendente';
    default:
      return 'Desconhecido';
  }
};

const getProviderText = (provider: string) => {
  switch (provider) {
    case 'baileys':
      return 'Baileys';
    case 'meta_api':
      return 'Meta API';
    default:
      return provider;
  }
};

export default function SessionCard({
  session,
  onDisconnect,
  onViewQRCode,
  onRefresh,
  onReconnect
}: SessionCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await onDisconnect(session.phoneNumber);
    } finally {
      setLoading(false);
      setShowMenu(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await onRefresh(session.phoneNumber);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          {/* Icon */}
          <div className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center',
            session.isActive ? 'bg-primary/10' : 'bg-gray-100'
          )}>
            <Smartphone className={cn(
              'w-6 h-6',
              session.isActive ? 'text-primary' : 'text-gray-400'
            )} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-800 truncate">
                {formatPhoneNumber(session.phoneNumber)}
              </h3>
              <span className={cn(
                'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                getStatusColor(session.status)
              )}>
                <Circle className="w-2 h-2 fill-current" />
                {getStatusText(session.status)}
              </span>
            </div>

            <div className="space-y-1 text-sm text-gray-600">
              <p>
                <span className="font-medium">Provider:</span>{' '}
                {getProviderText(session.provider)}
              </p>
              {session.connectedAt && (
                <p>
                  <span className="font-medium">Conectado em:</span>{' '}
                  {format(new Date(session.connectedAt), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR
                  })}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Atualizado: {format(new Date(session.updatedAt), "dd/MM/yyyy HH:mm", {
                  locale: ptBR
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            title="Atualizar status"
          >
            <RefreshCw className={cn(
              'w-4 h-4 text-gray-600',
              loading && 'animate-spin'
            )} />
          </button>

          {/* Reconectar/Gerar QR (Baileys) */}
          {session.provider === 'baileys' && (!session.isActive || session.status === 'qr_required') && (
            <button
              onClick={() => onReconnect(session.phoneNumber)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Reconectar / Gerar QR Code"
            >
              <QrCode className="w-4 h-4 text-gray-600" />
            </button>
          )}

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-600" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <button
                    onClick={handleDisconnect}
                    disabled={loading || !session.isActive}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Desconectar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      {session.status === 'connecting' && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Aguardando conexão...</span>
          </div>
        </div>
      )}

      {session.status === 'qr_required' && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <QrCode className="w-4 h-4" />
              <span>Clique no botão QR Code para conectar</span>
            </div>
            <button
              onClick={() => onViewQRCode(session.phoneNumber)}
              className="btn-primary-sm"
            >
              Ver QR Code
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
