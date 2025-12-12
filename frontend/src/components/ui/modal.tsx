/**
 * Modal Component - Refactoring UI Design System
 *
 * Componente base para modales con compound pattern.
 * Unifica los 3+ patrones de modales que existían en el proyecto.
 *
 * @example
 * <Modal isOpen={isOpen} onClose={close} size="md">
 *   <Modal.Header title="Cambiar Contraseña" icon={<Key />} />
 *   <Modal.Body>
 *     {content}
 *   </Modal.Body>
 *   <Modal.Footer>
 *     <Button variant="ghost" onClick={close}>Cancelar</Button>
 *     <Button variant="primary">Guardar</Button>
 *   </Modal.Footer>
 * </Modal>
 */
import React, { useEffect, useRef, useCallback } from "react";
import { X } from "@phosphor-icons/react";
import { Button } from "./button";
import "./modal.css";

// ============================================
// Types
// ============================================

type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    size?: ModalSize;
    closeOnOverlay?: boolean;
    closeOnEscape?: boolean;
    preventClose?: boolean;
    className?: string;
    children: React.ReactNode;
}

interface ModalHeaderProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    iconVariant?: "primary" | "info" | "success" | "warning" | "danger";
    onClose?: () => void;
    showCloseButton?: boolean;
    className?: string;
}

interface ModalBodyProps {
    className?: string;
    children: React.ReactNode;
}

interface ModalFooterProps {
    className?: string;
    children: React.ReactNode;
}

// ============================================
// Modal Context
// ============================================

const ModalContext = React.createContext<{
    onClose: () => void;
    preventClose: boolean;
} | null>(null);

const useModalContext = () => {
    const context = React.useContext(ModalContext);
    if (!context) {
        throw new Error("Modal compound components must be used within Modal");
    }
    return context;
};

// ============================================
// Modal Component
// ============================================

export const Modal: React.FC<ModalProps> & {
    Header: React.FC<ModalHeaderProps>;
    Body: React.FC<ModalBodyProps>;
    Footer: React.FC<ModalFooterProps>;
} = ({
    isOpen,
    onClose,
    size = "md",
    closeOnOverlay = true,
    closeOnEscape = true,
    preventClose = false,
    className = "",
    children,
}) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);

    // Handle escape key
    const handleEscape = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape" && closeOnEscape && !preventClose) {
                onClose();
            }
        },
        [closeOnEscape, preventClose, onClose]
    );

    // Handle overlay click
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && closeOnOverlay && !preventClose) {
            onClose();
        }
    };

    // Lock body scroll and manage focus
    useEffect(() => {
        if (isOpen) {
            previousActiveElement.current = document.activeElement as HTMLElement;
            document.body.style.overflow = "hidden";
            document.addEventListener("keydown", handleEscape);

            // Focus modal
            setTimeout(() => {
                modalRef.current?.focus();
            }, 50);
        } else {
            document.body.style.overflow = "";
            document.removeEventListener("keydown", handleEscape);

            // Restore focus
            if (previousActiveElement.current) {
                previousActiveElement.current.focus();
            }
        }

        return () => {
            document.body.style.overflow = "";
            document.removeEventListener("keydown", handleEscape);
        };
    }, [isOpen, handleEscape]);

    if (!isOpen) return null;

    return (
        <ModalContext.Provider value={{ onClose, preventClose }}>
            <div className="rui-modal-overlay" onClick={handleOverlayClick}>
                <div
                    ref={modalRef}
                    className={`rui-modal rui-modal--${size} ${className}`}
                    role="dialog"
                    aria-modal="true"
                    tabIndex={-1}
                    onClick={(e) => e.stopPropagation()}
                >
                    {children}
                </div>
            </div>
        </ModalContext.Provider>
    );
};

// ============================================
// Modal.Header
// ============================================

const ModalHeader: React.FC<ModalHeaderProps> = ({
    title,
    subtitle,
    icon,
    iconVariant = "primary",
    onClose,
    showCloseButton = true,
    className = "",
}) => {
    const { onClose: contextOnClose, preventClose } = useModalContext();
    const handleClose = onClose || contextOnClose;

    return (
        <div className={`rui-modal__header ${className}`}>
            {icon && (
                <div className={`rui-modal__header-icon rui-modal__header-icon--${iconVariant}`}>
                    {icon}
                </div>
            )}
            <div className="rui-modal__header-content">
                <h2 className="rui-modal__header-title">{title}</h2>
                {subtitle && (
                    <p className="rui-modal__header-subtitle">{subtitle}</p>
                )}
            </div>
            {showCloseButton && !preventClose && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className="rui-modal__close"
                    aria-label="Cerrar modal"
                >
                    <X size={18} />
                </Button>
            )}
        </div>
    );
};

Modal.Header = ModalHeader;

// ============================================
// Modal.Body
// ============================================

const ModalBody: React.FC<ModalBodyProps> = ({ className = "", children }) => {
    return <div className={`rui-modal__body ${className}`}>{children}</div>;
};

Modal.Body = ModalBody;

// ============================================
// Modal.Footer
// ============================================

const ModalFooter: React.FC<ModalFooterProps> = ({
    className = "",
    children,
}) => {
    return <div className={`rui-modal__footer ${className}`}>{children}</div>;
};

Modal.Footer = ModalFooter;

export default Modal;
