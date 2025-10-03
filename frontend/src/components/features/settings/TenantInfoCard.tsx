import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Building2, Calendar, Loader2 } from 'lucide-react';
import { RootState, AppDispatch } from '@/store';
import { fetchTenant } from '@/store/slices/tenantSlice';

export default function TenantInfoCard() {
  const dispatch = useDispatch<AppDispatch>();
  const { tenant, loading } = useSelector((state: RootState) => state.tenant);

  useEffect(() => {
    dispatch(fetchTenant());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="card">
        <div className="text-center py-12 text-gray-500">
          <p>Não foi possível carregar informações do tenant</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="card">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-purple-500" />
          Informações do Tenant
        </h2>
        <p className="text-gray-600 text-sm mt-1">Dados da sua organização</p>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome
            </label>
            <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-800 font-medium">
              {tenant.name}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client ID
            </label>
            <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-600 font-mono text-sm">
              {tenant.clientId}
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Data de Criação
            </label>
            <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-600">
              {formatDate(tenant.createdAt)}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Última Atualização
            </label>
            <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-600">
              {formatDate(tenant.updatedAt)}
            </div>
          </div>
        </div>

        {/* Settings Preview */}
        {tenant.settings && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Configurações Atuais
            </label>
            <div className="px-4 py-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {tenant.settings.max_sessions && (
                  <div>
                    <span className="text-gray-600">Max Sessões:</span>
                    <span className="ml-2 font-semibold text-gray-800">
                      {tenant.settings.max_sessions}
                    </span>
                  </div>
                )}
                {tenant.settings.max_messages_per_day && (
                  <div>
                    <span className="text-gray-600">Max Mensagens/dia:</span>
                    <span className="ml-2 font-semibold text-gray-800">
                      {tenant.settings.max_messages_per_day}
                    </span>
                  </div>
                )}
                {tenant.settings.features?.ai_enabled !== undefined && (
                  <div>
                    <span className="text-gray-600">IA:</span>
                    <span className={`ml-2 font-semibold ${tenant.settings.features.ai_enabled ? 'text-green-600' : 'text-red-600'}`}>
                      {tenant.settings.features.ai_enabled ? 'Ativado' : 'Desativado'}
                    </span>
                  </div>
                )}
                {tenant.settings.features?.media_enabled !== undefined && (
                  <div>
                    <span className="text-gray-600">Mídia:</span>
                    <span className={`ml-2 font-semibold ${tenant.settings.features.media_enabled ? 'text-green-600' : 'text-red-600'}`}>
                      {tenant.settings.features.media_enabled ? 'Ativado' : 'Desativado'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
