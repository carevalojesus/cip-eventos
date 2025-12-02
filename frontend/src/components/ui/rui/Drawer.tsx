import React from "react";
import * as DrawerPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface DrawerContentProps {
  children: React.ReactNode;
  width?: "sm" | "md" | "lg";
  showClose?: boolean;
}

interface DrawerHeaderProps {
  children: React.ReactNode;
}

interface DrawerTitleProps {
  children: React.ReactNode;
}

interface DrawerDescriptionProps {
  children: React.ReactNode;
}

interface DrawerBodyProps {
  children: React.ReactNode;
}

interface DrawerFooterProps {
  children: React.ReactNode;
}

// Anchos siguiendo RUI
const widthMap = {
  sm: "360px",
  md: "420px",
  lg: "480px",
};

export const Drawer: React.FC<DrawerProps> = ({ open, onOpenChange, children }) => {
  return (
    <DrawerPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </DrawerPrimitive.Root>
  );
};

export const DrawerTrigger = DrawerPrimitive.Trigger;

export const DrawerContent: React.FC<DrawerContentProps> = ({
  children,
  width = "md",
  showClose = true,
}) => {
  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(39, 36, 29, 0.6)",
    zIndex: 9998,
    animation: "fadeIn 150ms ease-out",
  };

  const contentStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    maxWidth: widthMap[width],
    backgroundColor: "var(--color-bg-primary)",
    boxShadow: "-8px 0 30px rgba(0, 0, 0, 0.15)",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    animation: "slideInRight 200ms ease-out",
    outline: "none",
  };

  const closeButtonStyle: React.CSSProperties = {
    position: "absolute",
    top: "var(--space-4)",
    right: "var(--space-4)",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "var(--radius-md)",
    border: "none",
    background: "transparent",
    color: "var(--color-grey-400)",
    cursor: "pointer",
    transition: "all 150ms ease",
  };

  return (
    <DrawerPrimitive.Portal>
      <DrawerPrimitive.Overlay style={overlayStyle} />
      <DrawerPrimitive.Content style={contentStyle}>
        {showClose && (
          <DrawerPrimitive.Close
            style={closeButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--color-grey-100)";
              e.currentTarget.style.color = "var(--color-grey-600)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--color-grey-400)";
            }}
          >
            <X size={18} />
          </DrawerPrimitive.Close>
        )}
        {children}
      </DrawerPrimitive.Content>
    </DrawerPrimitive.Portal>
  );
};

export const DrawerHeader: React.FC<DrawerHeaderProps> = ({ children }) => {
  const headerStyle: React.CSSProperties = {
    padding: "var(--space-5) var(--space-6)",
    paddingRight: "var(--space-12)", // Espacio para el botón de cerrar
    borderBottom: "1px solid var(--color-grey-100)",
    flexShrink: 0,
  };

  return <div style={headerStyle}>{children}</div>;
};

export const DrawerTitle: React.FC<DrawerTitleProps> = ({ children }) => {
  const titleStyle: React.CSSProperties = {
    fontSize: "var(--font-size-lg)",
    fontWeight: 600,
    color: "var(--color-text-primary)",
    margin: 0,
    lineHeight: "var(--line-height-tight)",
  };

  return (
    <DrawerPrimitive.Title style={titleStyle}>
      {children}
    </DrawerPrimitive.Title>
  );
};

export const DrawerDescription: React.FC<DrawerDescriptionProps> = ({ children }) => {
  const descStyle: React.CSSProperties = {
    fontSize: "var(--font-size-sm)",
    color: "var(--color-text-muted)",
    marginTop: "var(--space-1)",
    lineHeight: "var(--line-height-normal)",
  };

  return (
    <DrawerPrimitive.Description style={descStyle}>
      {children}
    </DrawerPrimitive.Description>
  );
};

export const DrawerBody: React.FC<DrawerBodyProps> = ({ children }) => {
  const bodyStyle: React.CSSProperties = {
    flex: 1,
    overflowY: "auto",
    padding: "var(--space-5) var(--space-6)",
  };

  return <div style={bodyStyle}>{children}</div>;
};

export const DrawerFooter: React.FC<DrawerFooterProps> = ({ children }) => {
  const footerStyle: React.CSSProperties = {
    padding: "var(--space-4) var(--space-6)",
    borderTop: "1px solid var(--color-grey-100)",
    display: "flex",
    justifyContent: "flex-end",
    gap: "var(--space-3)",
    flexShrink: 0,
    backgroundColor: "var(--color-grey-050)",
  };

  return <div style={footerStyle}>{children}</div>;
};

export const DrawerClose = DrawerPrimitive.Close;
