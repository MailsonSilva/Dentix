import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Camera, X, ZoomIn, ZoomOut } from 'lucide-react';
import { Slider } from "@/components/ui/slider";
import { toast } from 'sonner';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode] = useState<'user' | 'environment'>('environment'); // Mantendo 'environment' como padrão e fixo
  const [zoom, setZoom] = useState(1);
  const [zoomCapabilities, setZoomCapabilities] = useState<any>(null);

  // Removendo useEffect para verificar múltiplas câmeras e hasMultipleCameras state

  const startCamera = useCallback(async (mode: 'user' | 'environment') => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    const processStream = (newStream: MediaStream) => {
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      const videoTrack = newStream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities();
        if ('zoom' in capabilities) {
          setZoomCapabilities(capabilities.zoom);
          setZoom((capabilities.zoom as any).min);
        } else {
          setZoomCapabilities(null);
        }
      }
    };

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
      processStream(newStream);
    } catch (err) {
      console.warn(`Falha ao obter câmera com facingMode: ${mode}. Tentando fallback.`, err);
      const fallbackConstraints: MediaStreamConstraints = {
        video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      };
      try {
        const newStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
        processStream(newStream);
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
    // Inicia a câmera apenas com o modo 'environment' (câmera traseira)
    startCamera('environment');
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependência vazia para rodar apenas uma vez

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

  // Removendo toggleCamera

  const handleZoomChange = (newZoomValue: number[]) => {
    const newZoom = newZoomValue[0];
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack && 'zoom' in videoTrack.getCapabilities()) {
      videoTrack.applyConstraints({ advanced: [{ zoom: newZoom }] })
        .then(() => setZoom(newZoom))
        .catch((error) => console.error("Error applying zoom:", error));
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-24">
        <div 
          className="w-[85vw] max-w-[500px] aspect-[3/4] border-4 border-white/50 border-dashed rounded-[50%]"
          style={{
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
          }}
        />
      </div>

      {zoomCapabilities && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-2/3 max-w-xs flex items-center gap-4 bg-black/30 p-2 rounded-full backdrop-blur-sm">
          <ZoomOut className="text-white h-6 w-6" />
          <Slider
            min={zoomCapabilities.min}
            max={zoomCapabilities.max}
            step={zoomCapabilities.step}
            value={[zoom]}
            onValueChange={handleZoomChange}
          />
          <ZoomIn className="text-white h-6 w-6" />
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/30 flex justify-around items-center">
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 rounded-full w-16 h-16">
          <X size={32} />
        </Button>
        <Button onClick={handleCapture} className="w-20 h-20 rounded-full bg-white hover:bg-gray-200 border-4 border-black/50 p-2">
          <Camera size={40} className="text-black" />
        </Button>
        {/* Espaço vazio para manter o layout centralizado */}
        <div className="w-16 h-16" />
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraCapture;