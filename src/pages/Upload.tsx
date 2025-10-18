import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

const Upload = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [vitaColors, setVitaColors] = useState<any[]>([]);
  const [selectedVitaColor, setSelectedVitaColor] = useState<string | null>(null);
  const [loadingColors, setLoadingColors] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVitaColors = async () => {
      setLoadingColors(true);
      const { data, error } = await supabase
        .from('cores_vita')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) {
        console.error('Error fetching VITA colors:', error);
        showError("Não foi possível carregar as cores VITA.");
      } else {
        setVitaColors(data);
      }
      setLoadingColors(false);
    };

    fetchVitaColors();
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.png', '.jpg'] },
    multiple: false,
  });

  const handleNext = () => {
    if (imageFile && imagePreview) {
      navigate('/select-procedure', {
        state: {
          imageFile,
          imagePreview,
          vitaColor: selectedVitaColor,
        },
      });
    } else {
      showError("Por favor, selecione uma imagem.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-5">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">🦷 Simulador de Sorriso 🌟</h1>
        <p className="text-muted-foreground text-md md:text-lg">
          Visualize seu novo sorriso em tempo real. Faça o upload da sua foto.
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 md:p-12 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-blue-300 hover:border-blue-400 bg-blue-50/50'}
          ${imagePreview ? 'border-green-500 bg-green-50' : ''}`}
      >
        <input {...getInputProps()} />
        {imagePreview ? (
          <div className="relative">
            <img src={imagePreview} alt="Preview" className="mx-auto max-h-64 rounded-lg" />
            <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow">
              <CheckCircle className="text-green-500" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-blue-800">
            <UploadCloud className="h-12 w-12 text-blue-400 mb-4" />
            <p className="font-semibold text-lg">Arraste e solte a imagem aqui</p>
            <p className="text-sm text-muted-foreground my-2">ou</p>
            <Button variant="secondary" size="sm" className="pointer-events-none">
              Clique para Selecionar
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Formatos aceitos: PNG, JPG, JPEG
            </p>
          </div>
        )}
      </div>

      <div className="mt-8">
        <p className="font-semibold text-center mb-4">Escolha a cor base do dente (Opcional)</p>
        <div className="bg-gray-50 p-4 rounded-xl border w-full">
          {loadingColors ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : vitaColors.length > 0 ? (
            <div className="flex flex-wrap items-center justify-center gap-4 p-2">
              {vitaColors.map((color) => (
                <button
                  key={color.id}
                  title={color.nome}
                  onClick={() => setSelectedVitaColor(color.nome)}
                  className={`flex-shrink-0 w-10 h-10 rounded-full border-2 shadow-sm transition-all transform hover:scale-110 focus:outline-none 
                    ${selectedVitaColor === color.nome 
                      ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' 
                      : 'border-gray-200'
                    }`}
                  style={{ backgroundColor: color.hexadecimal }}
                >
                </button>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center">Nenhuma cor disponível.</p>
          )}
        </div>
      </div>

      <div className="mt-8 text-center">
        <Button 
          onClick={handleNext} 
          disabled={!imageFile} 
          size="lg"
          className="w-full sm:w-auto"
        >
          Avançar
        </Button>
      </div>
    </div>
  );
};

export default Upload;