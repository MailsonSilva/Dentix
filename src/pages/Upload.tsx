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
    <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-screen">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Simulador de Sorriso</h1>
          <p className="text-muted-foreground">Faça o upload de uma foto para iniciar a simulação.</p>
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}
            ${imagePreview ? 'border-green-500 bg-green-50' : ''}`}
        >
          <input {...getInputProps()} />
          {imagePreview ? (
            <div className="relative">
              <img src={imagePreview} alt="Preview" className="mx-auto max-h-64 rounded-lg" />
              <div className="absolute top-2 right-2 bg-white rounded-full p-1">
                <CheckCircle className="text-green-500" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <UploadCloud className="h-12 w-12 text-gray-400 mb-4" />
              <p className="font-semibold">Arraste e solte a imagem aqui, ou clique para selecionar</p>
              <p className="text-sm text-muted-foreground">PNG, JPG, JPEG</p>
            </div>
          )}
        </div>

        <div className="mt-8">
          <div className="flex justify-center">
            <div className="bg-white p-6 rounded-xl border shadow-sm w-full">
              {loadingColors ? (
                <div className="flex justify-center items-center h-24">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : vitaColors.length > 0 ? (
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-4 justify-center">
                  {vitaColors.map((color) => (
                    <button
                      key={color.id}
                      title={color.nome}
                      onClick={() => setSelectedVitaColor(color.nome)}
                      className={`w-11 h-11 rounded-full border-2 transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                        ${selectedVitaColor === color.nome ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-200'}`}
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
        </div>

        <div className="mt-8 text-center">
          <Button onClick={handleNext} disabled={!imageFile} size="lg">
            Avançar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Upload;