import React, { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Check, Zap, ZapOff, X } from "lucide-react";
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
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomRange, setZoomRange] = useState({ min: 1, max: 10, step: 0.1 });
  const [hasZoom, setHasZoom] = useState(false);

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const startCamera = useCallback(async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const constraints = {
          video: {
            facingMode: { exact: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        };
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }

        // Check for flash and zoom capabilities
        const videoTrack = mediaStream.getVideoTracks()[0];
        const capabilities = videoTrack.getCapabilities();
        // @ts-ignore
        if (capabilities.torch) {
          setHasFlash(true);
        }
        // @ts-ignore
        if (capabilities.zoom) {
          setHasZoom(true);
          // @ts-ignore
          setZoomRange({ min: capabilities.zoom.min, max: capabilities.zoom.max, step: capabilities.zoom.step });
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
  }, [onClose]);

  useEffect(() => {
    if (open && !capturedImage) {
      startCamera();
    } else if (!open) {
      stopStream();
    }
  }, [open, capturedImage, startCamera, stopStream]);

  useEffect(() => {
    if (stream && hasZoom) {
      const videoTrack = stream.getVideoTracks()[0];
      // @ts-ignore
      if (videoTrack.getCapabilities().zoom) {
        try {
          // @ts-ignore
          videoTrack.applyConstraints({ advanced: [{ zoom: zoomLevel }] });
        } catch (error) {
          console.error("Error applying zoom:", error);
        }
      }
    }
  }, [zoomLevel, stream, hasZoom]);

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
    setZoomLevel(1); // Reset zoom on retake
  };

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

  const handleClose = () => {
    setCapturedImage(null);
    stopStream();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black w-screen h-screen flex flex-col">
      {/* Botão fechar */}
      <div className="absolute top-4 left-4 z-20">
        <Button variant="ghost" size="icon" onClick={handleClose}>
          <X className="h-6 w-6 text-white" />
        </Button>
      </div>
      {/* Flash */}
      {hasFlash && !capturedImage && (
        <div className="absolute top-4 right-4 z-20">
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
        </div>
      )}
      {/* Visualização da câmera ou imagem capturada */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center">
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
      <div className="absolute bottom-0 left-0 w-full flex flex-col items-center gap-4 pb-8 z-20">
        {hasZoom && !capturedImage && (
          <div className="w-4/5 max-w-xs p-2 bg-black/30 rounded-lg">
            <Slider
              value={[zoomLevel]}
              min={zoomRange.min}
              max={zoomRange.max}
              step={zoomRange.step}
              onValueChange={(value) => setZoomLevel(value[0])}
            />
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
            <Button onClick={handleCapture} disabled={!stream} className="w-20 h-20 rounded-full">
              <Camera className="h-8 w-8" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};