import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';

// Função auxiliar para converter Data URL para Blob
function dataURLtoBlob(dataurl: string) {
    const arr = dataurl.split(',');
    if (arr.length < 2) {
        throw new Error('Invalid data URL');
    }
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) {
        throw new Error('Could not find MIME type in data URL');
    }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
}

export const uploadBase64Image = async (base64Image: string, bucket: string): Promise<string> => {
    try {
        const blob = dataURLtoBlob(base64Image);
        const fileExt = blob.type.split('/')[1] || 'jpg';
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, blob, {
                cacheControl: '3600',
                upsert: false,
            });

        if (error) {
            throw error;
        }

        // Use the known filePath to get a public URL (more reliable than relying on upload response)
        const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath);
        return publicData.publicUrl;
    } catch (error) {
        console.error("Error uploading image:", error);
        throw new Error("Falha ao enviar a imagem.");
    }
};

export const uploadFile = async (file: File, bucket: string): Promise<string> => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data, error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) {
            throw uploadError;
        }

        // Use the known filePath to get a public URL
        const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath);
        return publicData.publicUrl;
    } catch (error) {
        console.error("Error uploading file:", error);
        throw new Error("Falha ao enviar o arquivo.");
    }
};