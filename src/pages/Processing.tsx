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
      try {
        const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
        if (!webhookUrl || webhookUrl === "COLE_A_URL_DO_SEU_WEBHOOK_DO_N8N_AQUI") {
            throw new Error("A URL do webhook do n8n não está configurada no arquivo .env.");
        }

        // Adiciona o procedureId como um parâmetro de busca na URL
        const urlWithParams = new URL(webhookUrl);
        urlWithParams.searchParams.append("procedureId", procedureId);

        const response = await axios.post(
          urlWithParams.toString(),
          imageFile, // Envia o arquivo binário diretamente no corpo
          {
            headers: {
              // Define o Content-Type com base no tipo do arquivo
              "Content-Type": imageFile.type,
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
          throw new Error("URL da imagem simulada não encontrada na resposta do n8n.");
        }
      } catch (error) {
        console.error("--- ERRO AO PROCESSAR A IMAGEM ---");
        if (axios.isAxiosError(error)) {
          console.error("Mensagem de erro:", error.message);
          console.error("Status do erro:", error.response?.status);
          console.error("Dados da resposta:", error.response?.data);
          if (error.code === "ERR_NETWORK") {
             console.error("Dica: Isso pode ser um problema de CORS no seu servidor n8n ou a URL do webhook está incorreta.");
          }
        } else {
            console.error("Erro não relacionado ao Axios:", error);
        }
        console.error("------------------------------------");

        showError("Falha na simulação. Verifique o console para detalhes.");
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