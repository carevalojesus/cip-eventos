import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";

interface FormImageUploadProps {
  label?: string;
  value: File | null;
  onChange: (file: File | null) => void;
  existingImageUrl?: string;
  error?: string;
  hint?: string;
  maxSizeMB?: number;
  acceptedTypes?: string[];
}

export const FormImageUpload: React.FC<FormImageUploadProps> = ({
  label,
  value,
  onChange,
  existingImageUrl,
  error,
  hint,
  maxSizeMB = 5,
  acceptedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"],
}) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [showExisting, setShowExisting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (existingImageUrl && !value) {
      setShowExisting(true);
    } else {
      setShowExisting(false);
    }
  }, [existingImageUrl, value]);

  useEffect(() => {
    if (value) {
      const objectUrl = URL.createObjectURL(value);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setPreview(null);
  }, [value]);

  const handleFileSelect = useCallback(
    (selectedFile: File) => {
      setLocalError(null);

      if (!acceptedTypes.includes(selectedFile.type)) {
        setLocalError(t("form.image.error_type", "Tipo de archivo no válido"));
        return;
      }

      if (selectedFile.size > maxSizeMB * 1024 * 1024) {
        setLocalError(
          t("form.image.error_size", `El archivo excede ${maxSizeMB}MB`)
        );
        return;
      }

      onChange(selectedFile);
      setShowExisting(false);
    },
    [onChange, acceptedTypes, maxSizeMB, t]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleRemove = () => {
    onChange(null);
    setPreview(null);
    setLocalError(null);
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

  const displayError = error || localError;

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "var(--form-label-gap)",
    width: "100%",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "var(--font-size-sm)",
    fontWeight: 500,
    color: "#504A40",
    lineHeight: 1.5,
  };

  const dropzoneStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px 24px",
    backgroundColor: isDragging ? "#FFEEEE" : "#FAF9F7",
    border: `2px dashed ${isDragging ? "#BA2525" : displayError ? "#BA2525" : "#D3CEC4"}`,
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 150ms ease",
  };

  const iconStyle: React.CSSProperties = {
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: "50%",
    marginBottom: "12px",
    border: "1px solid #E8E6E1",
  };

  const textStyle: React.CSSProperties = {
    fontSize: "var(--font-size-sm)",
    color: "#504A40",
    textAlign: "center",
    marginBottom: "4px",
  };

  const hintTextStyle: React.CSSProperties = {
    fontSize: "var(--font-size-sm)",
    color: "#857F72",
    textAlign: "center",
  };

  const previewContainerStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    aspectRatio: "16 / 9",
    borderRadius: "8px",
    overflow: "hidden",
    backgroundColor: "#FAF9F7",
  };

  const previewImageStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  };

  const previewOverlayStyle: React.CSSProperties = {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: "12px",
    background: "linear-gradient(transparent, rgba(0,0,0,0.6))",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };

  const previewInfoStyle: React.CSSProperties = {
    fontSize: "var(--font-size-sm)",
    color: "#FFFFFF",
    fontWeight: 500,
  };

  const removeButtonStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    border: "none",
    borderRadius: "50%",
    cursor: "pointer",
    color: "#BA2525",
    transition: "background-color 150ms ease",
  };

  const errorStyle: React.CSSProperties = {
    fontSize: "var(--font-size-sm)",
    color: "#BA2525",
  };

  const hintStyle: React.CSSProperties = {
    fontSize: "var(--font-size-sm)",
    color: "#857F72",
  };

  return (
    <div style={containerStyle}>
      {label && <label style={labelStyle}>{label}</label>}

      <input
        ref={inputRef}
        type="file"
        accept={acceptedTypes.join(",")}
        onChange={handleInputChange}
        style={{ display: "none" }}
      />

      {showExisting && existingImageUrl && !value ? (
        <div style={previewContainerStyle}>
          <img
            src={existingImageUrl}
            alt={t("form.image.current", "Imagen actual")}
            style={previewImageStyle}
          />
          <div style={previewOverlayStyle}>
            <span style={previewInfoStyle}>
              {t("form.image.current", "Imagen actual")}
            </span>
            <button
              type="button"
              style={removeButtonStyle}
              onClick={handleRemoveExisting}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#FFFFFF")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.9)")
              }
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ) : preview && value ? (
        <div style={previewContainerStyle}>
          <img src={preview} alt="Preview" style={previewImageStyle} loading="lazy" decoding="async" />
          <div style={previewOverlayStyle}>
            <span style={previewInfoStyle}>
              {value.name} • {formatFileSize(value.size)}
            </span>
            <button
              type="button"
              style={removeButtonStyle}
              onClick={handleRemove}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#FFFFFF")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.9)")
              }
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div
          style={dropzoneStyle}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleClick()}
          onMouseEnter={(e) => {
            if (!isDragging) {
              e.currentTarget.style.borderColor = "#B8B2A7";
            }
          }}
          onMouseLeave={(e) => {
            if (!isDragging) {
              e.currentTarget.style.borderColor = displayError
                ? "#BA2525"
                : "#D3CEC4";
            }
          }}
        >
          <div style={iconStyle}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#857F72"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <p style={textStyle}>
            {t("form.image.drag", "Arrastra una imagen o")}{" "}
            <strong style={{ color: "#BA2525" }}>
              {t("form.image.click", "haz clic para subir")}
            </strong>
          </p>
          <p style={hintTextStyle}>
            PNG, JPG, WebP • Máx. {maxSizeMB}MB • Recomendado: 1200×630px
          </p>
        </div>
      )}

      {displayError && <span style={errorStyle}>{displayError}</span>}
      {hint && !displayError && <span style={hintStyle}>{hint}</span>}
    </div>
  );
};
