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
      formData.append("data", imageFile);

      try {
        const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
        if (!webhookUrl || webhookUrl === "COLE_A_URL_DO_SEU_WEBHOOK_DO_N8N_AQUI") {
            throw new Error("A URL do webhook do n8n não está configurada no arquivo .env.");
        }

        const urlWithParams = new URL(webhookUrl);
        urlWithParams.searchParams.append("procedureId", procedureId);

        const response = await axios.post(
          urlWithParams.toString(),
          formData,
          {
            headers: {
              // O axios define o Content-Type como multipart/form-data automaticamente
            },
            // Aumenta o tempo limite para 60 segundos (60000 ms)
            timeout: 60000,
          },
        );

        const simulatedImageUrl = response.data.simulatedImageUrl;

        if (simulatedImageUrl) {
          navigate("/result", {
            state: {
              originalImage: imagePreview,
              simulatedImage: simulatedImageUrl,
            },
          });
        } else {
          throw new Error("URL da imagem simulada não encontrada na resposta do n8n.");
        }
      } catch (error) {
        console.error("--- ERRO AO PROCESSAR A IMAGEM ---");
        if (axios.isAxiosError(error)) {
          console.error("Mensagem de erro:", error.message);
          console.error("Status do erro:", error.response?.status);
          console.error("Dados da resposta:", error.response?.data);
          if (error.code === 'ECONNABORTED') {
            console.error("Dica: A requisição demorou demais e foi cancelada (timeout).");
            showError("A simulação demorou mais que o esperado. Tente novamente.");
          } else if (error.code === "ERR_NETWORK") {
             console.error("Dica: Isso pode ser um problema de CORS no seu servidor n8n ou a URL do webhook está incorreta.");
             showError("Falha na comunicação com o servidor. Verifique o console.");
          } else {
            showError("Falha na simulação. Verifique o console para detalhes.");
          }
        } else {
            console.error("Erro não relacionado ao Axios:", error);
            showError("Ocorreu um erro inesperado. Verifique o console.");
        }
        console.error("------------------------------------");
        
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