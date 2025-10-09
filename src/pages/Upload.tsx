import { useState, useRef, DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Camera, GalleryHorizontal, UploadCloud, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";

const Upload = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSelectionOpen, setSelectionOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { vitaColors, loadingVitaColors } = useAuth();
  const [selectedVitaColor, setSelectedVitaColor] = useState<string | null>(null);

  const processFile = (file: File | null | undefined) => {
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setSelectedVitaColor(null);
    } else if (file) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione um arquivo de imagem válido.",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    processFile(event.target.files?.[0]);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    processFile(event.dataTransfer.files?.[0]);
  };

  const handleDragEvents = (event: DragEvent<HTMLDivElement>, dragging: boolean) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(dragging);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setSelectedVitaColor(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleNext = () => {
    if (!imageFile || !imagePreview) {
      toast({
        title: "Atenção",
        description: "Por favor, selecione uma imagem para continuar.",
      });
      return;
    }
    if (!selectedVitaColor) {
      toast({
        title: "Atenção",
        description: "Por favor, selecione uma cor Vita para continuar.",
      });
      return;
    }
    navigate("/select-procedure", { state: { imageFile, imagePreview, vitaColor: selectedVitaColor } });
  };

  return (
    <>
      <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold tracking-tight">
              Nova Simulação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-6">
              {imagePreview ? (
                <div className="relative w-full aspect-square">
                  <img
                    src={imagePreview}
                    alt="Pré-visualização"
                    className="object-contain h-full w-full rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-md"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => handleDragEvents(e, true)}
                  onDragEnter={(e) => handleDragEvents(e, true)}
                  onDragLeave={(e) => handleDragEvents(e, false)}
                  onClick={() => setSelectionOpen(true)}
                  className={cn(
                    "relative w-full aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center text-muted-foreground p-4 transition-colors duration-200 ease-in-out cursor-pointer",
                    isDragging ? "border-primary bg-primary/10" : "bg-muted/25 hover:bg-muted/50"
                  )}
                >
                  <div className="space-y-2">
                    <UploadCloud className="mx-auto h-12 w-12" />
                    <p className="font-semibold">Arraste e solte a imagem aqui</p>
                    <p className="text-xs">ou clique para selecionar</p>
                  </div>
                </div>
              )}

              {imagePreview && (
                <div className="w-full space-y-3">
                  <h3 className="text-center font-semibold text-muted-foreground">Selecione a Cor Vita</h3>
                  {loadingVitaColors ? (
                    <div className="flex justify-center items-center h-24">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : vitaColors.length > 0 ? (
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                      {vitaColors.map((color) => (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => setSelectedVitaColor(color.nome)}
                          className={cn(
                            "relative w-full h-20 rounded-lg overflow-hidden border transition-all focus:outline-none",
                            selectedVitaColor === color.nome
                              ? "ring-2 ring-primary ring-offset-2"
                              : "border-gray-200 hover:border-gray-400"
                          )}
                          style={{ backgroundColor: color.hexadecimal }}
                        >
                          <div className="absolute bottom-1 left-1 right-1 h-8 bg-white rounded-md flex items-center justify-center shadow-sm">
                            <span className="text-sm font-semibold text-gray-800">{color.nome}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                     <p className="text-center text-sm text-muted-foreground">Nenhuma cor Vita encontrada.</p>
                  )}
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
              <input
                type="file"
                ref={cameraInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
                capture="environment"
              />
            </div>

            <div className="mt-8 flex justify-center">
              <Button onClick={handleNext} disabled={!imagePreview || !selectedVitaColor} size="lg" className="w-full sm:w-auto">
                Avançar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isSelectionOpen} onOpenChange={setSelectionOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Selecionar Imagem</DialogTitle>
            <DialogDescription>
              Escolha uma imagem da sua galeria ou tire uma nova foto para a simulação.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button
              onClick={() => {
                fileInputRef.current?.click();
                setSelectionOpen(false);
              }}
            >
              <GalleryHorizontal className="mr-2 h-4 w-4" />
              Escolher da Galeria
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                cameraInputRef.current?.click();
                setSelectionOpen(false);
              }}
            >
              <Camera className="mr-2 h-4 w-4" />
              Tirar Foto
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Upload;