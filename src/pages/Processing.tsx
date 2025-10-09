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
        // Converte a imagem para base64 antes de enviar
        const base64Image = await toBase64(imageFile);

        const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
        if (!webhookUrl) {
          throw new Error(
            "VITE_N8N_WEBHOOK_URL não encontrada. Se estiver rodando localmente, crie um arquivo .env e adicione a variável. Se estiver na Vercel, verifique as Environment Variables no painel do projeto.",
          );
        }

        const urlWithParams = new URL(webhookUrl);
        urlWithParams.searchParams.append("procedure", procedureName);

        // Envia um JSON com a imagem e a cor
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
            headers: {
              "Content-Type": "application/json",
            },
            responseType: 'blob', // Important: expect a binary response
            timeout: 60000, // Aumenta o tempo limite para 60 segundos
          },
        );

        console.log("--- RESPOSTA RECEBIDA DO N8N ---");
        console.log(response);
        console.log("------------------------------------");

        const responseBlob = response.data;

        if (!(responseBlob instanceof Blob) || responseBlob.size === 0) {
          throw new Error("A resposta do servidor não continha uma imagem válida.");
        }

        // Convert the received Blob into a Data URL to be used in <img> tags
        const simulatedImageUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(responseBlob);
        });

        if (simulatedImageUrl && simulatedImageUrl.length > 100) {
          navigate("/result", {
            state: {
              originalImage: imagePreview,
              simulatedImage: simulatedImageUrl,
              procedureId: procedureId,
            },
          });
        } else {
          console.error("A imagem convertida do blob é inválida ou vazia:", simulatedImageUrl);
          throw new Error(
            "A resposta do servidor não pôde ser convertida para uma imagem válida.",
          );
        }
      } catch (error) {
        console.error("--- ERRO AO PROCESSAR A IMAGEM ---");
        if (axios.isAxiosError(error)) {
          console.error("Mensagem de erro:", error.message);
          console.error("Status do erro:", error.response?.status);
          console.error("Dados da resposta:", error.response?.data);
          if (error.code === "ECONNABORTED") {
            console.error(
              "Dica: A requisição demorou demais e foi cancelada (timeout).",
            );
            showError(
              "A simulação demorou mais que o esperado. Tente novamente.",
            );
          } else if (error.code === "ERR_NETWORK") {
            console.error(
              "Dica: Isso pode ser um problema de CORS no seu servidor n8n ou a URL do webhook está incorreta.",
            );
            showError(
              "Falha na comunicação com o servidor. Verifique o console.",
            );
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
  }, [imageFile, procedureName, imagePreview, navigate, procedureId, vitaColor]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
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