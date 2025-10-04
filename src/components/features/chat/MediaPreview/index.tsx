import { useState, useRef, useEffect } from 'react';
import { Send, X, Image as ImageIcon, Video, FileText } from 'lucide-react';
import { cn } from '@/utils/helpers';
import type { MessageType } from '@/types';

interface MediaPreviewProps {
  file: File;
  base64: string;
  type: MessageType;
  onSend: (base64: string, caption?: string) => void;
  onCancel: () => void;
}

export default function MediaPreview({
  file,
  base64,
  type,
  onSend,
  onCancel
}: MediaPreviewProps) {
  const [caption, setCaption] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Create preview URL for the file
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const handleSend = () => {
    onSend(base64, caption.trim() || undefined);
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCaption(e.target.value);

    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const getIcon = () => {
    switch (type) {
      case 'image':
        return ImageIcon;
      case 'video':
        return Video;
      case 'document':
        return FileText;
      default:
        return FileText;
    }
  };

  const Icon = getIcon();

  const renderPreview = () => {
    switch (type) {
      case 'image':
        return (
          <div className="relative w-full h-96 bg-black rounded-lg overflow-hidden">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-contain"
            />
          </div>
        );

      case 'video':
        return (
          <div className="relative w-full h-96 bg-black rounded-lg overflow-hidden">
            <video
              src={previewUrl}
              controls
              className="w-full h-full object-contain"
            />
          </div>
        );

      case 'document':
        return (
          <div className="flex items-center justify-center p-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon className="w-10 h-10 text-primary" />
              </div>
              <p className="font-medium text-gray-800 mb-1">{file.name}</p>
              <p className="text-sm text-gray-500">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">
                Pré-visualizar {type === 'image' ? 'Imagem' : type === 'video' ? 'Vídeo' : 'Documento'}
              </h3>
              <p className="text-sm text-gray-500">
                {file.name}
              </p>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Cancelar"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Preview Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          {renderPreview()}
        </div>

        {/* Caption Input */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Legenda (opcional)
              </label>
              <textarea
                ref={textareaRef}
                value={caption}
                onChange={handleCaptionChange}
                placeholder="Adicione uma legenda..."
                rows={1}
                className={cn(
                  'w-full px-4 py-2 bg-gray-100 rounded-lg resize-none',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white',
                  'max-h-[120px] overflow-y-auto'
                )}
                style={{ minHeight: '40px' }}
              />
              {caption.length > 0 && (
                <p className={cn(
                  'text-xs mt-1',
                  caption.length > 1000 ? 'text-red-500' : 'text-gray-400'
                )}>
                  {caption.length} / 1024
                </p>
              )}
            </div>

            <button
              onClick={handleSend}
              disabled={caption.length > 1024}
              className={cn(
                'flex items-center gap-2 px-6 py-3 rounded-lg transition-colors',
                caption.length > 1024
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary-dark'
              )}
            >
              <Send className="w-5 h-5" />
              Enviar
            </button>
          </div>
        </div>

        {/* File Info */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Tamanho: {(file.size / (1024 * 1024)).toFixed(2)} MB
            </span>
            <span className="text-gray-600">
              Tipo: {file.type || 'Desconhecido'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
