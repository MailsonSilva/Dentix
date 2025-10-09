import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Camera, GalleryHorizontal, Image as ImageIcon, X } from "lucide-react";

const Upload = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTakePhoto = () => {
    cameraInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleNext = () => {
    if (!imageFile || !imagePreview) {
      toast({
        title: "Atenção",
        description: "Por favor, selecione uma imagem para continuar.",
        variant: "default",
      });
      return;
    }
    navigate("/select-procedure", { state: { imageFile, imagePreview } });
  };

  return (
    <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Carregar Imagem do Paciente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-full aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground p-4">
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt="Pré-visualização"
                    className="object-contain h-full w-full rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <div className="text-center space-y-4">
                  <ImageIcon className="mx-auto h-12 w-12" />
                  <p>Selecione uma imagem para a simulação</p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button onClick={() => fileInputRef.current?.click()}>
                      <GalleryHorizontal className="mr-2 h-4 w-4" />
                      Escolher da Galeria
                    </Button>
                    <Button onClick={handleTakePhoto}>
                      <Camera className="mr-2 h-4 w-4" />
                      Tirar Foto
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <input
              id="file-upload"
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
            <Button onClick={handleNext} disabled={!imagePreview} className="w-full sm:w-auto">
              Avançar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Upload;