import React, { useState, useEffect } from 'react';
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

export const PhotoTipsDialog: React.FC<PhotoTipsDialogProps> = ({ open, onOpenChange, onContinue }) => {
  const [img1Loaded, setImg1Loaded] = useState(false);
  const [img2Loaded, setImg2Loaded] = useState(false);
  const [img1Error, setImg1Error] = useState(false);
  const [img2Error, setImg2Error] = useState(false);

  // Reset states when dialog opens
  useEffect(() => {
    if (open) {
      setImg1Loaded(false);
      setImg2Loaded(false);
      setImg1Error(false);
      setImg2Error(false);
    }
  }, [open]);

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
            <div className="w-44 h-44 flex items-center justify-center bg-muted rounded-lg border">
              {!img1Loaded && !img1Error && (
                <div className="text-muted-foreground text-sm">Carregando...</div>
              )}
              {img1Error && (
                <div className="text-muted-foreground text-sm text-center p-2">
                  Imagem 1 não disponível
                </div>
              )}
              <img
                src="/IMAGEM1.jpg"
                alt="Exemplo 1"
                className={`w-full h-full object-cover rounded-lg ${img1Loaded ? 'block' : 'hidden'}`}
                onLoad={() => setImg1Loaded(true)}
                onError={() => {
                  setImg1Error(true);
                  setImg1Loaded(true);
                }}
              />
            </div>
            <div className="w-44 h-44 flex items-center justify-center bg-muted rounded-lg border">
              {!img2Loaded && !img2Error && (
                <div className="text-muted-foreground text-sm">Carregando...</div>
              )}
              {img2Error && (
                <div className="text-muted-foreground text-sm text-center p-2">
                  Imagem 2 não disponível
                </div>
              )}
              <img
                src="/IMAGEM2.jpg"
                alt="Exemplo 2"
                className={`w-full h-full object-cover rounded-lg ${img2Loaded ? 'block' : 'hidden'}`}
                onLoad={() => setImg2Loaded(true)}
                onError={() => {
                  setImg2Error(true);
                  setImg2Loaded(true);
                }}
              />
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