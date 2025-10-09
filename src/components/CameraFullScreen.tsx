import React, { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Check, Zap, ZapOff, X, ZoomIn, ZoomOut } from "lucide-react";
import { showError } from "@/utils/toast";
import { FramingGuide } from "./FramingGuide";
import { Slider } from "@/components/ui/slider";

interface CameraFullScreenProps {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export const CameraFullScreen: React.FC<CameraFullScreenProps> = ({
  open,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomRange, setZoomRange] = useState({ min: 1, max: 10, step: 0.1 });
  const [hasZoom, setHasZoom] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    stopStream();
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const constraints = {
          video: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        };
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = mediaStream;

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setIsCameraReady(true);

        const videoTrack = mediaStream.getVideoTracks()[0];
        const capabilities = videoTrack.getCapabilities();
        // @ts-ignore
        setHasFlash(!!capabilities.torch);
        // @ts-ignore
        if (capabilities.zoom) {
          setHasZoom(true);
          // @ts-ignore
          setZoomRange({ min: capabilities.zoom.min, max: capabilities.zoom.max, step: capabilities.zoom.step });
        } else {
          setHasZoom(false);
        }
      } catch (err) {
        console.error("Error accessing camera: ", err);
        showError("Não foi possível acessar a câmera. Verifique as permissões.");
        onClose();
      }
    } else {
      showError("Seu navegador não suporta acesso à câmera.");
      onClose();
    }
  }, [onClose, stopStream]);

  useEffect(() => {
    if (open && !capturedImage) {
      startCamera();
    } else if (!open) {
      stopStream();
    }

    return () => {
      if (open) {
        stopStream();
      }
    };
  }, [open, capturedImage, startCamera, stopStream]);

  useEffect(() => {
    if (streamRef.current && hasZoom && isCameraReady) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      try {
        // @ts-ignore
        videoTrack.applyConstraints({ advanced: [{ zoom: zoomLevel }] });
      } catch (error) {
        console.error("Error applying zoom:", error);
      }
    }
  }, [zoomLevel, hasZoom, isCameraReady]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setCapturedImage(dataUrl);
        stopStream();
      }
    }
  };

  const handleConfirm = () => {
    if (capturedImage && canvasRef.current) {
      canvasRef.current.toBlob(
        (blob) => {
          if (blob) {
            const file = new File([blob], `capture-${Date.now()}.jpg`, {
              type: "image/jpeg",
            });
            onCapture(file);
            handleClose();
          }
        },
        "image/jpeg"
      );
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setZoomLevel(1);
  };

  const handleToggleFlash = async () => {
    if (streamRef.current && hasFlash) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      try {
        await videoTrack.applyConstraints({ advanced: [{ torch: !isFlashOn }] } as any);
        setIsFlashOn(!isFlashOn);
      } catch (err) {
        console.error("Failed to toggle flash", err);
        showError("Não foi possível controlar o flash.");
      }
    }
  };

  const handleClose = () => {
    setCapturedImage(null);
    stopStream();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black w-screen h-screen flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 z-10">
        <Button variant="ghost" size="icon" onClick={handleClose}>
          <X className="h-6 w-6 text-white" />
        </Button>
        {hasFlash && !capturedImage && (
          <Button
            variant="outline"
            size="icon"
            onClick={handleToggleFlash}
            className="bg-black/50 border-white"
          >
            {isFlashOn ? (
              <ZapOff className="h-5 w-5 text-white" />
            ) : (
              <Zap className="h-5 w-5 text-white" />
            )}
          </Button>
        )}
        {/* Spacer to keep close button left-aligned if flash is not available */}
        {!hasFlash && <div className="w-10 h-10" />}
      </div>

      {/* Visualização da câmera ou imagem capturada */}
      <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden">
        {capturedImage ? (
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-contain bg-black"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover bg-black"
            />
            <FramingGuide />
          </>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Controles */}
      <div className="flex flex-col items-center gap-4 p-4 z-10">
        {hasZoom && !capturedImage && (
          <div className="w-4/5 max-w-xs p-2 bg-black/50 rounded-lg flex items-center gap-4">
            <ZoomOut className="h-6 w-6 text-white" />
            <Slider
              value={[zoomLevel]}
              min={zoomRange.min}
              max={zoomRange.max}
              step={zoomRange.step}
              onValueChange={(value) => setZoomLevel(value[0])}
            />
            <ZoomIn className="h-6 w-6 text-white" />
          </div>
        )}
        <div className="flex justify-center items-center gap-4">
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
            <Button onClick={handleCapture} disabled={!isCameraReady} className="w-20 h-20 rounded-full">
              <Camera className="h-8 w-8" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};