import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Smile, Paperclip } from 'lucide-react';
import { cn } from '@/utils/helpers';
import AttachmentMenu, { type AttachmentType } from '../AttachmentMenu';
import FileUpload, { type FileType } from '@/components/common/FileUpload';
import VoiceRecorder from '@/components/common/VoiceRecorder';
import LocationPicker from '@/components/common/LocationPicker';
import MediaPreview from '../MediaPreview';
import type { MessageType } from '@/types';

interface MessageInputProps {
  onSend: (message: string) => void;
  onSendMedia?: (file: File, base64: string, type: MessageType, caption?: string) => void;
  onSendAudio?: (audioBlob: Blob, base64: string, duration: number) => void;
  onSendLocation?: (latitude: number, longitude: number, address?: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function MessageInput({
  onSend,
  onSendMedia,
  onSendAudio,
  onSendLocation,
  disabled = false,
  placeholder = 'Digite uma mensagem...',
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [fileUploadType, setFileUploadType] = useState<FileType>('image');
  const [selectedFile, setSelectedFile] = useState<{ file: File; base64: string; type: MessageType } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!message.trim() || disabled) return;

    onSend(message.trim());
    setMessage('');

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleAttachmentSelect = (type: AttachmentType) => {
    switch (type) {
      case 'image':
        setFileUploadType('image');
        setShowFileUpload(true);
        break;
      case 'video':
        setFileUploadType('video');
        setShowFileUpload(true);
        break;
      case 'document':
        setFileUploadType('document');
        setShowFileUpload(true);
        break;
      case 'audio':
        setShowVoiceRecorder(true);
        break;
      case 'location':
        setShowLocationPicker(true);
        break;
    }
  };

  const handleFileSelect = (file: File, base64: string) => {
    let messageType: MessageType;
    switch (fileUploadType) {
      case 'image':
        messageType = 'image';
        break;
      case 'video':
        messageType = 'video';
        break;
      case 'document':
        messageType = 'document';
        break;
      default:
        messageType = 'document';
    }

    setSelectedFile({ file, base64, type: messageType });
    setShowFileUpload(false);
  };

  const handleMediaSend = (base64: string, caption?: string) => {
    if (selectedFile && onSendMedia) {
      onSendMedia(selectedFile.file, base64, selectedFile.type, caption);
      setSelectedFile(null);
    }
  };

  const handleAudioReady = (audioBlob: Blob, base64: string, duration: number) => {
    if (onSendAudio) {
      onSendAudio(audioBlob, base64, duration);
    }
    setShowVoiceRecorder(false);
  };

  const handleLocationSelect = (location: { latitude: number; longitude: number; address?: string }) => {
    if (onSendLocation) {
      onSendLocation(location.latitude, location.longitude, location.address);
    }
    setShowLocationPicker(false);
  };

  return (
    <>
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-end gap-2 relative">
          {/* Emoji Button (placeholder for future) */}
          <button
            type="button"
            disabled={disabled}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Emoji"
          >
            <Smile className="w-5 h-5 text-gray-600" />
          </button>

          {/* Attachment Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              disabled={disabled}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Anexar arquivo"
            >
              <Paperclip className="w-5 h-5 text-gray-600" />
            </button>

            {/* Attachment Menu */}
            <AttachmentMenu
              isOpen={showAttachmentMenu}
              onClose={() => setShowAttachmentMenu(false)}
              onSelect={handleAttachmentSelect}
            />
          </div>

          {/* Message Input */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={message}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className={cn(
                'w-full px-4 py-2 bg-gray-100 rounded-full resize-none',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'max-h-[120px] overflow-y-auto'
              )}
              style={{ minHeight: '40px' }}
            />
          </div>

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={disabled || !message.trim()}
            className={cn(
              'p-2 rounded-full transition-colors',
              message.trim()
                ? 'bg-primary text-white hover:bg-primary-dark'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
            title="Enviar mensagem"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Character count (optional) */}
        {message.length > 0 && (
          <div className="flex justify-end mt-1">
            <span className={cn(
              'text-xs',
              message.length > 1000 ? 'text-red-500' : 'text-gray-400'
            )}>
              {message.length} / 4096
            </span>
          </div>
        )}
      </div>

      {/* File Upload Modal */}
      {showFileUpload && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <FileUpload
              fileType={fileUploadType}
              onFileSelect={handleFileSelect}
              onCancel={() => setShowFileUpload(false)}
            />
          </div>
        </div>
      )}

      {/* Voice Recorder Modal */}
      {showVoiceRecorder && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <VoiceRecorder
            onAudioReady={handleAudioReady}
            onCancel={() => setShowVoiceRecorder(false)}
          />
        </div>
      )}

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <LocationPicker
          onLocationSelect={handleLocationSelect}
          onCancel={() => setShowLocationPicker(false)}
        />
      )}

      {/* Media Preview Modal */}
      {selectedFile && (
        <MediaPreview
          file={selectedFile.file}
          base64={selectedFile.base64}
          type={selectedFile.type}
          onSend={handleMediaSend}
          onCancel={() => setSelectedFile(null)}
        />
      )}
    </>
  );
}
