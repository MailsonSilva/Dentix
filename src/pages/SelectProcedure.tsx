import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface Procedure {
  id: string;
  nome: string;
  descricao: string;
  webhook_valor: string | null;
}

const SelectProcedure = () => {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [selectedProcedure, setSelectedProcedure] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const { imageFile, imagePreview, vitaColor } = location.state || {};

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: proceduresData, error: proceduresError } = await supabase
          .from("procedimentos")
          .select("*")
          .eq("ativo", true);
        if (proceduresError) throw proceduresError;
        setProcedures(proceduresData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os procedimentos. Tente novamente.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const handleNext = () => {
    if (!selectedProcedure) {
      toast({ title: "Atenção", description: "Por favor, selecione um procedimento." });
      return;
    }

    if (!imageFile || !imagePreview) {
      toast({
        title: "Erro de Navegação",
        description: "A imagem do paciente não foi encontrada. Por favor, comece o processo novamente.",
        variant: "destructive",
      });
      navigate("/upload");
      return;
    }

    const procedure = procedures.find((p) => p.id === selectedProcedure);
    if (!procedure) {
      toast({
        title: "Erro",
        description: "O procedimento selecionado é inválido.",
        variant: "destructive",
      });
      return;
    }

    const procedureValueForWebhook = procedure.webhook_valor || procedure.nome;

    navigate("/processing", {
      state: {
        imageFile,
        imagePreview,
        procedureId: procedure.id,
        procedureName: procedureValueForWebhook,
        vitaColor: vitaColor,
      },
    });
  };

  return (
    <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-screen">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Selecione o Procedimento</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {procedures.map((proc) => (
                <div
                  key={proc.id}
                  onClick={() => setSelectedProcedure(proc.id)}
                  className={cn(
                    "p-4 border rounded-lg cursor-pointer transition-all text-center",
                    selectedProcedure === proc.id
                      ? "border-primary ring-2 ring-primary bg-primary/10"
                      : "hover:border-primary/50 hover:bg-muted"
                  )}
                >
                  <h4 className="font-semibold text-lg">{proc.nome}</h4>
                  {proc.descricao && (
                    <p className="text-sm text-muted-foreground mt-1">{proc.descricao}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 flex justify-center">
            <Button onClick={handleNext} disabled={!selectedProcedure || loading}>
              Avançar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SelectProcedure;