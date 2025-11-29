import React, { useState } from "react";
import { X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { DashboardHeader } from "./DashboardHeader";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  currentPath?: string;
  onNavigate?: (href: string) => void;
}

/**
 * DashboardLayout Component
 * Main layout wrapper for the dashboard with sidebar and header
 *
 * Features:
 * - Responsive sidebar (off-canvas on mobile)
 * - Sticky header
 * - Smooth transitions
 * - Mobile overlay
 */
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  breadcrumbs,
  currentPath,
  onNavigate,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Define shortcuts
  const shortcuts = [
    {
      key: "h",
      description: "Ir al inicio (Dashboard)",
      action: () => onNavigate?.("/dashboard"),
    },
    {
      key: "e",
      description: "Ir a Eventos",
      action: () => onNavigate?.("/dashboard/events"),
    },
    {
      key: "n",
      description: "Nuevo Evento",
      action: () => onNavigate?.("/dashboard/events/new"),
    },
  ];

  const { isHelpOpen, closeHelp } = useKeyboardShortcuts(shortcuts);

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      {/* Skip to content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:p-4 focus:bg-white focus:text-primary focus:shadow-lg"
      >
        Saltar al contenido principal
      </a>

      {/* Sidebar - Desktop: Fixed, Mobile: Off-canvas */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar currentPath={currentPath} onNavigate={onNavigate} />
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader
          onMenuClick={() => setIsSidebarOpen(true)}
          title={title}
          breadcrumbs={breadcrumbs}
          onNavigate={onNavigate}
        />
        <main id="main-content" className="flex-1 overflow-y-auto" tabIndex={-1}>
          <div className="mx-auto w-full max-w-7xl px-6 py-6 lg:px-10">{children}</div>
        </main>
      </div>

      {/* Keyboard Shortcuts Help Modal */}
      <Dialog open={isHelpOpen} onOpenChange={closeHelp}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Atajos de Teclado</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground">Mostrar ayuda</span>
              <kbd className="rounded bg-muted px-2 py-1 text-xs font-mono">?</kbd>
            </div>
            {shortcuts.map((shortcut) => (
              <div
                key={shortcut.key}
                className="flex items-center justify-between border-b pb-2 last:border-0"
              >
                <span className="text-muted-foreground">{shortcut.description}</span>
                <kbd className="rounded bg-muted px-2 py-1 text-xs font-mono">
                  {shortcut.key.toUpperCase()}
                </kbd>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Presiona <kbd className="font-mono">Esc</kbd> para cerrar
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
};
