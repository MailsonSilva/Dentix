import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Check, Zap, ZapOff, X } from "lucide-react";
import { showError } from "@/utils/toast";
import { FramingGuide } from "./FramingGuide";

interface CameraFullScreenProps {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

function isWideCamera(label: string) {
  // Heurística para identificar a lente wide
  const l = label.toLowerCase();
  return (
    (l.includes("back") ||
      l.includes("traseira") ||
      l.includes("rear") ||
      l.includes("environment")) &&
    !l.includes("ultrawide") &&
    !l.includes("ultra-wide") &&
    !l.includes("tele") &&
    !l.includes("macro") &&
    !l.includes("depth")
  );
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

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        // 1. Solicita permissão genérica primeiro
        await navigator.mediaDevices.getUserMedia({ video: true });

        // 2. Agora consegue listar com labels reais
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === "videoinput");
        console.log("📸 Câmeras detectadas:", videoDevices);

        // 3. Seleciona a wide se possível
        let selectedDevice = videoDevices.find((d) => isWideCamera(d.label));

        if (!selectedDevice) {
          selectedDevice = videoDevices.find((d) =>
            d.label.toLowerCase().includes("back") ||
            d.label.toLowerCase().includes("traseira") ||
            d.label.toLowerCase().includes("rear") ||
            d.label.toLowerCase().includes("environment")
          );
        }

        if (!selectedDevice && videoDevices.length > 0) {
          selectedDevice = videoDevices[0];
        }

        if (!selectedDevice) {
          showError("Não foi possível encontrar uma câmera traseira.");
          onClose();
          return;
        }

        console.log("🎯 Câmera escolhida:", selectedDevice.label);

        // 4. Abre a câmera pelo deviceId escolhido
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: selectedDevice.deviceId },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });

        currentStream = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }

        // 5. Ajusta recursos extras (zoom, flash)
        const videoTrack = mediaStream.getVideoTracks()[0];
        const capabilities = videoTrack.getCapabilities();
        setHasFlash(!!capabilities.torch);

        if ("zoom" in capabilities) {
          await videoTrack.applyConstraints({ advanced: [{ zoom: 1.0 }] });
        }
      } catch (err) {
        console.error("Error accessing camera: ", err);
        showError("Não foi possível acessar a câmera. Verifique as permissões.");
        onClose();
      }
    };

    if (open && !capturedImage) {
      startCamera();
    }

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
      setStream(null);
      setHasFlash(false);
      setIsFlashOn(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, capturedImage]);

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

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
      {/* Botões de ação */}
      <div className="absolute bottom-0 left-0 w-full flex justify-center items-center gap-4 pb-24 z-20">
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
      </div>
    </div>
  );
};
