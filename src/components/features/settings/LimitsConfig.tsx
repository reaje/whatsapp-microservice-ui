import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Settings, Save, Loader2, TrendingUp, MessageSquare, Users } from 'lucide-react';
import { RootState, AppDispatch } from '@/store';
import { fetchTenant, updateTenantSettings } from '@/store/slices/tenantSlice';
import { toast } from 'react-hot-toast';

export default function LimitsConfig() {
  const dispatch = useDispatch<AppDispatch>();
  const { tenant, loading } = useSelector((state: RootState) => state.tenant);

  const [maxSessions, setMaxSessions] = useState(10);
  const [maxMessagesPerDay, setMaxMessagesPerDay] = useState(1000);
  const [features, setFeatures] = useState({
    ai_enabled: true,
    media_enabled: true,
    location_enabled: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!tenant) {
      dispatch(fetchTenant());
    }
  }, [tenant, dispatch]);

  useEffect(() => {
    if (tenant?.settings) {
      if (tenant.settings.max_sessions) {
        setMaxSessions(tenant.settings.max_sessions);
      }
      if (tenant.settings.max_messages_per_day) {
        setMaxMessagesPerDay(tenant.settings.max_messages_per_day);
      }
      if (tenant.settings.features) {
        setFeatures({
          ai_enabled: tenant.settings.features.ai_enabled ?? true,
          media_enabled: tenant.settings.features.media_enabled ?? true,
          location_enabled: tenant.settings.features.location_enabled ?? true,
        });
      }
    }
  }, [tenant]);

  const handleSave = async () => {
    if (!tenant) return;

    // Validate inputs
    if (maxSessions < 1 || maxSessions > 100) {
      toast.error('Número de sessões deve estar entre 1 e 100');
      return;
    }

    if (maxMessagesPerDay < 100 || maxMessagesPerDay > 100000) {
      toast.error('Número de mensagens deve estar entre 100 e 100.000');
      return;
    }

    setIsSaving(true);
    try {
      await dispatch(updateTenantSettings({
        ...tenant.settings,
        max_sessions: maxSessions,
        max_messages_per_day: maxMessagesPerDay,
        features,
      })).unwrap();

      toast.success('Limites atualizados com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configurações de limites');
    } finally {
      setIsSaving(false);
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
          <Settings className="w-5 h-5 text-purple-500" />
          Limites e Quotas
        </h2>
        <p className="text-gray-600 text-sm mt-1">
          Configure os limites de uso e funcionalidades disponíveis
        </p>
      </div>

      <div className="space-y-6">
        {/* Usage Limits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Max Sessions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Máximo de Sessões
            </label>
            <input
              type="number"
              value={maxSessions}
              onChange={(e) => setMaxSessions(Number(e.target.value))}
              min={1}
              max={100}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-2">
              Número máximo de sessões simultâneas (1-100)
            </p>
          </div>

          {/* Max Messages Per Day */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Máximo de Mensagens/Dia
            </label>
            <input
              type="number"
              value={maxMessagesPerDay}
              onChange={(e) => setMaxMessagesPerDay(Number(e.target.value))}
              min={100}
              max={100000}
              step={100}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-2">
              Limite diário de mensagens enviadas (100-100.000)
            </p>
          </div>
        </div>

        {/* Features Toggle */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Funcionalidades Disponíveis
          </h3>
          <div className="space-y-3">
            {/* AI Enabled */}
            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className={`w-10 h-6 rounded-full transition-colors ${features.ai_enabled ? 'bg-purple-500' : 'bg-gray-300'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${features.ai_enabled ? 'translate-x-5' : 'translate-x-1'} mt-1`} />
                  </div>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Inteligência Artificial</p>
                  <p className="text-xs text-gray-500">Habilita recursos de IA para automação</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={features.ai_enabled}
                onChange={(e) => setFeatures({ ...features, ai_enabled: e.target.checked })}
                className="sr-only"
              />
            </label>

            {/* Media Enabled */}
            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className={`w-10 h-6 rounded-full transition-colors ${features.media_enabled ? 'bg-purple-500' : 'bg-gray-300'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${features.media_enabled ? 'translate-x-5' : 'translate-x-1'} mt-1`} />
                  </div>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Envio de Mídia</p>
                  <p className="text-xs text-gray-500">Permite enviar imagens, vídeos e documentos</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={features.media_enabled}
                onChange={(e) => setFeatures({ ...features, media_enabled: e.target.checked })}
                className="sr-only"
              />
            </label>

            {/* Location Enabled */}
            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className={`w-10 h-6 rounded-full transition-colors ${features.location_enabled ? 'bg-purple-500' : 'bg-gray-300'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${features.location_enabled ? 'translate-x-5' : 'translate-x-1'} mt-1`} />
                  </div>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Compartilhamento de Localização</p>
                  <p className="text-xs text-gray-500">Permite enviar e receber localizações</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={features.location_enabled}
                onChange={(e) => setFeatures({ ...features, location_enabled: e.target.checked })}
                className="sr-only"
              />
            </label>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Nota:</strong> Mudanças nos limites podem afetar as sessões ativas.
            Recomendamos fazer alterações fora do horário de pico.
          </p>
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
