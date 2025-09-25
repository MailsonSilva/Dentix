import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { showError } from "@/utils/toast";
import { ArrowLeft } from "lucide-react";

interface Procedure {
  id: string;
  nome: string;
  webhook_valor: string;
}

const SelectProcedure = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { imageFile, imagePreview } = location.state || {};

  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProcedure, setSelectedProcedure] = useState<string | null>(null);

  useEffect(() => {
    const fetchProcedures = async () => {
      const { data, error } = await supabase
        .from("procedimentos")
        .select("id, nome, webhook_valor")
        .eq("ativo", true);

      if (error) {
        console.error("Error fetching procedures:", error);
        showError("Não foi possível carregar os procedimentos.");
      } else {
        setProcedures(data as Procedure[]);
      }
      setLoading(false);
    };

    fetchProcedures();
  }, []);

  const handleGenerate = () => {
    if (selectedProcedure && imageFile && imagePreview) {
      const procedure = procedures.find((p) => p.id === selectedProcedure);
      if (procedure) {
        navigate("/processing", {
          state: {
            imageFile,
            imagePreview,
            procedureName: procedure.webhook_valor,
          },
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <img src="/logo.png" alt="Dentix Logo" className="w-40 mx-auto" />
          <CardTitle className="text-2xl">
            Selecione o procedimento
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {loading ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : (
              procedures.map((proc) => (
                <button
                  key={proc.id}
                  onClick={() => setSelectedProcedure(proc.id)}
                  className={cn(
                    "p-4 border rounded-lg text-center transition-colors h-16 flex items-center justify-center",
                    selectedProcedure === proc.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "hover:bg-muted",
                  )}
                >
                  {proc.nome}
                </button>
              ))
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button
              className="w-full"
              disabled={!selectedProcedure || loading}
              onClick={handleGenerate}
            >
              Gerar Simulação
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SelectProcedure;