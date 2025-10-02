import { useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import SessionsList from '@/components/features/sessions/SessionsList';
import InitializeSessionModal from '@/components/features/sessions/InitializeSessionModal';
import QRCodeDisplay from '@/components/features/sessions/QRCodeDisplay';
import { useSession } from '@/hooks/useSession';
import type { InitializeSessionInput } from '@/utils/validators';

export default function SessionsPage() {
  const [showInitModal, setShowInitModal] = useState(false);
  const [qrCodePhone, setQrCodePhone] = useState<string | null>(null);

  const {
    sessions,
    loading,
    initializeSession,
    disconnectSession,
    getSessionStatus,
    refetchSessions,
  } = useSession();

  const handleInitializeSession = async (data: InitializeSessionInput) => {
    await initializeSession(data);

    // If Baileys, show QR Code
    if (data.providerType === 'baileys') {
      setQrCodePhone(data.phoneNumber);
    }
  };

  const handleDisconnect = async (phoneNumber: string) => {
    if (confirm(`Desconectar sessão ${phoneNumber}?`)) {
      await disconnectSession(phoneNumber);
    }
  };

  const handleViewQRCode = (phoneNumber: string) => {
    setQrCodePhone(phoneNumber);
  };

  const handleRefreshSession = async (phoneNumber: string) => {
    await getSessionStatus(phoneNumber);
  };

  const handleRefreshAll = () => {
    refetchSessions();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Sessões WhatsApp</h1>
            <p className="text-gray-600 mt-1">Gerencie suas conexões do WhatsApp</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefreshAll}
              className="btn-secondary flex items-center gap-2"
              disabled={loading}
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <button
              onClick={() => setShowInitModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nova Sessão
            </button>
          </div>
        </div>

        {/* Sessions List */}
        <SessionsList
          sessions={sessions}
          loading={loading}
          onDisconnect={handleDisconnect}
          onViewQRCode={handleViewQRCode}
          onRefresh={handleRefreshSession}
        />

        {/* Initialize Session Modal */}
        {showInitModal && (
          <InitializeSessionModal
            onClose={() => setShowInitModal(false)}
            onSubmit={handleInitializeSession}
          />
        )}

        {/* QR Code Display */}
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
    </MainLayout>
  );
}
