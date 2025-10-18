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

    const processImage = async () => {
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
            timeout: 60000,
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
              originalImage: imagePreview,
              simulatedImage: simulatedImageUrl,
              procedureId: procedureId,
            },
          });
        } else {
          throw new Error("A resposta do servidor não pôde ser convertida para uma imagem válida.");
        }
      } catch (error) {
        console.error("--- ERRO AO PROCESSAR A IMAGEM ---");
        if (axios.isAxiosError(error) && error.response) {
          console.error("Mensagem de erro:", error.message);
          console.error("Status do erro:", error.response.status);

          // Try to read the blob response as text for better debugging
          if (error.response.data instanceof Blob) {
            const errorText = await error.response.data.text();
            console.error("Dados da resposta (Texto):", errorText);
            try {
              // Try to parse as JSON to see if it's a structured error
              const errorJson = JSON.parse(errorText);
              console.error("Dados da resposta (JSON):", errorJson);
              showError(errorJson.message || "Falha na simulação. Verifique o console.");
            } catch (e) {
              // If not JSON, it might be plain text or HTML from the server
              showError("Falha na simulação. Verifique o console para detalhes.");
            }
          } else {
            console.error("Dados da resposta:", error.response.data);
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