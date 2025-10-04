import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, X, File, Image, Video, FileText } from 'lucide-react';
import { cn } from '@/utils/helpers';

export type FileType = 'image' | 'video' | 'document';

interface FileUploadProps {
  accept?: string;
  maxSize?: number; // in MB
  fileType: FileType;
  onFileSelect: (file: File, base64: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

const FILE_TYPE_CONFIG = {
  image: {
    accept: 'image/*',
    maxSize: 10,
    icon: Image,
    label: 'Imagem',
    description: 'PNG, JPG, GIF até 10MB'
  },
  video: {
    accept: 'video/*',
    maxSize: 50,
    icon: Video,
    label: 'Vídeo',
    description: 'MP4, AVI, MOV até 50MB'
  },
  document: {
    accept: '.pdf,.doc,.docx,.xls,.xlsx,.txt',
    maxSize: 10,
    icon: FileText,
    label: 'Documento',
    description: 'PDF, DOC, XLS até 10MB'
  }
};

export default function FileUpload({
  accept,
  maxSize,
  fileType,
  onFileSelect,
  onCancel,
  disabled = false
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const config = FILE_TYPE_CONFIG[fileType];
  const acceptTypes = accept || config.accept;
  const maxSizeInMB = maxSize || config.maxSize;
  const Icon = config.icon;

  const validateFile = (file: File): string | null => {
    // Validate file size
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > maxSizeInMB) {
      return `Arquivo muito grande. Tamanho máximo: ${maxSizeInMB}MB`;
    }

    // Validate file type
    if (fileType === 'image' && !file.type.startsWith('image/')) {
      return 'Tipo de arquivo inválido. Selecione uma imagem.';
    }
    if (fileType === 'video' && !file.type.startsWith('video/')) {
      return 'Tipo de arquivo inválido. Selecione um vídeo.';
    }

    return null;
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove the data:image/png;base64, prefix
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFile = async (file: File) => {
    setError(null);
    setLoading(true);

    // Validate
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      // Convert to base64
      const base64 = await fileToBase64(file);

      // Create preview
      if (fileType === 'image' || fileType === 'video') {
        const previewUrl = URL.createObjectURL(file);
        setPreview(previewUrl);
      }

      setSelectedFile(file);
      onFileSelect(file, base64);
    } catch (err) {
      setError('Erro ao processar arquivo');
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();

    if (disabled) return;

    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    onCancel?.();
  };

  return (
    <div className="w-full">
      {/* Upload Area */}
      {!selectedFile && (
        <div
          className={cn(
            'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors',
            dragActive ? 'border-primary bg-primary/5' : 'border-gray-300',
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary'
          )}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={handleButtonClick}
        >
          <input
            ref={inputRef}
            type="file"
            accept={acceptTypes}
            onChange={handleChange}
            disabled={disabled}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon className="w-8 h-8 text-primary" />
            </div>

            <div>
              <p className="text-lg font-medium text-gray-700 mb-1">
                {loading ? 'Processando...' : `Selecione ${config.label}`}
              </p>
              <p className="text-sm text-gray-500">
                {config.description}
              </p>
            </div>

            {!loading && (
              <button
                type="button"
                className="mt-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                disabled={disabled}
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Escolher Arquivo
              </button>
            )}

            {loading && (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            )}
          </div>

          {dragActive && (
            <div className="absolute inset-0 bg-primary/5 rounded-lg pointer-events-none" />
          )}
        </div>
      )}

      {/* Preview Area */}
      {selectedFile && !loading && (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              title="Remover"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Image Preview */}
          {preview && fileType === 'image' && (
            <div className="mt-3">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-auto max-h-64 object-contain rounded-lg"
              />
            </div>
          )}

          {/* Video Preview */}
          {preview && fileType === 'video' && (
            <div className="mt-3">
              <video
                src={preview}
                controls
                className="w-full h-auto max-h-64 rounded-lg"
              />
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
