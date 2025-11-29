import React, { useState, useEffect, useCallback, useRef } from "react";
import { type UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Upload, X } from "lucide-react";
import type { CreateEventFormValues } from "@/hooks/useCreateEvent";

interface EventImageUploadProps {
  form: UseFormReturn<CreateEventFormValues>;
  existingImageUrl?: string;
}

export const EventImageUpload: React.FC<EventImageUploadProps> = ({ form, existingImageUrl }) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [showExisting, setShowExisting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { setValue } = form;

  useEffect(() => {
    if (existingImageUrl) {
      setShowExisting(true);
      setFile(null);
      setPreview(null);
    } else {
      setShowExisting(false);
    }
  }, [existingImageUrl]);

  useEffect(() => {
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setPreview(null);
  }, [file]);

  const handleFileSelect = useCallback((selectedFile: File) => {
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(selectedFile.type)) {
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      return;
    }
    setFile(selectedFile);
    setValue("coverImage", selectedFile);
    setShowExisting(false);
  }, [setValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    setValue("coverImage", null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleRemoveExisting = () => {
    setShowExisting(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="rui-form-card">
      <h2 className="rui-form-section-title">
        {t("create_event.image.title", "Imagen del Evento")}
      </h2>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleInputChange}
        style={{ display: "none" }}
      />

      {showExisting && existingImageUrl && !file ? (
        <div className="rui-upload-preview">
          <img
            src={existingImageUrl}
            alt={t("create_event.image.current", "Imagen actual")}
          />
          <div className="rui-upload-preview-overlay" />
          <div className="rui-upload-preview-info">
            {t("create_event.image.current", "Imagen actual")}
          </div>
          <button
            type="button"
            className="rui-upload-preview-remove"
            onClick={handleRemoveExisting}
            aria-label="Eliminar imagen"
          >
            <X size={14} />
          </button>
        </div>
      ) : preview && file ? (
        <div className="rui-upload-preview">
          <img src={preview} alt="Preview" />
          <div className="rui-upload-preview-overlay" />
          <div className="rui-upload-preview-info">
            {file.name} • {formatFileSize(file.size)}
          </div>
          <button
            type="button"
            className="rui-upload-preview-remove"
            onClick={handleRemove}
            aria-label="Eliminar imagen"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          className={`rui-upload-zone ${isDragging ? "rui-upload-zone--dragging" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleClick()}
        >
          <Upload className="rui-upload-zone-icon" />
          <p className="rui-upload-zone-text">
            {t("create_event.image.drag_text", "Arrastra una imagen o")}{" "}
            <strong>{t("create_event.image.click_text", "haz clic para subir")}</strong>
          </p>
          <p className="rui-upload-zone-hint">
            {t("create_event.image.hint", "PNG, JPG o WebP • Máximo 5MB • Recomendado: 1200x630px")}
          </p>
        </div>
      )}

      <p className="rui-form-hint" style={{ marginTop: "12px" }}>
        {t("create_event.image.banner_hint", "Esta imagen se mostrará como banner del evento.")}
      </p>
    </div>
  );
};
