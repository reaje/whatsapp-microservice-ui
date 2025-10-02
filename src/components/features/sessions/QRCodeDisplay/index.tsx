import { useEffect, useState } from 'react';
import { X, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useQRCode } from '@/hooks/useSession';
import { sessionService } from '@/services/session.service';
import { formatPhoneNumber } from '@/utils/helpers';

interface QRCodeDisplayProps {
  phoneNumber: string;
  onClose: () => void;
  onConnected?: () => void;
}

export default function QRCodeDisplay({ phoneNumber, onClose, onConnected }: QRCodeDisplayProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusCheckCount, setStatusCheckCount] = useState(0);
  const { qrCode, loading, refetch } = useQRCode(phoneNumber, true);

  // Check connection status periodically
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await sessionService.getSessionStatus(phoneNumber);
        setStatusCheckCount(prev => prev + 1);

        if (status.isConnected) {
          setIsConnected(true);
          onConnected?.();
          setTimeout(() => {
            onClose();
          }, 2000);
        }
      } catch (err: any) {
        console.error('Error checking status:', err);
        if (statusCheckCount > 10) {
          // After 10 failed checks (30 seconds), show error
          setError('Não foi possível verificar o status da sessão. Tente novamente.');
        }
      }
    };

    if (!isConnected && !error) {
      const interval = setInterval(checkStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [phoneNumber, isConnected, error, statusCheckCount, onClose, onConnected]);

  const handleRefresh = () => {
    setError(null);
    setStatusCheckCount(0);
    refetch();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Conectar WhatsApp
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {formatPhoneNumber(phoneNumber)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isConnected ? (
            // Success State
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Conectado com Sucesso!
              </h3>
              <p className="text-sm text-gray-600">
                Sua sessão WhatsApp está ativa
              </p>
            </div>
          ) : loading && !qrCode ? (
            // Loading State
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Gerando QR Code...</p>
            </div>
          ) : error ? (
            // Error State
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Erro ao gerar QR Code
              </h3>
              <p className="text-sm text-gray-600 mb-4">{error}</p>
              <button
                onClick={handleRefresh}
                className="btn-primary"
              >
                Tentar Novamente
              </button>
            </div>
          ) : qrCode ? (
            // QR Code Display
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                <img
                  src={`data:image/png;base64,${qrCode}`}
                  alt="QR Code"
                  className="w-full h-auto"
                />
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p className="font-medium text-gray-800">
                  Como conectar:
                </p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Abra o WhatsApp no seu celular</li>
                  <li>Toque em <strong>Mais opções</strong> ou <strong>Configurações</strong></li>
                  <li>Toque em <strong>Aparelhos conectados</strong></li>
                  <li>Toque em <strong>Conectar um aparelho</strong></li>
                  <li>Aponte seu celular para esta tela para capturar o código</li>
                </ol>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm text-gray-600">
                  Aguardando leitura do QR Code...
                </span>
              </div>

              <button
                onClick={handleRefresh}
                className="w-full btn-secondary flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Gerar Novo QR Code
              </button>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {!isConnected && (
          <div className="px-6 py-4 bg-gray-50 rounded-b-lg border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              O QR Code expira em alguns minutos. Se não funcionar, gere um novo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
