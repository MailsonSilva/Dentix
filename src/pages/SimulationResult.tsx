import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SaveSimulationDialog } from "@/components/SaveSimulationDialog";
import ImageCarouselDialog from "@/components/ImageCarouselDialog";
import { Loader2, RefreshCw } from "lucide-react";
import axios from "axios";
import { showError } from "@/utils/toast";

const SimulationResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { originalImage, simulatedImage, procedureId, procedureName, vitaColor } = location.state || {};

  const [currentSimulatedImage, setCurrentSimulatedImage] = useState(simulatedImage);
  const [simulatedImageError, setSimulatedImageError] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isRedoing, setIsRedoing] = useState(false);

  // State for the gallery
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<{ src: string; alt: string }[]>([]);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);

  const placeholderSimulated = "/placeholder.svg";
  const placeholderOriginal = "/placeholder.svg";

  const handleRedo = async () => {
    if (!originalImage || !procedureName) {
      showError("Dados insuficientes para refazer a simulação.");
      return;
    }

    setIsRedoing(true);
    setSimulatedImageError(false);

    try {
      const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
      if (!webhookUrl) {
        throw new Error("VITE_N8N_WEBHOOK_URL não encontrada.");
      }

      const urlWithParams = new URL(webhookUrl);
      urlWithParams.searchParams.append("procedure", procedureName);

      const payload: { imageData: string; vitacor?: string } = {
        imageData: originalImage,
      };
      if (vitaColor) {
        payload.vitacor = vitaColor;
      }

      const response = await axios.post(
        urlWithParams.toString(),
        payload,
        {
          headers: { "Content-Type": "application/json" },
          responseType: 'blob',
          timeout: 60000,
        },
      );

      const responseBlob = response.data;
      if (!(responseBlob instanceof Blob) || responseBlob.size === 0) {
        throw new Error("A resposta do servidor não continha uma imagem válida.");
      }

      const newSimulatedImageUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(responseBlob);
      });

      if (newSimulatedImageUrl && newSimulatedImageUrl.length > 100) {
        setCurrentSimulatedImage(newSimulatedImageUrl);
      } else {
        throw new Error("A resposta do servidor não pôde ser convertida para uma imagem válida.");
      }
    } catch (error) {
      console.error("Erro ao refazer simulação:", error);
      showError("Falha ao refazer a simulação. Tente novamente.");
      setSimulatedImageError(true);
    } finally {
      setIsRedoing(false);
    }
  };

  // Function to open the gallery
  const openGallery = (initial: "original" | "simulated") => {
    const images: { src: string; alt: string }[] = [];
    if (originalImage) {
      images.push({ src: originalImage, alt: "Antes" });
    }
    if (currentSimulatedImage) {
      images.push({ src: currentSimulatedImage, alt: "Depois" });
    }
    if (images.length === 0) return;

    const startIndex = initial === "simulated" ? Math.min(1, images.length - 1) : 0;
    setGalleryImages(images);
    setGalleryStartIndex(startIndex);
    setIsGalleryOpen(true);
  };

  return (
    <>
      <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-4xl">
          <CardHeader className="text-center space-y-4">
            <img src="/logo.png" alt="Dentix Logo" className="w-40 mx-auto" />
            <CardTitle className="text-2xl">
              Resultado da Simulação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Situação Atual</h3>
                <div className="overflow-auto rounded-lg border flex justify-center items-center bg-white">
                  <img
                    src={originalImage || placeholderOriginal}
                    alt="Situação Atual"
                    className="w-auto max-w-full h-auto cursor-pointer hover:opacity-90 transition"
                    style={{ maxHeight: "400px" }}
                    onClick={() => openGallery("original")}
                  />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Resultado Potencial</h3>
                <div className="relative overflow-auto rounded-lg border flex justify-center items-center bg-white">
                  {isRedoing && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 rounded-lg">
                      <Loader2 className="h-12 w-12 animate-spin text-white" />
                    </div>
                  )}
                  <img
                    src={simulatedImageError ? placeholderSimulated : currentSimulatedImage || placeholderSimulated}
                    alt="Resultado Potencial"
                    className="w-auto max-w-full h-auto cursor-pointer hover:opacity-90 transition"
                    style={{ maxHeight: "400px" }}
                    onError={() => setSimulatedImageError(true)}
                    onClick={() => openGallery("simulated")}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => navigate("/upload")}>Nova Simulação</Button>
              <Button variant="outline" onClick={handleRedo} disabled={isRedoing}>
                {isRedoing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refazer Simulação
              </Button>
              <Button variant="secondary" onClick={() => setIsSaveDialogOpen(true)} disabled={!originalImage || !currentSimulatedImage || !procedureId}>
                Salvar Simulação
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/select-procedure")}
              >
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <SaveSimulationDialog
        open={isSaveDialogOpen}
        onOpenChange={setIsSaveDialogOpen}
        originalImage={originalImage}
        simulatedImage={currentSimulatedImage}
        procedureId={procedureId}
      />
      <ImageCarouselDialog
        open={isGalleryOpen}
        onOpenChange={setIsGalleryOpen}
        images={galleryImages}
        startIndex={galleryStartIndex}
      />
    </>
  );
};

export default SimulationResult;