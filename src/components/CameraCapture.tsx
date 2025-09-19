import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Camera, Check } from 'lucide-react';
import { showError } from '@/utils/toast';

interface CameraCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (file: File) => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ open, onOpenChange, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accessing camera: ", err);
        showError("Não foi possível acessar a câmera. Verifique as permissões.");
        onOpenChange(false);
      }
    } else {
      showError("Seu navegador não suporta acesso à câmera.");
      onOpenChange(false);
    }
  }, [onOpenChange]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
      setCapturedImage(null);
    }

    return () => {
      stopCamera();
    };
  }, [open, startCamera, stopCamera]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleConfirm = () => {
    if (capturedImage && canvasRef.current) {
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
          onCapture(file);
          onOpenChange(false);
        }
      }, 'image/jpeg');
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Tirar Foto</DialogTitle>
        </DialogHeader>
        <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
          {capturedImage ? (
            <img src={capturedImage} alt="Captured" className="h-full w-full object-contain" />
          ) : (
            <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
        <DialogFooter className="gap-2 sm:justify-center">
          {capturedImage ? (
            <>
              <Button variant="outline" onClick={handleRetake}>
                Tirar Outra
              </Button>
              <Button onClick={handleConfirm}>
                <Check className="mr-2 h-4 w-4" />
                Usar esta foto
              </Button>
            </>
          ) : (
            <Button onClick={handleCapture} disabled={!stream}>
              <Camera className="mr-2 h-4 w-4" />
              Capturar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};