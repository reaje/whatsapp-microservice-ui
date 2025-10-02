import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Smartphone } from 'lucide-react';
import { initializeSessionSchema, type InitializeSessionInput } from '@/utils/validators';
import type { ProviderType } from '@/types';

interface InitializeSessionModalProps {
  onClose: () => void;
  onSubmit: (data: InitializeSessionInput) => Promise<void>;
}

export default function InitializeSessionModal({
  onClose,
  onSubmit
}: InitializeSessionModalProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<InitializeSessionInput>({
    resolver: zodResolver(initializeSessionSchema),
    defaultValues: {
      phoneNumber: '',
      providerType: 'baileys',
    },
  });

  const providerType = watch('providerType');

  const handleFormSubmit = async (data: InitializeSessionInput) => {
    setLoading(true);
    try {
      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error('Error initializing session:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Nova Sessão WhatsApp
              </h2>
              <p className="text-sm text-gray-600">
                Conecte um novo número
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
          {/* Provider Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Provider
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="relative">
                <input
                  {...register('providerType')}
                  type="radio"
                  value="baileys"
                  className="peer sr-only"
                  disabled={loading}
                />
                <div className="p-4 border-2 rounded-lg cursor-pointer transition-all peer-checked:border-primary peer-checked:bg-primary/5">
                  <div className="font-medium text-gray-800">Baileys</div>
                  <div className="text-xs text-gray-600 mt-1">
                    WhatsApp Web
                  </div>
                </div>
              </label>

              <label className="relative">
                <input
                  {...register('providerType')}
                  type="radio"
                  value="meta_api"
                  className="peer sr-only"
                  disabled={loading}
                />
                <div className="p-4 border-2 rounded-lg cursor-pointer transition-all peer-checked:border-primary peer-checked:bg-primary/5">
                  <div className="font-medium text-gray-800">Meta API</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Business API
                  </div>
                </div>
              </label>
            </div>
            {errors.providerType && (
              <p className="text-red-500 text-sm mt-1">{errors.providerType.message}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Telefone
            </label>
            <input
              {...register('phoneNumber')}
              type="tel"
              placeholder="5511999999999"
              className="input-primary"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Apenas números, incluindo DDI e DDD (ex: 5511999999999)
            </p>
            {errors.phoneNumber && (
              <p className="text-red-500 text-sm mt-1">{errors.phoneNumber.message}</p>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2 text-sm">
              {providerType === 'baileys' ? 'Baileys (WhatsApp Web)' : 'Meta API'}
            </h4>
            {providerType === 'baileys' ? (
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Conexão via QR Code</li>
                <li>• Não requer aprovação do WhatsApp</li>
                <li>• Ideal para testes e uso pessoal</li>
                <li>• Pode ser desconectado se o celular ficar offline</li>
              </ul>
            ) : (
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Requer credenciais da Meta</li>
                <li>• Número comercial verificado</li>
                <li>• Maior estabilidade</li>
                <li>• Ideal para uso em produção</li>
              </ul>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary disabled:opacity-50"
            >
              {loading ? 'Inicializando...' : 'Inicializar'}
            </button>
          </div>
        </form>

        {/* Footer Info */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            {providerType === 'baileys'
              ? 'Após inicializar, você receberá um QR Code para escanear com seu WhatsApp.'
              : 'Certifique-se de ter configurado as credenciais da Meta API nas configurações.'}
          </p>
        </div>
      </div>
    </div>
  );
}
