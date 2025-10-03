import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Activity, Server, CheckCircle2, XCircle, Clock, TrendingUp, MessageSquare, Users, Loader2, RefreshCw } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { RootState, AppDispatch } from '@/store';
import { fetchProviderStats, fetchRecommendedProvider } from '@/store/slices/providerSlice';
import { ProviderType } from '@/types/provider.types';

export default function ProvidersPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { stats, recommended, loading } = useSelector((state: RootState) => state.provider);

  useEffect(() => {
    loadData();
  }, [dispatch]);

  const loadData = () => {
    dispatch(fetchProviderStats());
    dispatch(fetchRecommendedProvider());
  };

  const getProviderName = (type: ProviderType): string => {
    switch (type) {
      case ProviderType.Baileys:
        return 'Baileys';
      case ProviderType.MetaApi:
        return 'Meta API';
      default:
        return 'Desconhecido';
    }
  };

  const formatResponseTime = (time: string): string => {
    // Parse TimeSpan format (HH:MM:SS.fffffff)
    const parts = time.split(':');
    if (parts.length >= 2) {
      const seconds = parseFloat(parts[2] || '0');
      const minutes = parseInt(parts[1] || '0');
      const hours = parseInt(parts[0] || '0');

      if (hours > 0) return `${hours}h ${minutes}m`;
      if (minutes > 0) return `${minutes}m ${seconds.toFixed(0)}s`;
      return `${seconds.toFixed(2)}s`;
    }
    return time;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Monitoramento de Providers</h1>
            <p className="text-gray-600 mt-1">Acompanhe a saúde e estatísticas dos providers WhatsApp</p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {/* Recommended Provider Card */}
        {recommended && (
          <div className="card bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Provider Recomendado
                </h3>
                <p className="text-gray-700 mb-2">
                  <span className="font-medium">{getProviderName(recommended.providerType)}</span>
                  {' '}- {recommended.reason}
                </p>
                <div className="flex items-center gap-2">
                  {recommended.isHealthy ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle2 className="w-3 h-3" />
                      Saudável
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <XCircle className="w-3 h-3" />
                      Com Problemas
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Provider Stats Grid */}
        {loading && !stats ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : stats && Object.keys(stats).length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {Object.entries(stats).map(([key, provider]) => (
              <div key={key} className="card">
                {/* Provider Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                      provider.isHealthy
                        ? 'bg-gradient-to-br from-green-400 to-emerald-500'
                        : 'bg-gradient-to-br from-red-400 to-orange-500'
                    }`}>
                      <Server className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {getProviderName(provider.providerType)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {provider.isHealthy ? 'Operacional' : 'Com Problemas'}
                      </p>
                    </div>
                  </div>

                  <div className={`px-3 py-1 rounded-full ${
                    provider.isHealthy ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {provider.isHealthy ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">Sessões Totais</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{provider.totalSessions}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <Activity className="w-4 h-4" />
                      <span className="text-sm">Sessões Ativas</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{provider.activeSessions}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-sm">Mensagens Hoje</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{provider.messagesSentToday}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm">Taxa de Sucesso</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {(provider.successRate * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="space-y-2 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      Tempo de Resposta Médio
                    </div>
                    <span className="font-medium text-gray-900">
                      {formatResponseTime(provider.averageResponseTime)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Activity className="w-4 h-4" />
                      Último Health Check
                    </div>
                    <span className="font-medium text-gray-900">
                      {new Date(provider.lastHealthCheck).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12 text-gray-500">
            <Server className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">Nenhum provider disponível</p>
            <p className="text-sm">Configure os providers no backend para começar</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
