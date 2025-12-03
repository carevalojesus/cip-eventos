import React, { forwardRef, useState, type TextareaHTMLAttributes } from "react";

type TextareaSize = "sm" | "md" | "lg";

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  textareaSize?: TextareaSize;
  maxLength?: number;
  showCounter?: boolean;
}

const sizeConfig: Record<TextareaSize, { fontSize: string; minHeight: string }> = {
  sm: { fontSize: "var(--font-size-xs)", minHeight: "80px" },
  md: { fontSize: "var(--font-size-sm)", minHeight: "120px" },
  lg: { fontSize: "var(--font-size-sm)", minHeight: "160px" },
};

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  (
    {
      label,
      error,
      hint,
      required,
      textareaSize = "md",
      maxLength,
      showCounter = false,
      id,
      style,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const [charCount, setCharCount] = useState(
      typeof value === "string" ? value.length : 0
    );
    const [isFocused, setIsFocused] = useState(false);

    const textareaId = id || props.name;
    const errorId = error ? `${textareaId}-error` : undefined;
    const { fontSize, minHeight } = sizeConfig[textareaSize];

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      onChange?.(e);
    };

    const isOverLimit = maxLength ? charCount > maxLength : false;
    const isNearLimit = maxLength ? charCount > maxLength - 20 : false;

    const containerStyle: React.CSSProperties = {
      display: "flex",
      flexDirection: "column",
      gap: "var(--form-label-gap)",
      width: "100%",
    };

    const labelStyle: React.CSSProperties = {
      fontSize: "var(--font-size-sm)",
      fontWeight: 500,
      color: "var(--color-grey-700)",
      lineHeight: 1.5,
    };

    const requiredStyle: React.CSSProperties = {
      color: "var(--color-red-600)",
      marginLeft: "var(--space-1)",
    };

    const textareaStyle: React.CSSProperties = {
      width: "100%",
      minHeight,
      padding: "var(--space-3) var(--space-4)",
      fontSize,
      color: "var(--color-grey-900)",
      backgroundColor: "var(--color-white)",
      border: `1px solid ${error || isOverLimit ? "var(--color-red-600)" : isFocused ? "var(--color-grey-400)" : "var(--color-grey-300)"}`,
      borderRadius: "var(--radius-lg)",
      outline: "none",
      resize: "vertical",
      transition: "border-color 150ms ease, box-shadow 150ms ease",
      boxShadow: isFocused
        ? "0 0 0 3px var(--shadow-ring)"
        : "inset 0 2px 4px var(--shadow-sm)",
      fontFamily: "inherit",
      lineHeight: 1.5,
    };

    const footerStyle: React.CSSProperties = {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "var(--space-2)",
    };

    const hintStyle: React.CSSProperties = {
      fontSize: "var(--font-size-xs)",
      color: error ? "var(--color-red-600)" : "var(--color-grey-600)",
      flex: 1,
    };

    const counterStyle: React.CSSProperties = {
      fontSize: "var(--font-size-xs)",
      fontWeight: 500,
      color: isOverLimit ? "var(--color-red-600)" : isNearLimit ? "var(--color-orange-600)" : "var(--color-grey-600)",
      flexShrink: 0,
    };

    return (
      <div style={containerStyle}>
        {label && (
          <label htmlFor={textareaId} style={labelStyle}>
            {label}
            {required && <span style={requiredStyle}>*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          style={textareaStyle}
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          aria-invalid={!!error || isOverLimit}
          aria-describedby={errorId}
          {...props}
        />

        {(error || hint || showCounter) && (
          <div style={footerStyle}>
            <span id={errorId} style={hintStyle}>
              {error || hint}
            </span>
            {showCounter && maxLength && (
              <span style={counterStyle}>
                {charCount}/{maxLength}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

FormTextarea.displayName = "FormTextarea";
