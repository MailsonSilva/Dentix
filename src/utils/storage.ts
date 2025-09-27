import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

// Função auxiliar para converter Data URL para Blob
function dataURLtoBlob(dataurl: string) {
  const arr = dataurl.split(",");
  if (arr.length < 2) {
    throw new Error("Invalid data URL");
  }
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) {
    throw new Error("Could not find MIME type in data URL");
  }
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Upload a dataURL (base64) image to a bucket and return a usable URL.
 * Tries getPublicUrl first; if not available, tries createSignedUrl as fallback.
 */
export const uploadBase64Image = async (
  base64Image: string,
  bucket: string,
): Promise<string> => {
  try {
    const blob = dataURLtoBlob(base64Image);
    const fileExt = blob.type.split("/")[1] || "jpg";
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, blob, {
        cacheControl: "3600",
        upsert: false,
        contentType: blob.type,
      });

    if (uploadError) {
      console.error("Supabase storage upload error:", uploadError);
      throw uploadError;
    }

    // First try to get a public URL
    const { data: publicData, error: publicError } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    if (publicError) {
      console.warn("getPublicUrl returned an error:", publicError);
    }

    if (publicData && publicData.publicUrl) {
      return publicData.publicUrl;
    }

    // Fallback: try to create a signed URL (valid for 7 days)
    try {
      const expiresIn = 60 * 60 * 24 * 7; // 7 days
      const { data: signedData, error: signedError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, expiresIn);

      if (signedError) {
        console.warn("createSignedUrl returned an error:", signedError);
      }

      if (signedData && signedData.signedUrl) {
        return signedData.signedUrl;
      }
    } catch (err) {
      console.warn("Error creating signed URL fallback:", err);
    }

    // If we reach here, something unexpected happened
    console.error("Could not generate a public or signed URL for uploaded file", {
      bucket,
      filePath,
      uploadData,
    });
    throw new Error("Não foi possível gerar a URL pública do arquivo enviado.");
  } catch (error) {
    console.error("Error uploading image:", error);
    throw new Error("Falha ao enviar a imagem.");
  }
};

export const uploadFile = async (file: File, bucket: string): Promise<string> => {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Supabase storage upload file error:", uploadError);
      throw uploadError;
    }

    const { data: publicData, error: publicError } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    if (publicError) {
      console.warn("getPublicUrl returned an error:", publicError);
    }

    if (publicData && publicData.publicUrl) {
      return publicData.publicUrl;
    }

    // Fallback to signed URL
    try {
      const expiresIn = 60 * 60 * 24 * 7; // 7 days
      const { data: signedData, error: signedError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, expiresIn);

      if (signedError) {
        console.warn("createSignedUrl returned an error:", signedError);
      }

      if (signedData && signedData.signedUrl) {
        return signedData.signedUrl;
      }
    } catch (err) {
      console.warn("Error creating signed URL fallback:", err);
    }

    console.error("Could not generate a URL for uploaded file", { bucket, filePath, uploadData });
    throw new Error("Falha ao gerar a URL pública do arquivo enviado.");
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error("Falha ao enviar o arquivo.");
  }
};