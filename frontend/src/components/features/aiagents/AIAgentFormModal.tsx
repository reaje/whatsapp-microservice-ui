import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { X, Loader2, Save } from 'lucide-react';
import { AppDispatch } from '@/store';
import { createAgent, updateAgent, fetchAgents } from '@/store/slices/aiAgentSlice';
import { AIAgentResponse } from '@/types/aiagent.types';
import { toast } from 'react-hot-toast';

interface AIAgentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: AIAgentResponse | null;
}

export default function AIAgentFormModal({ isOpen, onClose, agent }: AIAgentFormModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'chatbot',
    configuration: '',
    isActive: true,
  });

  const [configMode, setConfigMode] = useState<'simple' | 'advanced'>('simple');
  const [simpleConfig, setSimpleConfig] = useState({
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,
    systemPrompt: '',
  });

  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name,
        type: agent.type,
        configuration: agent.configuration || '',
        isActive: agent.isActive,
      });

      // Try to parse configuration
      if (agent.configuration) {
        try {
          const parsed = JSON.parse(agent.configuration);
          setSimpleConfig({
            model: parsed.model || 'gpt-4',
            temperature: parsed.temperature || 0.7,
            maxTokens: parsed.maxTokens || 2000,
            systemPrompt: parsed.systemPrompt || '',
          });
        } catch (e) {
          // Invalid JSON, keep defaults
        }
      }
    } else {
      setFormData({
        name: '',
        type: 'chatbot',
        configuration: '',
        isActive: true,
      });
      setSimpleConfig({
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
        systemPrompt: '',
      });
    }
  }, [agent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Build configuration
      let configuration: string | null = null;
      if (configMode === 'simple') {
        configuration = JSON.stringify(simpleConfig, null, 2);
      } else {
        configuration = formData.configuration || null;
      }

      if (agent) {
        // Update
        await dispatch(updateAgent({
          agentId: agent.id,
          data: {
            name: formData.name,
            type: formData.type,
            configuration,
            isActive: formData.isActive,
          },
        })).unwrap();
        toast.success('Agente atualizado com sucesso!');
      } else {
        // Create
        await dispatch(createAgent({
          name: formData.name,
          type: formData.type,
          configuration,
        })).unwrap();
        toast.success('Agente criado com sucesso!');
      }
      await dispatch(fetchAgents());
      onClose();
    } catch (error: any) {
      toast.error(error || 'Erro ao salvar agente');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-800">
            {agent ? 'Editar Agente' : 'Novo Agente'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Agente *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Assistente de Vendas"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Agente *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="chatbot">Chatbot</option>
              <option value="support">Suporte ao Cliente</option>
              <option value="sales">Vendas</option>
              <option value="marketing">Marketing</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Configuração
            </label>

            {/* Config Mode Tabs */}
            <div className="flex gap-2 mb-4 border-b border-gray-200">
              <button
                type="button"
                onClick={() => setConfigMode('simple')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  configMode === 'simple'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Simples
              </button>
              <button
                type="button"
                onClick={() => setConfigMode('advanced')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  configMode === 'advanced'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Avançado (JSON)
              </button>
            </div>

            {/* Simple Config */}
            {configMode === 'simple' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Modelo
                  </label>
                  <select
                    value={simpleConfig.model}
                    onChange={(e) => setSimpleConfig({ ...simpleConfig, model: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="claude-3-opus">Claude 3 Opus</option>
                    <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Temperatura: {simpleConfig.temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={simpleConfig.temperature}
                    onChange={(e) => setSimpleConfig({ ...simpleConfig, temperature: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Controla a criatividade (0 = conservador, 2 = criativo)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Máximo de Tokens
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="8000"
                    step="100"
                    value={simpleConfig.maxTokens}
                    onChange={(e) => setSimpleConfig({ ...simpleConfig, maxTokens: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prompt do Sistema
                  </label>
                  <textarea
                    value={simpleConfig.systemPrompt}
                    onChange={(e) => setSimpleConfig({ ...simpleConfig, systemPrompt: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Você é um assistente útil que..."
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Define o comportamento e personalidade do agente
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <textarea
                  value={formData.configuration}
                  onChange={(e) => setFormData({ ...formData, configuration: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                  placeholder='{"model": "gpt-4", "temperature": 0.7, "maxTokens": 2000, "systemPrompt": "..."}'
                  rows={8}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Configure parâmetros em formato JSON
                </p>
              </div>
            )}
          </div>

          {agent && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                Agente ativo
              </label>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
