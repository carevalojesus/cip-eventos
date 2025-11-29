import React, { useState, useEffect } from "react";
import { type UseFormReturn } from "react-hook-form";
import { Upload, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadTrigger,
  FileUploadList,
  FileUploadItem,
  FileUploadItemPreview,
  FileUploadItemMetadata,
  FileUploadItemDelete,
} from "@/components/ui/file-upload";
import type { CreateEventFormValues } from "@/hooks/useCreateEvent";

interface EventImageUploadProps {
  form: UseFormReturn<CreateEventFormValues>;
  existingImageUrl?: string;
}

export const EventImageUpload: React.FC<EventImageUploadProps> = ({ form, existingImageUrl }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [showExisting, setShowExisting] = useState(false);
  const { setValue } = form;

  // Sincronizar cuando cambia la URL de imagen existente
  useEffect(() => {
    if (existingImageUrl) {
      setShowExisting(true);
      setFiles([]);
    } else {
      setShowExisting(false);
    }
  }, [existingImageUrl]);

  const handleValueChange = (newFiles: File[]) => {
    setFiles(newFiles);
    setValue("coverImage", newFiles[0] || null);
    if (newFiles.length > 0) {
      setShowExisting(false);
    }
  };

  const handleFileReject = (file: File, message: string) => {
    console.warn(`Archivo rechazado: ${file.name} - ${message}`);
  };

  const handleRemoveExisting = () => {
    setShowExisting(false);
  };

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <ImageIcon className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-medium text-foreground">Imagen del Evento</h2>
      </div>

      {/* Mostrar imagen existente */}
      {showExisting && existingImageUrl && files.length === 0 ? (
        <div className="relative aspect-[1200/630] w-full overflow-hidden rounded-lg bg-muted">
          <img
            src={existingImageUrl}
            alt="Imagen actual del evento"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <span className="text-sm text-white">Imagen actual</span>
          </div>
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full"
            onClick={handleRemoveExisting}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <FileUpload
          value={files}
          onValueChange={handleValueChange}
          onFileReject={handleFileReject}
          accept="image/png,image/jpeg,image/jpg,image/webp"
          maxFiles={1}
          maxSize={5 * 1024 * 1024}
          className="w-full"
        >
          {files.length === 0 ? (
          <FileUploadDropzone className="min-h-[200px] border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer">
            <div className="flex flex-col items-center justify-center gap-2 text-center">
              <div className="rounded-full bg-muted p-3">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Arrastra una imagen o haz clic para seleccionar
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG o WebP hasta 5MB. Tamaño recomendado: 1200x630px
                </p>
              </div>
              <FileUploadTrigger asChild>
                <Button variant="outline" size="sm" className="mt-2">
                  Seleccionar imagen
                </Button>
              </FileUploadTrigger>
            </div>
          </FileUploadDropzone>
        ) : (
          <FileUploadList className="mt-0">
            {files.map((file) => (
              <FileUploadItem
                key={file.name}
                value={file}
                className="relative overflow-hidden rounded-lg border-0 p-0"
              >
                <div className="relative aspect-[1200/630] w-full overflow-hidden rounded-lg bg-muted">
                  <FileUploadItemPreview className="absolute inset-0 h-full w-full rounded-none border-0 bg-transparent [&>img]:object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <FileUploadItemMetadata className="text-white [&>span]:text-white [&>span:last-child]:text-white/80" />
                  </div>
                  <FileUploadItemDelete asChild>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </FileUploadItemDelete>
                </div>
              </FileUploadItem>
            ))}
          </FileUploadList>
        )}
        </FileUpload>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        Esta imagen se mostrará como banner del evento en el listado y la página de detalles.
      </p>
    </div>
  );
};
