/**
 * DataField Component - Refactoring UI Design System
 *
 * Componente para mostrar campos de datos en modo lectura.
 * Unifica los patrones ReadOnlyField del proyecto.
 *
 * @example
 * <DataField label="Correo" value={email} />
 * <DataField label="Teléfono" value={phone} copyable />
 * <DataField label="Contraseña" value="••••••••" type="secret" action={<Button>Cambiar</Button>} />
 */
import React, { useState } from "react";
import { Copy, Check, Eye, EyeSlash } from "@phosphor-icons/react";
import "./data-field.css";

// ============================================
// Types
// ============================================

interface DataFieldProps {
    label: string;
    value: string | React.ReactNode;
    type?: "text" | "secret" | "mono";
    copyable?: boolean;
    action?: React.ReactNode;
    hint?: string;
    icon?: React.ReactNode;
    className?: string;
    emptyText?: string;
}

// ============================================
// DataField Component
// ============================================

export const DataField: React.FC<DataFieldProps> = ({
    label,
    value,
    type = "text",
    copyable = false,
    action,
    hint,
    icon,
    className = "",
    emptyText = "-",
}) => {
    const [copied, setCopied] = useState(false);
    const [revealed, setRevealed] = useState(false);

    const handleCopy = async () => {
        if (typeof value === "string") {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const displayValue = () => {
        if (!value) return emptyText;

        if (type === "secret" && !revealed) {
            return "••••••••••••";
        }

        return value;
    };

    const classes = [
        "rui-data-field",
        type === "mono" ? "rui-data-field--mono" : "",
        className,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div className={classes}>
            <span className="rui-data-field__label">{label}</span>
            <div className="rui-data-field__value-wrapper">
                {icon && <span className="rui-data-field__icon">{icon}</span>}
                <div
                    className={`rui-data-field__value ${
                        type === "mono" ? "rui-data-field__value--mono" : ""
                    }`}
                >
                    {displayValue()}
                </div>

                <div className="rui-data-field__actions">
                    {type === "secret" && typeof value === "string" && value && (
                        <button
                            type="button"
                            className="rui-data-field__action-btn"
                            onClick={() => setRevealed(!revealed)}
                            aria-label={revealed ? "Ocultar" : "Mostrar"}
                        >
                            {revealed ? <EyeSlash size={16} /> : <Eye size={16} />}
                        </button>
                    )}

                    {copyable && typeof value === "string" && value && (
                        <button
                            type="button"
                            className="rui-data-field__action-btn"
                            onClick={handleCopy}
                            aria-label={copied ? "Copiado" : "Copiar"}
                        >
                            {copied ? (
                                <Check size={16} weight="bold" />
                            ) : (
                                <Copy size={16} />
                            )}
                        </button>
                    )}

                    {action}
                </div>
            </div>
            {hint && <span className="rui-data-field__hint">{hint}</span>}
        </div>
    );
};

// ============================================
// DataFieldGroup - For displaying multiple fields in a grid
// ============================================

interface DataFieldGroupProps {
    columns?: 1 | 2 | 3 | 4;
    className?: string;
    children: React.ReactNode;
}

export const DataFieldGroup: React.FC<DataFieldGroupProps> = ({
    columns = 2,
    className = "",
    children,
}) => {
    return (
        <div
            className={`rui-data-field-group rui-data-field-group--cols-${columns} ${className}`}
        >
            {children}
        </div>
    );
};

export default DataField;
