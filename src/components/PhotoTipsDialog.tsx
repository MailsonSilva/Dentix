import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PhotoTipsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
}

const DEFAULT_PLACEHOLDER = '/placeholder.svg';

export const PhotoTipsDialog: React.FC<PhotoTipsDialogProps> = ({ open, onOpenChange, onContinue }) => {
  const [img1Src, setImg1Src] = useState('/IMAGEM1.jpg');
  const [img2Src, setImg2Src] = useState('/IMAGEM2.jpg');

  const handleImg1Error = () => {
    // tenta alternativas antes do placeholder
    if (img1Src !== '/IMAGEM1.png') {
      setImg1Src('/IMAGEM1.png');
    } else {
      setImg1Src(DEFAULT_PLACEHOLDER);
    }
  };

  const handleImg2Error = () => {
    if (img2Src !== '/IMAGEM2.png') {
      setImg2Src('/IMAGEM2.png');
    } else {
      setImg2Src(DEFAULT_PLACEHOLDER);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">DICAS</DialogTitle>
          <DialogDescription className="text-center px-4">
            Para obter o melhor desempenho da tecnologia, capture suas fotos conforme o protocolo abaixo.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
          <div className="flex justify-center gap-4">
            <div className="relative">
              <img
                src={img1Src}
                alt="Exemplo 1 - Foto incorreta"
                onError={handleImg1Error}
                className="w-44 h-44 object-cover rounded-lg border bg-white"
              />
              <div className="absolute top-2 left-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">X</span>
              </div>
            </div>
            <div className="relative">
              <img
                src={img2Src}
                alt="Exemplo 2 - Foto correta"
                onError={handleImg2Error}
                className="w-44 h-44 object-cover rounded-lg border bg-white"
              />
              <div className="absolute top-2 left-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">✔</span>
              </div>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside px-6">
            <li>
              <strong>Iluminação:</strong> Garanta boa iluminação.
            </li>
            <li>
              <strong>Posição:</strong> O paciente deve estar sentado com a postura ereta, de costas para uma parede.
            </li>
            <li>
              <strong>Sorriso:</strong> Peça para o paciente sorrir.
            </li>
            <li>
              <strong>Ângulo:</strong> A câmera deve estar perpendicular ao rosto.
            </li>
            <li>
              <strong>Formatos:</strong> Use arquivos .jpeg ou .png.
            </li>
          </ul>
        </div>
        <DialogFooter>
          <Button onClick={onContinue} className="w-full">
            Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};