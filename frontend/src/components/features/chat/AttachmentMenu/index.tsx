import { useRef, useEffect } from 'react';
import { Image, Video, FileText, Mic, MapPin, X } from 'lucide-react';
import { cn } from '@/utils/helpers';

export type AttachmentType = 'image' | 'video' | 'document' | 'audio' | 'location';

interface AttachmentOption {
  type: AttachmentType;
  label: string;
  icon: typeof Image;
  color: string;
  bgColor: string;
}

const ATTACHMENT_OPTIONS: AttachmentOption[] = [
  {
    type: 'image',
    label: 'Imagem',
    icon: Image,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 hover:bg-purple-200'
  },
  {
    type: 'video',
    label: 'Vídeo',
    icon: Video,
    color: 'text-red-600',
    bgColor: 'bg-red-100 hover:bg-red-200'
  },
  {
    type: 'document',
    label: 'Documento',
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 hover:bg-blue-200'
  },
  {
    type: 'audio',
    label: 'Áudio',
    icon: Mic,
    color: 'text-green-600',
    bgColor: 'bg-green-100 hover:bg-green-200'
  },
  {
    type: 'location',
    label: 'Localização',
    icon: MapPin,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 hover:bg-orange-200'
  }
];

interface AttachmentMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: AttachmentType) => void;
}

export default function AttachmentMenu({
  isOpen,
  onClose,
  onSelect
}: AttachmentMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close on ESC key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelect = (type: AttachmentType) => {
    onSelect(type);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Menu */}
      <div
        ref={menuRef}
        className="absolute bottom-full left-0 mb-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 w-80">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Anexar</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              title="Fechar"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-3 gap-3">
            {ATTACHMENT_OPTIONS.map((option) => {
              const Icon = option.icon;

              return (
                <button
                  key={option.type}
                  onClick={() => handleSelect(option.type)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all hover:scale-105"
                >
                  <div
                    className={cn(
                      'w-14 h-14 rounded-full flex items-center justify-center transition-colors',
                      option.bgColor
                    )}
                  >
                    <Icon className={cn('w-7 h-7', option.color)} />
                  </div>
                  <span className="text-xs font-medium text-gray-700">
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Info */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              Escolha o tipo de anexo que deseja enviar
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
