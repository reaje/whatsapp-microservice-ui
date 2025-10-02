import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Webhook, Save, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { RootState, AppDispatch } from '@/store';
import { fetchTenant, updateTenantSettings } from '@/store/slices/tenantSlice';
import { toast } from 'react-hot-toast';

export default function WebhookConfig() {
  const dispatch = useDispatch<AppDispatch>();
  const { tenant, loading } = useSelector((state: RootState) => state.tenant);

  const [webhookUrl, setWebhookUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!tenant) {
      dispatch(fetchTenant());
    }
  }, [tenant, dispatch]);

  useEffect(() => {
    if (tenant?.settings?.webhook_url) {
      setWebhookUrl(tenant.settings.webhook_url);
    }
  }, [tenant]);

  const handleSave = async () => {
    if (!tenant) return;

    // Validate URL format
    if (webhookUrl && !isValidUrl(webhookUrl)) {
      toast.error('URL inválida. Use o formato: https://exemplo.com/webhook');
      return;
    }

    setIsSaving(true);
    try {
      await dispatch(updateTenantSettings({
        ...tenant.settings,
        webhook_url: webhookUrl || null,
      })).unwrap();

      toast.success('Webhook configurado com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configurações do webhook');
    } finally {
      setIsSaving(false);
    }
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  };

  if (loading && !tenant) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Webhook className="w-5 h-5 text-purple-500" />
          Configuração de Webhook
        </h2>
        <p className="text-gray-600 text-sm mt-1">
          Receba notificações de eventos em tempo real
        </p>
      </div>

      <div className="space-y-6">
        {/* Webhook URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL do Webhook
          </label>
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://seu-servidor.com/webhook"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-2">
            URL que receberá as notificações de eventos do WhatsApp
          </p>
        </div>

        {/* Events Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Eventos Disponíveis</h3>
          <ul className="space-y-1 text-sm text-blue-800">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Mensagens recebidas</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Status de mensagens enviadas</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Mudanças de status da sessão</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>QR Code atualizado</span>
            </li>
          </ul>
        </div>

        {/* Webhook Payload Example */}
        <div>
          <h3 className="font-medium text-gray-700 mb-2">Exemplo de Payload</h3>
          <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
            <pre className="text-xs font-mono">
{`{
  "event": "message.received",
  "timestamp": "2025-01-15T10:30:00Z",
  "sessionId": "550123456789",
  "data": {
    "from": "5511999999999",
    "body": "Olá!",
    "type": "text",
    "timestamp": 1705318200
  }
}`}
            </pre>
          </div>
        </div>

        {/* Security Note */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex gap-2">
            <XCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-900 mb-1">Nota de Segurança</h3>
              <p className="text-sm text-yellow-800">
                Certifique-se de que seu endpoint webhook valide as requisições
                e use HTTPS para comunicação segura.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Configurações
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
