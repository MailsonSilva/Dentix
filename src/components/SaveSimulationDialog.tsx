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

      // 2. Inserir o registro no banco de dados
      // NOTE: Não enviamos explicitamente o campo `status` para evitar erros de enum.
      // O banco usará o valor padrão definido na tabela (ex: 'pendente').
      const { error } = await supabase.from("simulacoes").insert({
        usuario_id: user.id,
        procedimento_id: procedureId,
        nome_paciente: patientName,
        imagem_original_url: originalImageUrl,
        imagem_simulada_url: simulatedImageUrl,
        // status: omitted on purpose to let DB default apply
      });

      if (error) throw error;

      showSuccess("Simulação salva com sucesso!");
      onOpenChange(false);
      setPatientName("");
    } catch (error) {
      console.error("Error saving simulation:", error);
      showError("Ocorreu um erro ao salvar a simulação.");
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