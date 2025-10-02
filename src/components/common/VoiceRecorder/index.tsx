import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Send, X } from 'lucide-react';
import { cn } from '@/utils/helpers';

interface VoiceRecorderProps {
  onAudioReady: (audioBlob: Blob, base64: string, duration: number) => void;
  onCancel?: () => void;
  maxDuration?: number; // in seconds
}

export default function VoiceRecorder({
  onAudioReady,
  onCancel,
  maxDuration = 300 // 5 minutes
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      stopMediaStream();
    };
  }, []);

  const stopMediaStream = () => {
    if (mediaRecorderRef.current?.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const startTimer = () => {
    timerIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => {
        if (prev >= maxDuration) {
          stopRecording();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      setError(null);

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType
        });
        setAudioBlob(blob);

        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        stopMediaStream();
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      startTimer();
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Não foi possível acessar o microfone. Verifique as permissões.');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      stopTimer();
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      startTimer();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      stopTimer();
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
    audioChunksRef.current = [];
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove the data:audio/webm;base64, prefix
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const sendAudio = async () => {
    if (!audioBlob) return;

    try {
      const base64 = await blobToBase64(audioBlob);
      onAudioReady(audioBlob, base64, recordingTime);
    } catch (err) {
      setError('Erro ao processar áudio');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full bg-white rounded-lg p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          {isRecording ? 'Gravando Áudio' : audioBlob ? 'Pré-visualizar Áudio' : 'Gravar Áudio'}
        </h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>

      {/* Timer/Waveform */}
      <div className="mb-6">
        <div className="flex items-center justify-center mb-4">
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center transition-colors",
            isRecording && !isPaused ? "bg-red-100 animate-pulse" : "bg-primary/10"
          )}>
            <Mic className={cn(
              "w-10 h-10",
              isRecording && !isPaused ? "text-red-500" : "text-primary"
            )} />
          </div>
        </div>

        <div className="text-center">
          <p className="text-3xl font-mono font-bold text-gray-800 mb-2">
            {formatTime(recordingTime)}
          </p>
          <p className="text-sm text-gray-500">
            {isRecording
              ? (isPaused ? 'Gravação pausada' : 'Gravando...')
              : audioBlob
                ? 'Gravação concluída'
                : 'Pressione o botão para iniciar'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${(recordingTime / maxDuration) * 100}%` }}
          />
        </div>
      </div>

      {/* Audio Preview */}
      {audioUrl && !isRecording && (
        <div className="mb-6">
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />

          <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-4">
            <button
              onClick={isPlaying ? pauseAudio : playAudio}
              className="p-3 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </button>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-primary/30 rounded-full"
                    style={{
                      height: `${Math.random() * 30 + 10}px`,
                      minWidth: '3px'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {!isRecording && !audioBlob && (
          <button
            onClick={startRecording}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Mic className="w-5 h-5" />
            Iniciar Gravação
          </button>
        )}

        {isRecording && (
          <>
            {isPaused ? (
              <button
                onClick={resumeRecording}
                className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                title="Continuar"
              >
                <Play className="w-6 h-6" />
              </button>
            ) : (
              <button
                onClick={pauseRecording}
                className="p-3 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition-colors"
                title="Pausar"
              >
                <Pause className="w-6 h-6" />
              </button>
            )}

            <button
              onClick={stopRecording}
              className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              title="Parar"
            >
              <Square className="w-6 h-6" />
            </button>
          </>
        )}

        {audioBlob && !isRecording && (
          <>
            <button
              onClick={deleteRecording}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              Excluir
            </button>

            <button
              onClick={sendAudio}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              <Send className="w-5 h-5" />
              Enviar Áudio
            </button>
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-700">
          💡 Tempo máximo: {formatTime(maxDuration)}
        </p>
      </div>
    </div>
  );
}
