import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Camera, Check, Zap, ZapOff } from 'lucide-react';
import { showError } from '@/utils/toast';
import { FramingGuide } from './FramingGuide';

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
  const [retakeCounter, setRetakeCounter] = useState(0);
  // Removido o estado de facingMode
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    const startCamera = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const constraints = {
            video: {
              facingMode: { exact: "environment" }, // Força a câmera traseira
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
          };
          const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
          currentStream = mediaStream;
          setStream(mediaStream);

          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }

          // Check for flash capability
          const videoTrack = mediaStream.getVideoTracks()[0];
          const capabilities = videoTrack.getCapabilities();
          setHasFlash(!!capabilities.torch);

        } catch (err) {
          console.error("Error accessing camera: ", err);
          showError("Não foi possível acessar a câmera. Verifique as permissões.");
          onOpenChange(false);
        }
      } else {
        showError("Seu navegador não suporta acesso à câmera.");
        onOpenChange(false);
      }
    };

    if (open && !capturedImage) {
      startCamera();
    }

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
      setStream(null);
      setHasFlash(false);
      setIsFlashOn(false);
    };
  }, [open, onOpenChange, capturedImage, retakeCounter]);

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

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
        stopStream();
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
          setCapturedImage(null);
        }
      }, 'image/jpeg');
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setRetakeCounter(c => c + 1);
  };

  // Removido handleSwitchCamera e estado de facingMode

  const handleToggleFlash = async () => {
    if (stream && hasFlash) {
      const videoTrack = stream.getVideoTracks()[0];
      try {
        await videoTrack.applyConstraints({ advanced: [{ torch: !isFlashOn }] });
        setIsFlashOn(!isFlashOn);
      } catch (err) {
        console.error("Failed to toggle flash", err);
        showError("Não foi possível controlar o flash.");
      }
    }
  };

  const handleDialogChange = (isOpen: boolean) => {
    if (!isOpen) {
      setCapturedImage(null);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Tirar Foto</DialogTitle>
        </DialogHeader>
        <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
          {capturedImage ? (
            <img src={capturedImage} alt="Captured" className="h-full w-full object-contain" />
          ) : (
            <>
              <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
              <FramingGuide />
              <div className="absolute top-2 right-2 flex flex-col gap-2">
                {/* Removido o botão de alternar câmera */}
                {hasFlash && (
                  <Button variant="outline" size="icon" onClick={handleToggleFlash}>
                    {isFlashOn ? <ZapOff className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
                  </Button>
                )}
              </div>
            </>
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