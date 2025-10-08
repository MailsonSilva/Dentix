import React, { useEffect, useState, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

interface ImageItem {
  src: string;
  alt?: string;
}

interface ImageCarouselDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: ImageItem[];
  startIndex?: number;
}

const ImageCarouselDialog: React.FC<ImageCarouselDialogProps> = ({
  open,
  onOpenChange,
  images,
  startIndex = 0,
}) => {
  const [index, setIndex] = useState<number>(Math.max(0, startIndex));
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    if (open) {
      setIndex(Math.min(Math.max(0, startIndex), Math.max(0, images.length - 1)));
      setLoaded(false);
      setErrored(false);
    }
  }, [open, startIndex, images.length]);

  useEffect(() => {
    // reset load/error state when switching images
    setLoaded(false);
    setErrored(false);
  }, [index]);

  const prev = useCallback(() => {
    setIndex((i) => (i <= 0 ? images.length - 1 : i - 1));
  }, [images.length]);

  const next = useCallback(() => {
    setIndex((i) => (i >= images.length - 1 ? 0 : i + 1));
  }, [images.length]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "ArrowLeft") {
        prev();
      } else if (e.key === "ArrowRight") {
        next();
      } else if (e.key === "Escape") {
        onOpenChange(false);
      }
    },
    [open, prev, next, onOpenChange],
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  if (!open) return null;

  const current = images[index];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full p-0">
        <div className="relative bg-black/95 text-white rounded-md overflow-hidden">
          {/* Header with close */}
          <div className="absolute top-3 right-3 z-20 flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="bg-black/40 hover:bg-black/50 text-white"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Left/Right controls */}
          <div className="absolute inset-y-0 left-0 z-10 flex items-center">
            <button
              aria-label="Anterior"
              onClick={prev}
              className="p-3 m-3 rounded-full bg-black/30 hover:bg-black/50 text-white"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          </div>
          <div className="absolute inset-y-0 right-0 z-10 flex items-center">
            <button
              aria-label="Próximo"
              onClick={next}
              className="p-3 m-3 rounded-full bg-black/30 hover:bg-black/50 text-white"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          {/* Image area */}
          <div className="w-full flex items-center justify-center min-h-[60vh] bg-black p-4">
            {current ? (
              <div className="relative flex items-center justify-center w-full">
                {/* Spinner while loading */}
                {!loaded && !errored && (
                  <div className="absolute flex flex-col items-center gap-2">
                    <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                    <div className="text-sm text-white/80">Carregando imagem…</div>
                  </div>
                )}

                {/* Image itself */}
                <img
                  src={current.src}
                  alt={current.alt || `Imagem ${index + 1}`}
                  onLoad={() => setLoaded(true)}
                  onError={() => setErrored(true)}
                  className={`mx-auto max-h-[80vh] max-w-[96vw] object-contain transition-opacity duration-300 ${
                    loaded ? "opacity-100" : "opacity-0"
                  }`}
                  loading="lazy"
                />

                {/* Error fallback */}
                {errored && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold">Não foi possível carregar a imagem</div>
                      <div className="text-sm text-white/80 mt-1">{current.alt}</div>
                    </div>

                    <div className="flex gap-2">
                      <a
                        href={current.src}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white text-black hover:opacity-90"
                      >
                        Abrir em nova aba
                        <ExternalLink className="h-4 w-4" />
                      </a>

                      <Button variant="ghost" onClick={() => setErrored(false)}>
                        Tentar novamente
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">Imagem indisponível</div>
            )}
          </div>

          {/* Footer / caption */}
          <div className="px-4 py-3 bg-gradient-to-t from-black/90 to-transparent flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="text-sm text-muted-foreground truncate max-w-[60%]">
              {current?.alt ?? ""}
            </div>

            <div className="flex items-center gap-3">
              <div className="text-xs text-muted-foreground hidden sm:block">
                {index + 1} / {images.length}
              </div>

              {/* Indicators */}
              <div className="flex items-center gap-2">
                {images.map((_, i) => (
                  <button
                    key={i}
                    aria-label={`Ir para imagem ${i + 1}`}
                    onClick={() => setIndex(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === index ? "bg-primary" : "bg-white/40 hover:bg-white/70"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCarouselDialog;