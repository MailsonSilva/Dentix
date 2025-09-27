import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { uploadBase64Image } from "@/utils/storage";

interface SaveSimulationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalImage: string;
  simulatedImage: string;
  procedureId: string;
}

export const SaveSimulationDialog: React.FC<SaveSimulationDialogProps> = ({
  open,
  onOpenChange,
  originalImage,
  simulatedImage,
  procedureId,
}) => {
  const { user } = useAuth();
  const [patientName, setPatientName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!patientName.trim()) {
      showError("Por favor, insira o nome do paciente.");
      return;
    }
    if (!user || !procedureId || !originalImage || !simulatedImage) {
      showError("Faltam dados para salvar a simulação.");
      return;
    }

    setLoading(true);
    try {
      // 1. Upload das imagens para o armazenamento
      const originalImageUrl = await uploadBase64Image(originalImage, "simulacoes");
      const simulatedImageUrl = await uploadBase64Image(simulatedImage, "simulacoes");

      console.log("Uploaded images URLs:", { originalImageUrl, simulatedImageUrl });

      // 2. Inserir o registro no banco de dados
      const { data: insertData, error: insertError } = await supabase
        .from("simulacoes")
        .insert({
          usuario_id: user.id,
          procedimento_id: procedureId,
          nome_paciente: patientName,
          imagem_original_url: originalImageUrl,
          imagem_simulada_url: simulatedImageUrl,
          // status omitted to rely on DB default
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error inserting simulation record:", insertError);
        // Show backend message if provided
        showError(
          insertError.message ||
            "Ocorreu um erro ao salvar a simulação no banco de dados.",
        );
        setLoading(false);
        return;
      }

      console.log("Inserted simulation record:", insertData);

      showSuccess("Simulação salva com sucesso!");
      onOpenChange(false);
      setPatientName("");
    } catch (error: any) {
      console.error("Error saving simulation (full):", error);
      // Prefer friendly message, but include more details in console for debugging
      showError(error?.message ?? "Ocorreu um erro ao salvar a simulação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Salvar Simulação</DialogTitle>
          <DialogDescription>
            Insira o nome do paciente para salvar esta simulação.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="patient-name" className="text-right">
              Paciente
            </Label>
            <Input
              id="patient-name"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="col-span-3"
              placeholder="Nome do Paciente"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-[#0e4dab] hover:bg-[#0b3a87] text-white"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};