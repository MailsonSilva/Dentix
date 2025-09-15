import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud, Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Upload = () => {
  const navigate = useNavigate();
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Envie a foto do paciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Pré-visualização"
                className="rounded-lg max-h-64 w-auto"
              />
            ) : (
              <div className="w-full h-64 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground">
                <ImageIcon className="w-16 h-16 mb-2" />
                <span>Pré-visualização da foto</span>
              </div>
            )}
            <div className="flex gap-4 w-full">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => document.getElementById("fileInput")?.click()}
              >
                <UploadCloud className="mr-2 h-4 w-4" />
                Escolher da galeria
              </Button>
              <input
                type="file"
                id="fileInput"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
            <Button
              className="w-full"
              disabled={!imagePreview}
              onClick={() => navigate("/select-procedure")}
            >
              Avançar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Upload;