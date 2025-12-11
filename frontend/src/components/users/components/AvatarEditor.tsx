import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Camera, SpinnerGap, Trash, X, Check, ImageSquare } from "@phosphor-icons/react";
import { getInitials, getAvatarColor, type UserLike } from "@/lib/userUtils";
import { Button } from "@/components/ui/button";

interface AvatarEditorProps {
  user: UserLike;
  onAvatarChange: (file: File) => Promise<void>;
  onAvatarRemove?: () => Promise<void>;
  isUploading?: boolean;
  disabled?: boolean;
}

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export const AvatarEditor: React.FC<AvatarEditorProps> = ({
  user,
  onAvatarChange,
  onAvatarRemove,
  isUploading = false,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  
  // Preview state
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Confirm remove state
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const initials = getInitials(user);
  const backgroundColor = getAvatarColor(user.email);
  const avatarUrl = user.profile?.avatar;

  const handleClick = () => {
    if (!disabled && !isUploading && !previewUrl) {
      fileInputRef.current?.click();
    }
  };

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return t("users.avatar.invalid_type", "Formato no válido. Use PNG, JPG o WebP.");
    }
    if (file.size > MAX_SIZE_BYTES) {
      return t("users.avatar.too_large", `El archivo excede ${MAX_SIZE_MB}MB.`);
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      alert(error);
      return;
    }
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewFile(file);
    setPreviewUrl(url);
  };

  const handleConfirmUpload = async () => {
    if (previewFile) {
      await onAvatarChange(previewFile);
      handleCancelPreview();
    }
  };

  const handleCancelPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewFile(null);
    setPreviewUrl(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading && !previewUrl) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled || isUploading || previewUrl) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowRemoveConfirm(true);
  };

  const handleConfirmRemove = async () => {
    if (onAvatarRemove) {
      await onAvatarRemove();
    }
    setShowRemoveConfirm(false);
  };

  // Styles
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "var(--space-2)",
  };

  const avatarContainerStyle: React.CSSProperties = {
    position: "relative",
    width: "88px",
    height: "88px",
    cursor: disabled || isUploading || previewUrl ? "default" : "pointer",
  };

  const avatarStyle: React.CSSProperties = {
    width: "88px",
    height: "88px",
    borderRadius: "50%",
    backgroundColor,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "var(--font-size-2xl)",
    fontWeight: 600,
    color: "white",
    overflow: "hidden",
    border: dragOver 
      ? "3px dashed var(--color-primary)" 
      : previewUrl 
        ? "3px solid var(--color-primary)" 
        : "3px solid var(--color-grey-200)",
    transition: "all 150ms ease",
    boxShadow: previewUrl ? "0 0 0 4px var(--color-primary-light)" : "none",
  };

  const overlayStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    borderRadius: "50%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0,
    transition: "opacity 150ms ease",
  };

  const imageStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  };

  const removeButtonStyle: React.CSSProperties = {
    position: "absolute",
    top: "-2px",
    right: "-2px",
    width: "26px",
    height: "26px",
    borderRadius: "50%",
    backgroundColor: "var(--color-red-500)",
    border: "2px solid white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "white",
    padding: 0,
    transition: "transform 150ms ease, background-color 150ms ease",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "var(--font-size-xs)",
    color: "var(--color-primary)",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: "var(--space-1)",
    cursor: disabled || isUploading ? "default" : "pointer",
    padding: "var(--space-1) var(--space-2)",
    borderRadius: "var(--radius-sm)",
    transition: "background-color 150ms ease",
  };

  const previewActionsStyle: React.CSSProperties = {
    display: "flex",
    gap: "var(--space-2)",
    marginTop: "var(--space-1)",
  };

  const confirmOverlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10000,
  };

  const confirmDialogStyle: React.CSSProperties = {
    backgroundColor: "var(--color-bg-primary)",
    borderRadius: "var(--radius-lg)",
    padding: "var(--space-6)",
    maxWidth: "320px",
    width: "90%",
    boxShadow: "var(--shadow-xl)",
  };

  return (
    <>
      <div style={containerStyle}>
        <div
          style={avatarContainerStyle}
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !previewUrl) {
              handleClick();
            }
          }}
          aria-label={t("users.avatar.change", "Cambiar avatar")}
        >
          <div style={avatarStyle}>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={t("users.avatar.preview", "Vista previa")}
                style={imageStyle}
              />
            ) : avatarUrl && !imageError ? (
              <img
                src={avatarUrl}
                alt={initials}
                style={imageStyle}
                onError={() => setImageError(true)}
              />
            ) : (
              initials
            )}
          </div>

          {/* Hover overlay - only show when not in preview mode */}
          {!disabled && !isUploading && !previewUrl && (
            <div
              style={overlayStyle}
              className="avatar-editor-overlay"
            >
              <Camera size={24} color="white" />
            </div>
          )}

          {/* Loading overlay */}
          {isUploading && (
            <div style={{ ...overlayStyle, opacity: 1 }}>
              <SpinnerGap size={24} color="white" className="animate-spin" />
            </div>
          )}

          {/* Remove button - only show when has avatar and not in preview */}
          {avatarUrl && !disabled && !isUploading && onAvatarRemove && !previewUrl && (
            <button
              type="button"
              style={removeButtonStyle}
              onClick={handleRemoveClick}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.1)";
                e.currentTarget.style.backgroundColor = "var(--color-red-600)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.backgroundColor = "var(--color-red-500)";
              }}
              aria-label={t("users.avatar.remove", "Eliminar avatar")}
            >
              <Trash size={12} />
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            onChange={handleInputChange}
            style={{ display: "none" }}
            aria-hidden="true"
          />
        </div>

        {/* Label or Preview Actions */}
        {previewUrl ? (
          <div style={previewActionsStyle}>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelPreview}
              disabled={isUploading}
            >
              <X size={16} />
              {t("common.cancel", "Cancelar")}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmUpload}
              isLoading={isUploading}
              loadingText={t("users.avatar.uploading", "Subiendo...")}
            >
              <Check size={16} />
              {t("users.avatar.confirm", "Aplicar")}
            </Button>
          </div>
        ) : (
          !disabled && (
            <button
              type="button"
              style={labelStyle}
              onClick={handleClick}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-primary-light)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              disabled={isUploading}
            >
              <ImageSquare size={14} />
              {avatarUrl 
                ? t("users.avatar.change_photo", "Cambiar foto")
                : t("users.avatar.add_photo", "Añadir foto")
              }
            </button>
          )
        )}

        <style>{`
          .avatar-editor-overlay {
            opacity: 0;
          }
          div:hover > .avatar-editor-overlay {
            opacity: 1;
          }
        `}</style>
      </div>

      {/* Remove Confirmation Dialog */}
      {showRemoveConfirm && (
        <div 
          style={confirmOverlayStyle}
          onClick={() => setShowRemoveConfirm(false)}
        >
          <div 
            style={confirmDialogStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "var(--space-3)",
              marginBottom: "var(--space-4)"
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: "var(--color-red-100)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-red-600)",
              }}>
                <Trash size={20} />
              </div>
              <div>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: "var(--font-size-md)",
                  fontWeight: 600,
                  color: "var(--color-text-primary)"
                }}>
                  {t("users.avatar.remove_title", "¿Eliminar foto?")}
                </h3>
              </div>
            </div>
            
            <p style={{ 
              margin: "0 0 var(--space-5) 0",
              fontSize: "var(--font-size-sm)",
              color: "var(--color-text-secondary)",
              lineHeight: 1.5
            }}>
              {t("users.avatar.remove_description", "La foto de perfil será eliminada. Esta acción no se puede deshacer.")}
            </p>
            
            <div style={{ 
              display: "flex", 
              justifyContent: "flex-end", 
              gap: "var(--space-3)" 
            }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRemoveConfirm(false)}
                disabled={isUploading}
              >
                {t("common.cancel", "Cancelar")}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmRemove}
                isLoading={isUploading}
              >
                <Trash size={14} />
                {t("users.avatar.remove_confirm", "Eliminar")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AvatarEditor;
