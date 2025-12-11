import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Camera, SpinnerGap, Trash } from "@phosphor-icons/react";
import { getInitials, getAvatarColor, type UserLike } from "@/lib/userUtils";

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

  const initials = getInitials(user);
  const backgroundColor = getAvatarColor(user.email);
  const avatarUrl = user.profile?.avatar;

  const handleClick = () => {
    if (!disabled && !isUploading) {
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

  const handleFileSelect = async (file: File) => {
    const error = validateFile(file);
    if (error) {
      alert(error);
      return;
    }
    await onAvatarChange(file);
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileSelect(file);
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled || isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleFileSelect(file);
    }
  };

  const containerStyle: React.CSSProperties = {
    position: "relative",
    width: "80px",
    height: "80px",
    cursor: disabled || isUploading ? "default" : "pointer",
  };

  const avatarStyle: React.CSSProperties = {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    backgroundColor,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "var(--font-size-2xl)",
    fontWeight: 600,
    color: "white",
    overflow: "hidden",
    border: dragOver ? "2px dashed var(--color-red-500)" : "2px solid transparent",
    transition: "border-color 150ms ease",
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
    top: "-4px",
    right: "-4px",
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    backgroundColor: "var(--color-red-500)",
    border: "2px solid white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "white",
    padding: 0,
  };

  return (
    <div
      style={containerStyle}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleClick();
        }
      }}
      aria-label={t("users.avatar.change", "Cambiar avatar")}
    >
      <div style={avatarStyle}>
        {avatarUrl && !imageError ? (
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

      {/* Hover overlay */}
      {!disabled && !isUploading && (
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

      {/* Remove button */}
      {avatarUrl && !disabled && !isUploading && onAvatarRemove && (
        <button
          type="button"
          style={removeButtonStyle}
          onClick={(e) => {
            e.stopPropagation();
            onAvatarRemove();
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

      <style>{`
        .avatar-editor-overlay {
          opacity: 0;
        }
        div:hover > .avatar-editor-overlay {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default AvatarEditor;
