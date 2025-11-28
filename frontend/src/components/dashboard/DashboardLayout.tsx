import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { DashboardHeader } from "./DashboardHeader";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

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
    <div className="flex h-screen overflow-hidden bg-gray-50/50">
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
        />
        <main id="main-content" className="flex-1 overflow-y-auto" tabIndex={-1}>
          <div className="w-full px-6 py-6 lg:px-10">{children}</div>
        </main>
      </div>

      {/* Keyboard Shortcuts Help Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Atajos de Teclado
              </h3>
              <button
                onClick={closeHelp}
                className="rounded-full p-1 hover:bg-gray-100"
              >
                <span className="sr-only">Cerrar</span>
                <svg
                  className="h-5 w-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-600">Mostrar ayuda</span>
                <kbd className="rounded bg-gray-100 px-2 py-1 text-xs font-mono text-gray-800">
                  ?
                </kbd>
              </div>
              {shortcuts.map((shortcut) => (
                <div
                  key={shortcut.key}
                  className="flex justify-between border-b border-gray-100 pb-2 last:border-0"
                >
                  <span className="text-gray-600">{shortcut.description}</span>
                  <kbd className="rounded bg-gray-100 px-2 py-1 text-xs font-mono text-gray-800">
                    {shortcut.key.toUpperCase()}
                  </kbd>
                </div>
              ))}
            </div>
            <div className="mt-6 text-center text-xs text-gray-400">
              Presiona <kbd className="font-mono">Esc</kbd> para cerrar
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
