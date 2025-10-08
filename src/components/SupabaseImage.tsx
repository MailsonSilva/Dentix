import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from './ui/skeleton';

interface SupabaseImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  bucket: string;
  url: string | null | undefined;
}

const SupabaseImage: React.FC<SupabaseImageProps> = ({ bucket, url, className, ...props }) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const getSignedUrl = async () => {
      if (!url) {
        if (isMounted) setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const urlObject = new URL(url);
        const pathParts = urlObject.pathname.split(`/${bucket}/`);
        
        if (pathParts.length < 2) {
          throw new Error(`Could not extract path from URL for bucket '${bucket}'`);
        }
        const path = pathParts[1];

        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrl(path, 60 * 5); // 5 minutes expiry

        if (error) throw error;
        if (isMounted) setSignedUrl(data.signedUrl);

      } catch (error) {
        console.error('Error creating signed URL:', error);
        if (isMounted) setSignedUrl(url); // Fallback to original URL
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    getSignedUrl();

    return () => {
      isMounted = false;
    };
  }, [bucket, url]);

  if (loading) {
    return <Skeleton className={className} />;
  }

  if (!signedUrl) {
    return <img src="/placeholder.svg" alt="Imagem indisponível" className={className} {...props} />;
  }

  return <img src={signedUrl} className={className} {...props} />;
};

export default SupabaseImage;