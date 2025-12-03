"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  className?: string;
  folder?: string;
}

export default function ImageUpload({ 
  value, 
  onChange, 
  placeholder = "Seleccionar imagen...",
  className = "",
  folder = "products"
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 5MB');
      return;
    }

    setUploading(true);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      // Upload to Supabase Storage
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir la imagen');
      }

      const data = await response.json();
      
      if (data.url) {
        onChange(data.url);
        setPreview(data.url);
        toast.success('Imagen subida exitosamente');
      } else {
        throw new Error('No se recibió URL de la imagen');
      }

    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Error al subir la imagen. Inténtalo de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const handleManualUrl = (url: string) => {
    onChange(url);
    setPreview(url);
  };

  const clearImage = () => {
    onChange('');
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 pt-2 ${className}`}>
      {/* Upload Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* File Upload */}
        <Card className='bg-admin-bg-secondary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]'>
          <CardContent className="p-4">
            <Label className="text-sm font-medium mb-2 block">
              Subir desde dispositivo
            </Label>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={openFileDialog}
                disabled={uploading}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Seleccionar archivo
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-500">
                Máximo 5MB. Formatos: JPG, PNG, WebP
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Manual URL */}
        <Card className='bg-admin-bg-secondary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]'>
          <CardContent className="p-4">
            <Label className="text-sm font-medium mb-2 block">
              URL de imagen
            </Label>
            <div className="space-y-2">
              <Input
                placeholder="https://ejemplo.com/imagen.jpg"
                value={value}
                onChange={(e) => handleManualUrl(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Pega la URL de una imagen existente
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      {(preview || value) && (
        <Card className='bg-admin-bg-secondary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]'  >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Vista previa</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <img
                src={preview || value}
                alt="Preview"
                className="w-full h-48 object-cover rounded-md border"
                onError={() => {
                  toast.error('Error al cargar la imagen');
                  setPreview(null);
                }}
              />
              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-md">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
