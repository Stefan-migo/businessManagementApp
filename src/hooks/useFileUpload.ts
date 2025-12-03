import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

interface UploadOptions {
  bucket: string;
  path?: string;
  maxSize?: number; // in bytes
  allowedTypes?: string[];
}

export interface UploadProgress {
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  error?: string;
  url?: string;
}

export function useFileUpload() {
  const [uploadState, setUploadState] = useState<UploadProgress>({
    progress: 0,
    status: 'idle'
  });

  const uploadFile = async (
    file: File,
    options: UploadOptions
  ): Promise<string | null> => {
    const {
      bucket,
      path,
      maxSize = 5 * 1024 * 1024, // 5MB default
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    } = options;

    try {
      setUploadState({ progress: 0, status: 'uploading' });

      // Validate file size
      if (file.size > maxSize) {
        throw new Error(`El archivo es muy grande. Tamaño máximo: ${maxSize / 1024 / 1024}MB`);
      }

      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Tipo de archivo no permitido. Tipos permitidos: ${allowedTypes.join(', ')}`);
      }

      // Get current user
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuario no autenticado');
      }

      // Create file path with user ID
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${path || 'avatar'}.${fileExt}`;

      setUploadState({ progress: 25, status: 'uploading' });

      // Upload file to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      setUploadState({ progress: 75, status: 'uploading' });

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      if (!urlData.publicUrl) {
        throw new Error('Error obteniendo URL pública');
      }

      setUploadState({
        progress: 100,
        status: 'success',
        url: urlData.publicUrl
      });

      return urlData.publicUrl;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setUploadState({
        progress: 0,
        status: 'error',
        error: errorMessage
      });
      return null;
    }
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    return uploadFile(file, {
      bucket: 'avatars',
      path: 'avatar',
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    });
  };

  const resetUploadState = () => {
    setUploadState({ progress: 0, status: 'idle' });
  };

  return {
    uploadState,
    uploadFile,
    uploadAvatar,
    resetUploadState
  };
}

// Utility function to create optimized image URLs
export function getOptimizedImageUrl(url: string, width?: number, height?: number): string {
  if (!url) return url;
  
  // If it's a Supabase storage URL, we can add transformation parameters
  if (url.includes('supabase.co/storage')) {
    const transformParams = new URLSearchParams();
    if (width) transformParams.set('width', width.toString());
    if (height) transformParams.set('height', height.toString());
    transformParams.set('quality', '80');
    transformParams.set('format', 'webp');
    
    return transformParams.toString() ? `${url}?${transformParams.toString()}` : url;
  }
  
  return url;
} 