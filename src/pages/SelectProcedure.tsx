import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { showError } from "@/utils/toast";
import { ArrowLeft, Check } from "lucide-react";

interface Procedure {
  id: string;
  nome: string;
  webhook_valor: string;
}

interface VitaColor {
  nome: string;
  hexadecimal: string;
}

const SelectProcedure = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { imageFile, imagePreview } = location.state || {};

  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [vitaColors, setVitaColors] = useState<VitaColor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProcedure, setSelectedProcedure] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [proceduresResult, colorsResult] = await Promise.all([
          supabase
            .from("procedimentos")
            .select("id, nome, webhook_valor")
            .eq("ativo", true),
          supabase
            .from("cores_vita")
            .select("nome, hexadecimal")
            .eq("ativo", true)
            .order("nome"),
        ]);

        if (proceduresResult.error) throw proceduresResult.error;
        if (colorsResult.error) throw colorsResult.error;

        setProcedures(proceduresResult.data as Procedure[]);
        setVitaColors(colorsResult.data as VitaColor[]);
      } catch (error) {
        console.error("Error fetching data:", error);
        showError("Não foi possível carregar os dados necessários.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleGenerate = () => {
    if (selectedProcedure && selectedColor && imageFile && imagePreview) {
      const procedure = procedures.find((p) => p.id === selectedProcedure);
      if (procedure) {
        navigate("/processing", {
          state: {
            imageFile,
            imagePreview,
            procedureName: procedure.webhook_valor,
            procedureId: procedure.id,
            vitaColor: selectedColor,
          },
        });
      }
    }
  };

  return (
    <div className="p-4 relative">
      <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="absolute top-4 left-4 z-10 md:hidden">
        <ArrowLeft className="h-6 w-6" />
      </Button>
      <div className="flex items-center justify-center">
        <Card className="w-full max-w-md mt-12 md:mt-0">
          <CardHeader className="text-center space-y-4">
            <img src="/logo.png" alt="Dentix Logo" className="w-40 mx-auto" />
            <CardTitle className="text-2xl">
              Selecione os detalhes
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-8">
            {/* Procedure Selection */}
            <div className="w-full">
              <h3 className="text-lg font-semibold text-center mb-4">Procedimento</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
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
            </div>

            {/* Color Selection */}
            <div className="w-full">
              <h3 className="text-lg font-semibold text-center mb-4">Cor (VITA)</h3>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {loading ? (
                  Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)
                ) : (
                  vitaColors.map((color) => (
                    <button
                      key={color.nome}
                      title={color.nome}
                      onClick={() => setSelectedColor(color.hexadecimal)}
                      className={cn(
                        "h-12 w-full rounded-md border-2 transition-all flex items-center justify-center relative",
                        selectedColor === color.hexadecimal ? "border-primary ring-2 ring-primary ring-offset-2" : "border-muted"
                      )}
                      style={{ backgroundColor: color.hexadecimal }}
                      aria-label={color.nome}
                    >
                      {selectedColor === color.hexadecimal && (
                        <Check className="h-6 w-6 text-white mix-blend-difference" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4 w-full">
              <Button
                className="w-full"
                disabled={!selectedProcedure || !selectedColor || loading}
                onClick={handleGenerate}
              >
                Gerar Simulação
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SelectProcedure;