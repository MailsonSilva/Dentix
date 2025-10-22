import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { showError } from "@/utils/toast";

const Processing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { imageFile, imagePreview, procedureName, procedureId, vitaColor } = location.state || {};

  // Função para converter um arquivo para base64
  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  useEffect(() => {
    if (!imageFile || !procedureName) {
      showError("Dados da simulação ausentes. Tente novamente.");
      navigate("/upload");
      return;
    }

    const processImageWithRetries = async () => {
      const MAX_RETRIES = 3;
      const RETRY_DELAY = 2000; // 2 segundos de espera entre tentativas

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const base64Image = await toBase64(imageFile);

          const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
          if (!webhookUrl) {
            throw new Error(
              "VITE_N8N_WEBHOOK_URL não encontrada. Verifique as variáveis de ambiente.",
            );
          }

          const urlWithParams = new URL(webhookUrl);
          urlWithParams.searchParams.append("procedure", procedureName);

          const payload: { imageData: string; vitacor?: string } = {
            imageData: base64Image,
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
              timeout: 60000, // Timeout de 60 segundos
            },
          );

          const responseBlob = response.data;
          if (!(responseBlob instanceof Blob) || responseBlob.size === 0) {
            throw new Error("A resposta do servidor não continha uma imagem válida.");
          }

          const simulatedImageUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(responseBlob);
          });

          if (simulatedImageUrl && simulatedImageUrl.length > 100) {
            navigate("/simulation-result", {
              state: {
                originalImage: base64Image,
                simulatedImage: simulatedImageUrl,
                procedureId: procedureId,
              },
            });
            return; // Sucesso, sai da função
          } else {
            throw new Error("A resposta do servidor não pôde ser convertida para uma imagem válida.");
          }
        } catch (error) {
          console.error(`--- TENTATIVA ${attempt} DE ${MAX_RETRIES} FALHOU ---`);
          if (axios.isAxiosError(error) && error.response) {
            console.error("Mensagem de erro:", error.message);
            console.error("Status do erro:", error.response.status);
            if (error.response.data instanceof Blob) {
              const errorText = await error.response.data.text();
              console.error("Dados da resposta (Texto):", errorText);
            }
          } else {
            console.error("Erro não relacionado ao Axios:", error);
          }
          console.error("------------------------------------");

          if (attempt === MAX_RETRIES) {
            // Se for a última tentativa, mostra o erro e redireciona
            showError("A simulação falhou após várias tentativas. Por favor, tente novamente.");
            navigate("/select-procedure", { state: { imageFile, imagePreview } });
          } else {
            // Espera antes de tentar novamente
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          }
        }
      }
    };

    processImageWithRetries();
  }, [imageFile, procedureName, imagePreview, navigate, procedureId, vitaColor]);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center">
        <img src="/logo.png" alt="Dentix Logo" className="w-48 mx-auto mb-8" />
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