import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const procedures = [
  {
    id: "whitening",
    name: "Clareamento Dental",
    webhookValue: "clareamentoDental",
  },
  {
    id: "restoration",
    name: "Restauração estética",
    webhookValue: "restauracaoEstetica",
  },
  {
    id: "alignment",
    name: "Alinhamento Dental",
    webhookValue: "alinhamentoDental",
  },
  {
    id: "implants",
    name: "Implante Dentário", // Alterado aqui
    webhookValue: "implantesDentarios",
  },
];

const SelectProcedure = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { imageFile, imagePreview } = location.state || {};

  const [selectedProcedure, setSelectedProcedure] = useState<string | null>(
    null,
  );

  const handleGenerate = () => {
    if (selectedProcedure && imageFile && imagePreview) {
      const procedure = procedures.find((p) => p.id === selectedProcedure);
      if (procedure) {
        navigate("/processing", {
          state: {
            imageFile,
            imagePreview,
            procedureName: procedure.webhookValue,
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
            {procedures.map((proc) => (
              <button
                key={proc.id}
                onClick={() => setSelectedProcedure(proc.id)}
                className={cn(
                  "p-4 border rounded-lg text-center transition-colors",
                  selectedProcedure === proc.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "hover:bg-muted",
                )}
              >
                {proc.name}
              </button>
            ))}
          </div>
          <Button
            className="w-full"
            disabled={!selectedProcedure}
            onClick={handleGenerate}
          >
            Gerar Simulação
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SelectProcedure;