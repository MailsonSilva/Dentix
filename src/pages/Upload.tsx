import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UploadCloud, X, Image as ImageIcon, Camera, Loader2 } from 'lucide-react';
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import CameraCapture from '@/components/CameraCapture';
import { useAuth } from '@/contexts/AuthContext';
import { Label } from '@/components/ui/label';

const Upload = () => {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isCameraOpen, setCameraOpen] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedVitaColor, setSelectedVitaColor] = useState<string | undefined>(undefined);
  const { vitaColors, loadingVitaColors } = useAuth();

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    if (fileRejections.length > 0) {
      fileRejections.forEach(({ errors }) => {
        errors.forEach((err: any) => {
          if (err.code === "file-too-large") {
            toast.error("Arquivo muito grande. O tamanho máximo é 10MB.");
          } else if (err.code === "file-invalid-type") {
            toast.error("Tipo de arquivo inválido. Use JPEG, PNG, ou WEBP.");
          } else {
            toast.error(`Erro: ${err.message}`);
          }
        });
      });
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setImage(file);
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      setDialogOpen(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': [],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    noClick: true,
  });

  const handleRemoveImage = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setImage(null);
    setPreview(null);
  };

  const handleProceed = () => {
    if (image) {
      const reader = new FileReader();
      reader.readAsDataURL(image);
      reader.onloadend = () => {
        sessionStorage.setItem('uploadedImage', reader.result as string);
        sessionStorage.setItem('imageName', image.name);

        const selectedColorObject = vitaColors.find(c => c.nome === selectedVitaColor);
        const vitaColorHex = selectedColorObject ? selectedColorObject.hexadecimal : undefined;

        navigate('/select-procedure', {
          state: {
            vitaColor: vitaColorHex,
          },
        });
      };
      reader.onerror = () => {
        toast.error("Não foi possível processar a imagem. Tente novamente.");
      };
    } else {
      toast.warning("Por favor, selecione uma imagem para continuar.");
    }
  };

  const openGallery = () => {
    if (inputRef.current) {
      inputRef.current.removeAttribute('capture');
      inputRef.current.click();
    }
  };

  const openCamera = () => {
    setDialogOpen(false);
    setCameraOpen(true);
  };

  const handleCapture = (file: File) => {
    setImage(file);
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    setCameraOpen(false);
  };

  return (
    <>
      {isCameraOpen && (
        <CameraCapture
          onCapture={handleCapture}
          onClose={() => setCameraOpen(false)}
        />
      )}
      <div className="container mx-auto max-w-3xl py-8 flex flex-col items-center">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Simulador de Sorriso</h1>
          <p className="text-muted-foreground mt-2">
            Visualize seu novo sorriso em tempo real. Faça o upload da sua foto.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
          <div
            {...getRootProps()}
            className={cn(
              "w-full border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive ? "border-primary bg-primary/10" : "border-blue-300 hover:border-primary",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            )}
          >
            <input {...getInputProps({ ref: inputRef })} />
            {preview ? (
              <div className="relative group">
                <img src={preview} alt="Pré-visualização" className="mx-auto max-h-64 rounded-md" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage();
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remover imagem"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <DialogTrigger asChild>
                <div className="flex flex-col items-center text-primary">
                  <UploadCloud className="h-12 w-12 text-primary/80 mb-4" />
                  <p className="font-semibold text-lg text-gray-700">Arraste e solte a imagem aqui</p>
                  <p className="text-sm text-muted-foreground my-2">ou</p>
                  <Button type="button" className="bg-[#2dd4bf] hover:bg-[#28bda9] text-white px-6 py-3 h-auto">
                    Clique para Selecionar
                  </Button>
                  <p className="text-xs text-muted-foreground mt-4">
                    Formatos aceitos: PNG, JPG, JPEG
                  </p>
                </div>
              </DialogTrigger>
            )}
          </div>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Escolha uma opção</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Button onClick={openGallery} variant="outline">
                <ImageIcon className="mr-2 h-4 w-4" />
                Escolher da Galeria
              </Button>
              <Button onClick={openCamera} variant="outline">
                <Camera className="mr-2 h-4 w-4" />
                Tirar Foto com a Câmera
              </Button>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancelar
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {preview && (
          <div className="w-full mt-8 space-y-8 animate-in fade-in duration-300">
            <div className="text-center">
              <Label className="font-semibold text-lg text-gray-700">Escolha a cor base do dente (Opcional)</Label>
              {loadingVitaColors ? (
                <div className="flex justify-center items-center h-20">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="bg-white p-4 rounded-lg border mt-4">
                  <div className="flex justify-center items-center gap-4 flex-wrap">
                    {vitaColors.map((color) => (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => setSelectedVitaColor(color.nome === selectedVitaColor ? undefined : color.nome)}
                        className={cn(
                          "w-10 h-10 rounded-full border-2 transition-all duration-200 transform hover:scale-110",
                          selectedVitaColor === color.nome
                            ? "border-primary ring-2 ring-primary ring-offset-2"
                            : "border-gray-200"
                        )}
                        style={{ backgroundColor: color.hexadecimal }}
                        title={color.nome}
                      >
                        <span className="sr-only">{color.nome}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="text-center">
              <Button onClick={handleProceed} disabled={!image} size="lg">
                Avançar
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Upload;