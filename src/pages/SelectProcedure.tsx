import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface Procedure {
  id: string;
  nome: string;
  descricao: string;
}

const SelectProcedure = () => {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [selectedProcedure, setSelectedProcedure] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

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
          description: "Não foi possível carregar os dados. Tente novamente.",
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
    navigate("/upload-image", {
      state: { procedureId: selectedProcedure },
    });
  };

  return (
    <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-screen">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Nova Simulação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            {/* Procedure Selection */}
            <div className="w-full">
              <h3 className="text-lg font-semibold text-center mb-4">Procedimento</h3>
              {loading ? (
                <p className="text-center">Carregando...</p>
              ) : (
                <RadioGroup onValueChange={setSelectedProcedure} value={selectedProcedure || ""}>
                  {procedures.map((proc) => (
                    <div key={proc.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={proc.id} id={proc.id} />
                      <Label htmlFor={proc.id}>{proc.nome}</Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>
          </div>

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