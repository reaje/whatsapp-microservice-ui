import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { AppDispatch, RootState } from '@/store';
import { fetchTemplates, createFromTemplate, fetchAgents } from '@/store/slices/aiAgentSlice';
import { toast } from 'react-hot-toast';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TemplatesModal({ isOpen, onClose }: TemplatesModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { templates, loading } = useSelector((state: RootState) => state.aiAgent);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [agentName, setAgentName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchTemplates());
    }
  }, [isOpen, dispatch]);

  const handleCreate = async () => {
    if (!selectedTemplateId) {
      toast.error('Selecione um template');
      return;
    }

    setCreating(true);
    try {
      await dispatch(createFromTemplate({
        templateId: selectedTemplateId,
        data: { name: agentName || undefined }
      })).unwrap();

      toast.success('Agente criado com sucesso a partir do template!');
      await dispatch(fetchAgents());
      onClose();
      setSelectedTemplateId(null);
      setAgentName('');
    } catch (error: any) {
      toast.error(error || 'Erro ao criar agente a partir do template');
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Templates de Agentes
              </h2>
              <p className="text-sm text-gray-600">Crie um agente a partir de um template pré-configurado</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">Nenhum template disponível</p>
              <p className="text-sm">Templates serão adicionados em breve</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 mb-6">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplateId(template.id)}
                    className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedTemplateId === template.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    {selectedTemplateId === template.id && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="w-5 h-5 text-purple-600" />
                      </div>
                    )}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {template.description}
                    </p>
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {template.type}
                    </span>
                  </div>
                ))}
              </div>

              {selectedTemplateId && (
                <div className="border-t border-gray-200 pt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Agente (opcional)
                  </label>
                  <input
                    type="text"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="Deixe vazio para usar o nome padrão"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-4"
                  />

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleCreate}
                      disabled={creating}
                      className="btn-primary flex items-center gap-2"
                    >
                      {creating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Criar Agente
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
