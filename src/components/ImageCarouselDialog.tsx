import React, { useEffect, useState, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

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
  const [fetchedSrc, setFetchedSrc] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (open) {
      setIndex(Math.min(Math.max(0, startIndex), Math.max(0, images.length - 1)));
      setLoaded(false);
      setErrored(false);
      setFetchedSrc(null);
    }
  }, [open, startIndex, images.length]);

  useEffect(() => {
    // reset load/error state when switching images
    setLoaded(false);
    setErrored(false);
    setFetchedSrc(null);
  }, [index]);

  // Clean up object URL when component unmounts or when fetchedSrc changes
  useEffect(() => {
    return () => {
      if (fetchedSrc) {
        URL.revokeObjectURL(fetchedSrc);
      }
    };
  }, [fetchedSrc]);

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

  // Attempt to fetch the image as a blob and show it via an object URL (so it opens inside the dialog)
  const fetchStoredImage = () => {
    if (!current?.src) {
      setErrored(true);
      return;
    }

    setIsFetching(true);
    // fetch the resource and convert to blob
    fetch(current.src)
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.blob();
      })
      .then((blob) => {
        // revoke previous if exists
        if (fetchedSrc) URL.revokeObjectURL(fetchedSrc);
        const url = URL.createObjectURL(blob);
        setFetchedSrc(url);
        setErrored(false);
        setLoaded(true); // mark as loaded to show the image
      })
      .catch(() => {
        setErrored(true);
      })
      .finally(() => {
        setIsFetching(false);
      });
  };

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
                {!loaded && !errored && !isFetching && (
                  <div className="absolute flex flex-col items-center gap-2">
                    <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                    <div className="text-sm text-white/80">Carregando imagem…</div>
                  </div>
                )}

                {/* If we fetched a blob, use it; otherwise use the original src */}
                <img
                  src={fetchedSrc ?? current.src}
                  alt={current.alt || `Imagem ${index + 1}`}
                  onLoad={() => setLoaded(true)}
                  onError={() => {
                    // If loading failed from direct src, set errored so user can request fetch
                    setErrored(true);
                    setLoaded(false);
                  }}
                  className={`mx-auto max-h-[80vh] max-w-[96vw] object-contain transition-opacity duration-300 ${
                    loaded ? "opacity-100" : "opacity-0"
                  }`}
                  loading="lazy"
                />

                {/* Error fallback: Try to load the stored (uploaded) image inside the dialog */}
                {errored && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold">Não foi possível carregar a imagem diretamente</div>
                      <div className="text-sm text-white/80 mt-1">{current.alt}</div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={fetchStoredImage}
                        disabled={isFetching}
                        className="px-3 py-2"
                      >
                        {isFetching ? "Carregando..." : "Abrir imagem carregada"}
                      </Button>

                      <Button
                        variant="ghost"
                        onClick={() => {
                          // reset and try to reload the original src by toggling loaded state
                          setErrored(false);
                          setLoaded(false);
                          // forcing a reload can be achieved by setting fetchedSrc to null and letting img try current.src again
                          if (fetchedSrc) {
                            URL.revokeObjectURL(fetchedSrc);
                            setFetchedSrc(null);
                          }
                        }}
                      >
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