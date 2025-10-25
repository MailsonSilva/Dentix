import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, X, Image as ImageIcon, Camera } from 'lucide-react';
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

const Upload = () => {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

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
      setDialogOpen(false); // Close dialog on successful selection
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
    noClick: true, // We will trigger click manually
  });

  const { ref: dropzoneInputRef, ...inputProps } = getInputProps();

  // Combine refs to get access to the input element
  const combinedRef = useCallback((node: HTMLInputElement) => {
    dropzoneInputRef(node);
    inputRef.current = node;
  }, [dropzoneInputRef]);


  const handleRemoveImage = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setImage(null);
    setPreview(null);
  };

  const handleProceed = () => {
    if (image) {
      // Store image in session storage to pass to the next page
      const reader = new FileReader();
      reader.readAsDataURL(image);
      reader.onloadend = () => {
        sessionStorage.setItem('uploadedImage', reader.result as string);
        sessionStorage.setItem('imageName', image.name);
        navigate('/select-procedure');
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
    if (inputRef.current) {
      inputRef.current.setAttribute('capture', 'environment');
      inputRef.current.click();
    }
  };

  return (
    <div className="container mx-auto max-w-3xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Carregar Imagem do Paciente</CardTitle>
          <CardDescription>
            Selecione ou tire uma foto do paciente para iniciar a simulação.
            A imagem deve ser nítida e bem iluminada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                isDragActive ? "border-blue-600 bg-blue-50" : "border-gray-300 hover:border-blue-400",
                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              )}
            >
              <input {...inputProps} ref={combinedRef} />
              {preview ? (
                <div className="relative group">
                  <img src={preview} alt="Pré-visualização" className="mx-auto max-h-64 rounded-md" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent dialog from opening
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
                  <div className="flex flex-col items-center text-blue-800">
                    <UploadCloud className="h-12 w-12 text-blue-400 mb-4" />
                    <p className="font-semibold text-lg">Arraste e solte a imagem aqui</p>
                    <p className="text-sm text-muted-foreground my-2">ou</p>
                    <Button type="button" variant="outline" className="text-blue-800 border-blue-800 hover:bg-blue-50 hover:text-blue-900">
                      Clique para selecionar
                    </Button>
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

          <div className="mt-6 text-center">
            <Button onClick={handleProceed} disabled={!image} size="lg">
              Continuar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Upload;