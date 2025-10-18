import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SaveSimulationDialog } from "@/components/SaveSimulationDialog";
import ImageCarouselDialog from "@/components/ImageCarouselDialog";

const SimulationResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { originalImage, simulatedImage, procedureId } = location.state || {};
  const [simulatedImageError, setSimulatedImageError] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

  // State for the gallery
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<{ src: string; alt: string }[]>([]);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);

  const placeholderSimulated = "/placeholder.svg";
  const placeholderOriginal = "/placeholder.svg";

  // Function to open the gallery
  const openGallery = (initial: "original" | "simulated") => {
    const images: { src: string; alt: string }[] = [];
    if (originalImage) {
      images.push({ src: originalImage, alt: "Antes" });
    }
    if (simulatedImage) {
      images.push({ src: simulatedImage, alt: "Depois" });
    }
    if (images.length === 0) return;

    const startIndex = initial === "simulated" ? Math.min(1, images.length - 1) : 0;
    setGalleryImages(images);
    setGalleryStartIndex(startIndex);
    setIsGalleryOpen(true);
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
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
                <div className="overflow-auto rounded-lg border flex justify-center items-center bg-white">
                  <img
                    src={simulatedImageError ? placeholderSimulated : simulatedImage || placeholderSimulated}
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
              <Button variant="secondary" onClick={() => setIsSaveDialogOpen(true)} disabled={!originalImage || !simulatedImage || !procedureId}>
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
        simulatedImage={simulatedImage}
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