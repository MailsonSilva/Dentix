import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud, Image as ImageIcon, Camera } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CameraCapture } from "@/components/CameraCapture";

const Upload = () => {
  const navigate = useNavigate();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      updateImageState(file);
    }
    // Limpa o valor do input para permitir selecionar o mesmo arquivo novamente
    event.target.value = "";
  };

  const handleCapture = (file: File) => {
    if (file) {
      updateImageState(file);
    }
  };

  const updateImageState = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleNext = () => {
    if (imageFile && imagePreview) {
      navigate("/select-procedure", {
        state: { imageFile, imagePreview },
      });
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <img src="/logo.png" alt="Dentix Logo" className="w-40 mx-auto" />
            <CardTitle className="text-2xl">
              Envie a foto do paciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-6">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Pré-visualização"
                  className="rounded-lg max-h-64 w-auto object-contain"
                />
              ) : (
                <div className="w-full h-64 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground">
                  <ImageIcon className="w-16 h-16 mb-2" />
                  <span>Pré-visualização da foto</span>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    document.getElementById("galleryInput")?.click()}
                >
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Escolher da galeria
                </Button>
                <input
                  type="file"
                  id="galleryInput"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsCameraOpen(true)}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Tirar Foto
                </Button>
              </div>
              <Button
                className="w-full"
                disabled={!imagePreview}
                onClick={handleNext}
              >
                Avançar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <CameraCapture
        open={isCameraOpen}
        onOpenChange={setIsCameraOpen}
        onCapture={handleCapture}
      />
    </>
  );
};

export default Upload;