import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { showError } from "@/utils/toast";

const Processing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { imageFile, imagePreview, procedureId } = location.state || {};

  useEffect(() => {
    if (!imageFile || !procedureId) {
      showError("Dados da simulação ausentes. Tente novamente.");
      navigate("/upload");
      return;
    }

    const processImage = async () => {
      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("procedureId", procedureId);

      try {
        const response = await axios.post(
          import.meta.env.VITE_N8N_WEBHOOK_URL,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );

        // Supondo que o n8n retorne um JSON com a URL da imagem em `simulatedImageUrl`
        const simulatedImageUrl = response.data.simulatedImageUrl;

        if (simulatedImageUrl) {
          navigate("/result", {
            state: {
              originalImage: imagePreview,
              simulatedImage: simulatedImageUrl,
            },
          });
        } else {
          throw new Error("URL da imagem simulada não encontrada na resposta.");
        }
      } catch (error) {
        console.error("Erro ao processar a imagem:", error);
        showError("Falha ao gerar a simulação. Tente novamente.");
        navigate("/select-procedure", { state: { imageFile, imagePreview } });
      }
    };

    processImage();
  }, [imageFile, procedureId, imagePreview, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-6" />
        <h1 className="text-3xl font-bold mb-2 text-foreground">
          Gerando simulação…
        </h1>
        <p className="text-lg text-muted-foreground">
          Isso pode levar até 30 segundos
        </p>
      </div>
    </div>
  );
};

export default Processing;