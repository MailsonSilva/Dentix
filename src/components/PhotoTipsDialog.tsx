import React from 'react';
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
            <img src="/IMAGEM1.jpg" alt="Foto de exemplo 1" className="w-48 h-48 object-cover rounded-lg border" />
            <img src="/IMAGEM2.jpg" alt="Foto de exemplo 2" className="w-48 h-48 object-cover rounded-lg border" />
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