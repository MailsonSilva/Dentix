import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Camera, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        if (videoDevices.length > 1) {
          setHasMultipleCameras(true);
        }
      });
  }, []);

  const startCamera = useCallback(async (mode: 'user' | 'environment') => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: mode,
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    };

    try {
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.warn(`Falha ao obter câmera com facingMode: ${mode}. Tentando fallback.`, err);
      
      const fallbackConstraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      try {
        const newStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
        setStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
        setHasMultipleCameras(false);
      } catch (fallbackErr) {
        console.error("Erro ao acessar a câmera (mesmo com fallback):", fallbackErr);
        let errorMessage = "Não foi possível acessar a câmera. Verifique as permissões do seu navegador.";
        if (fallbackErr instanceof DOMException) {
            if (fallbackErr.name === "NotAllowedError") {
                errorMessage = "Permissão para acessar a câmera foi negada.";
            } else if (fallbackErr.name === "NotFoundError") {
                errorMessage = "Nenhuma câmera foi encontrada no seu dispositivo.";
            }
        }
        toast.error(errorMessage);
        onClose();
      }
    }
  }, [stream, onClose]);

  useEffect(() => {
    startCamera(facingMode);

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // This effect should only run when facingMode changes or the component mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            onCapture(file);
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div 
          className="w-[70vw] max-w-[400px] aspect-[3/4] border-4 border-white/50 border-dashed rounded-[50%]"
          style={{
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
          }}
        />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/30 flex justify-around items-center">
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 rounded-full w-16 h-16">
          <X size={32} />
        </Button>
        <Button onClick={handleCapture} className="w-20 h-20 rounded-full bg-white hover:bg-gray-200 border-4 border-black/50 p-2">
          <Camera size={40} className="text-black" />
        </Button>
        {hasMultipleCameras ? (
          <Button variant="ghost" size="icon" onClick={toggleCamera} className="text-white hover:bg-white/20 rounded-full w-16 h-16">
            <RefreshCw size={32} />
          </Button>
        ) : (
          <div className="w-16 h-16" /> // Placeholder to keep layout consistent
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraCapture;