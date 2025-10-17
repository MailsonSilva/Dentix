import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase';
import { Button } from '@/components/ui/button';
import { Loader2, Smile, Sun, Sparkles, Paintbrush, Layers } from 'lucide-react';
import { useSimulation } from '@/context/SimulationContext';

const getProcedureIcon = (procedureName: string) => {
  const name = procedureName.toLowerCase();
  if (name.includes('clareamento')) {
    return <Sun size={48} className="mx-auto mb-4 text-blue-500" />;
  }
  if (name.includes('lentes')) {
    return <Sparkles size={48} className="mx-auto mb-4 text-blue-500" />;
  }
  if (name.includes('facetas')) {
    return <Paintbrush size={48} className="mx-auto mb-4 text-blue-500" />;
  }
  if (name.includes('implante')) {
    return <Layers size={48} className="mx-auto mb-4 text-blue-500" />;
  }
  return <Smile size={48} className="mx-auto mb-4 text-blue-500" />;
};


const SelectProcedure = () => {
  const [procedures, setProcedures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedProcedure, setSelectedProcedure } = useSimulation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProcedures = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('procedimentos')
        .select('*')
        .eq('ativo', true);

      if (error) {
        console.error('Error fetching procedures:', error);
      } else {
        setProcedures(data);
      }
      setLoading(false);
    };

    fetchProcedures();
  }, []);

  const handleProcedureSelect = (procedureId: string) => {
    setSelectedProcedure(procedureId);
  };

  const handleNext = () => {
    if (selectedProcedure) {
      navigate('/patient-name');
    }
  };

  return (
    <div className="container mx-auto p-4 flex flex-col h-screen">
      <div className="text-center my-8">
        <h1 className="text-3xl font-bold">Selecione o Procedimento</h1>
        <p className="text-muted-foreground">Escolha um dos procedimentos abaixo para iniciar a simulação.</p>
      </div>

      <div className="flex-grow overflow-y-auto px-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {procedures.map((proc) => (
              <div
                key={proc.id}
                className={`p-6 border rounded-xl cursor-pointer text-center transition-all duration-300 flex flex-col items-center justify-center aspect-square
                  ${selectedProcedure === proc.id 
                    ? 'border-blue-500 bg-blue-50 shadow-lg scale-105' 
                    : 'border-gray-200 bg-white hover:shadow-md hover:border-blue-300'
                  }`}
                onClick={() => handleProcedureSelect(proc.id)}
              >
                {getProcedureIcon(proc.nome)}
                <span className="font-semibold text-gray-700">{proc.nome}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 text-center">
        <Button onClick={handleNext} disabled={!selectedProcedure} size="lg">
          Avançar
        </Button>
      </div>
    </div>
  );
};

export default SelectProcedure;