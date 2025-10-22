import React, { useEffect, useState, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ImageItem {
  src: string;
  alt?: string;
}

interface ImageCarouselDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: ImageItem[];
  startIndex?: number;
  bucket?: string; // Bucket is now optional
}

const ImageCarouselDialog: React.FC<ImageCarouselDialogProps> = ({
  open,
  onOpenChange,
  images,
  startIndex = 0,
  bucket,
}) => {
  const [index, setIndex] = useState(startIndex);
  const [signedSrc, setSignedSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const currentImage = images[index];

  useEffect(() => {
    if (open) {
      setIndex(Math.min(Math.max(0, startIndex), Math.max(0, images.length - 1)));
    }
  }, [open, startIndex, images.length]);

  useEffect(() => {
    let isMounted = true;
    if (!currentImage?.src || !open) return;

    setIsLoading(true);
    setHasError(false);
    setSignedSrc(null);

    // Handle base64 images directly
    if (currentImage.src.startsWith("data:")) {
      if (isMounted) {
        setSignedSrc(currentImage.src);
        setIsLoading(false);
      }
      return; // Exit early
    }

    // Handle Supabase URLs
    const getSignedUrl = async () => {
      if (!bucket) {
        console.error("Bucket prop is required for Supabase URLs in ImageCarouselDialog");
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
        return;
      }
      try {
        const urlObject = new URL(currentImage.src);
        const pathParts = urlObject.pathname.split(`/${bucket}/`);

        if (pathParts.length < 2) {
          throw new Error(`Could not extract path from URL for bucket '${bucket}'`);
        }
        const path = pathParts[1];

        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrl(path, 60 * 5); // 5 minutes expiry

        if (error) throw error;

        if (isMounted) {
          setSignedSrc(data.signedUrl);
        }
      } catch (error) {
        console.error("Error creating signed URL for carousel:", error);
        if (isMounted) {
          setHasError(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    getSignedUrl();

    return () => {
      isMounted = false;
    };
  }, [index, currentImage, open, bucket]);

  const handlePrev = useCallback(() => {
    setIndex((i) => (i <= 0 ? images.length - 1 : i - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setIndex((i) => (i >= images.length - 1 ? 0 : i + 1));
  }, [images.length]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "ArrowRight") handleNext();
      else if (e.key === "Escape") onOpenChange(false);
    },
    [open, handlePrev, handleNext, onOpenChange],
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full p-0 border-0 bg-transparent shadow-none">
        <div className="relative bg-black/80 text-white rounded-lg overflow-hidden backdrop-blur-sm">
          {/* Header with close */}
          <div className="absolute top-3 right-3 z-20">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="bg-black/40 hover:bg-black/50 text-white rounded-full"
              aria-label="Fechar"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Navigation */}
          {images.length > 1 && (
            <>
              <div className="absolute inset-y-0 left-0 z-10 flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Anterior"
                  onClick={handlePrev}
                  className="m-3 rounded-full bg-black/30 hover:bg-black/50 text-white h-12 w-12"
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
              </div>
              <div className="absolute inset-y-0 right-0 z-10 flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Próximo"
                  onClick={handleNext}
                  className="m-3 rounded-full bg-black/30 hover:bg-black/50 text-white h-12 w-12"
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </div>
            </>
          )}

          {/* Image area */}
          <div className="w-full flex items-center justify-center h-[calc(100vh-80px)] p-4">
            {isLoading && (
              <div className="absolute flex flex-col items-center gap-2">
                <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            )}
            {hasError && !isLoading && (
              <div className="text-center text-red-400 flex flex-col items-center gap-2">
                <AlertTriangle className="h-12 w-12" />
                <p>Não foi possível carregar a imagem.</p>
              </div>
            )}
            {signedSrc && !hasError && (
              <img
                src={signedSrc}
                alt={currentImage?.alt || `Imagem ${index + 1}`}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setHasError(true);
                  setIsLoading(false);
                }}
                className={`mx-auto max-h-full max-w-full object-contain transition-opacity duration-300 ${
                  isLoading ? "opacity-0" : "opacity-100"
                }`}
              />
            )}
          </div>

          {/* Footer / caption */}
          <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/80 to-transparent flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-sm text-white/90 truncate">
              {currentImage?.alt || ""}
            </p>
            {images.length > 1 && (
              <div className="flex items-center gap-2">
                {images.map((_, i) => (
                  <button
                    key={i}
                    aria-label={`Ir para imagem ${i + 1}`}
                    onClick={() => setIndex(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      i === index ? "bg-white" : "bg-white/40 hover:bg-white/70"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCarouselDialog;