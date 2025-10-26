import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, Smile, Sun, Sparkles, Paintbrush, Layers } from 'lucide-react';
import { showError } from '@/utils/toast';

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

const dataURLtoFile = (dataurl: string, filename: string): File => {
  const arr = dataurl.split(',');
  if (arr.length < 2) {
    throw new Error("Invalid data URL format");
  }
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

const SelectProcedure = () => {
  const [procedures, setProcedures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProcedure, setSelectedProcedure] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { vitaColor } = location.state || {};

  useEffect(() => {
    try {
      const storedImage = sessionStorage.getItem('uploadedImage');
      const storedImageName = sessionStorage.getItem('imageName');

      if (storedImage && storedImageName) {
        setImageFile(dataURLtoFile(storedImage, storedImageName));
        setImagePreview(storedImage);
      } else {
        showError("Nenhuma imagem selecionada. Por favor, comece novamente.");
        navigate('/upload');
      }
    } catch (error) {
      console.error("Error processing image from session storage:", error);
      showError("Erro ao carregar a imagem. Por favor, tente novamente.");
      navigate('/upload');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchProcedures = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('procedimentos')
        .select('*')
        .eq('ativo', true);

      if (error) {
        console.error('Error fetching procedures:', error);
        showError("Não foi possível carregar os procedimentos.");
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
      const procedure = procedures.find(p => p.id === selectedProcedure);
      if (procedure) {
        navigate('/processing', {
          state: {
            imageFile,
            imagePreview,
            procedureId: procedure.id,
            procedureName: procedure.webhook_valor || procedure.nome,
            vitaColor,
          },
        });
      } else {
        showError("Procedimento selecionado não encontrado.");
      }
    } else {
      showError("Por favor, selecione um procedimento.");
    }
  };

  return (
    <div className="container mx-auto p-4 flex flex-col items-center">
      <div className="text-center my-8">
        <h1 className="text-3xl font-bold">Selecione o Procedimento</h1>
        <p className="text-muted-foreground">Escolha um dos procedimentos abaixo para iniciar a simulação.</p>
      </div>

      <div className="px-4">
        {loading ? (
          <div className="flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {procedures.map((proc) => (
              <div
                key={proc.id}
                className={`p-4 sm:p-6 border rounded-xl cursor-pointer text-center transition-all duration-300 flex flex-col items-center justify-center aspect-square w-32 sm:w-40
                  ${selectedProcedure === proc.id 
                    ? 'border-blue-500 bg-blue-50 shadow-lg scale-105' 
                    : 'border-gray-200 bg-white hover:shadow-md hover:border-blue-300'
                  }`}
                onClick={() => handleProcedureSelect(proc.id)}
              >
                {getProcedureIcon(proc.nome)}
                <span className="font-semibold text-gray-700 text-sm sm:text-base">{proc.nome}</span>
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