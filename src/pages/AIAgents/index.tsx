import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bot, Search, Loader2, Calendar, MoreVertical, Edit, Trash2, Power, Sparkles, Plus, TrendingUp, Activity, Zap, Eye } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { RootState, AppDispatch } from '@/store';
import { fetchAgents, deleteAgent, toggleAgent } from '@/store/slices/aiAgentSlice';
import AIAgentFormModal from '@/components/features/aiagents/AIAgentFormModal';
import TemplatesModal from '@/components/features/aiagents/TemplatesModal';
import AgentDetailsModal from '@/components/features/aiagents/AgentDetailsModal';
import { AIAgentResponse } from '@/types/aiagent.types';
import { toast } from 'react-hot-toast';

export default function AIAgentsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { agents, loading } = useSelector((state: RootState) => state.aiAgent);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AIAgentResponse | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchAgents());
  }, [dispatch]);

  const handleCreate = () => {
    setSelectedAgent(null);
    setIsModalOpen(true);
  };

  const handleEdit = (agent: AIAgentResponse) => {
    setSelectedAgent(agent);
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleViewDetails = (agent: AIAgentResponse) => {
    setSelectedAgent(agent);
    setIsDetailsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleToggle = async (agentId: string) => {
    try {
      await dispatch(toggleAgent(agentId)).unwrap();
      await dispatch(fetchAgents());
      toast.success('Status do agente atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar status do agente');
    }
    setOpenMenuId(null);
  };

  const handleDelete = async (agentId: string) => {
    if (confirm('Deseja deletar este agente? Esta ação não pode ser desfeita.')) {
      try {
        await dispatch(deleteAgent(agentId)).unwrap();
        toast.success('Agente deletado com sucesso!');
      } catch (error) {
        toast.error('Erro ao deletar agente');
      }
    }
    setOpenMenuId(null);
  };

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeAgents = agents.filter(a => a.isActive);
  const totalAgents = agents.length;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Agentes de IA</h1>
            <p className="text-gray-600 mt-1">Gerencie os agentes de inteligência artificial</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsTemplatesModalOpen(true)}
              className="px-4 py-2 border border-purple-500 text-purple-600 rounded-lg hover:bg-purple-50 flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Templates
            </button>
            <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Novo Agente
            </button>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total de Agentes</p>
                <p className="text-2xl font-bold text-gray-900">{totalAgents}</p>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Agentes Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{activeAgents.length}</p>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Taxa de Utilização</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalAgents > 0 ? Math.round((activeAgents.length / totalAgents) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="card">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nome ou tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Agents Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="col-span-full card text-center py-12 text-gray-500">
              <Bot className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">Nenhum agente encontrado</p>
              <p className="text-sm">Adicione um novo agente para começar</p>
            </div>
          ) : (
            filteredAgents.map((agent) => (
              <div key={agent.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 h-12 w-12 rounded-lg flex items-center justify-center ${
                      agent.isActive ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gray-300'
                    }`}>
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
                      <p className="text-sm text-gray-500">{agent.type}</p>
                    </div>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === agent.id ? null : agent.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {openMenuId === agent.id && (
                      <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                        <div className="py-1">
                          <button
                            onClick={() => handleViewDetails(agent)}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-purple-700 hover:bg-purple-50"
                          >
                            <Eye className="w-4 h-4" />
                            Ver Detalhes
                          </button>
                          <button
                            onClick={() => handleEdit(agent)}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Edit className="w-4 h-4" />
                            Editar
                          </button>
                          <button
                            onClick={() => handleToggle(agent.id)}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-blue-700 hover:bg-blue-50"
                          >
                            <Power className="w-4 h-4" />
                            {agent.isActive ? 'Desativar' : 'Ativar'}
                          </button>
                          <button
                            onClick={() => handleDelete(agent.id)}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                            Deletar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      agent.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {agent.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Criado em
                    </div>
                    <span>{new Date(agent.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>

                  {agent.updatedAt !== agent.createdAt && (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Atualizado em
                      </div>
                      <span>{new Date(agent.updatedAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AIAgentFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAgent(null);
        }}
        agent={selectedAgent}
      />

      <TemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
      />

      <AgentDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedAgent(null);
        }}
        agent={selectedAgent}
      />
    </MainLayout>
  );
}
