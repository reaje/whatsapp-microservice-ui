import { useEffect, useState } from 'react';
import { X, Loader2, MessageSquare, TrendingUp, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { AIAgentResponse } from '@/types/aiagent.types';

interface AgentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: AIAgentResponse | null;
}

// Mock data - em produção viria da API
interface Conversation {
  id: string;
  phoneNumber: string;
  lastMessage: string;
  timestamp: string;
  messagesCount: number;
  status: 'active' | 'completed' | 'failed';
}

export default function AgentDetailsModal({ isOpen, onClose, agent }: AgentDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    if (isOpen && agent) {
      // TODO: Buscar conversações do agente da API
      // Por enquanto, dados mock
      setConversations([
        {
          id: '1',
          phoneNumber: '5511999999999',
          lastMessage: 'Obrigado pela ajuda!',
          timestamp: new Date().toISOString(),
          messagesCount: 12,
          status: 'completed',
        },
        {
          id: '2',
          phoneNumber: '5511888888888',
          lastMessage: 'Como funciona o produto?',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          messagesCount: 5,
          status: 'active',
        },
      ]);
    }
  }, [isOpen, agent]);

  if (!isOpen || !agent) return null;

  const config = agent.configuration ? JSON.parse(agent.configuration) : {};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              agent.isActive
                ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                : 'bg-gray-300'
            }`}>
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">{agent.name}</h2>
              <p className="text-sm text-gray-600">{agent.type}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Analytics */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="card bg-blue-50 border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Conversas Totais</p>
                    <p className="text-2xl font-bold text-gray-900">{conversations.length}</p>
                  </div>
                </div>
              </div>

              <div className="card bg-green-50 border-green-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Taxa de Sucesso</p>
                    <p className="text-2xl font-bold text-gray-900">95%</p>
                  </div>
                </div>
              </div>

              <div className="card bg-purple-50 border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tempo Médio</p>
                    <p className="text-2xl font-bold text-gray-900">2.3s</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Configuração</h3>
            <div className="card bg-gray-50">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-600">Modelo</p>
                  <p className="text-sm font-medium text-gray-900">{config.model || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Temperatura</p>
                  <p className="text-sm font-medium text-gray-900">{config.temperature || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Máx. Tokens</p>
                  <p className="text-sm font-medium text-gray-900">{config.maxTokens || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    agent.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {agent.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
              {config.systemPrompt && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Prompt do Sistema</p>
                  <p className="text-sm text-gray-900 bg-white p-3 rounded border border-gray-200">
                    {config.systemPrompt}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Conversations */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Conversas Processadas ({conversations.length})
            </h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="card text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm">Nenhuma conversa processada ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {conversations.map((conv) => (
                  <div key={conv.id} className="card hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900">{conv.phoneNumber}</p>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            conv.status === 'active'
                              ? 'bg-blue-100 text-blue-800'
                              : conv.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {conv.status === 'active' ? 'Ativa' : conv.status === 'completed' ? 'Concluída' : 'Falhou'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{conv.lastMessage}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {conv.messagesCount} mensagens
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(conv.timestamp).toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
