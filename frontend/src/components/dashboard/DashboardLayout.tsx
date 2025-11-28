import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { DashboardHeader } from "./DashboardHeader";

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

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50/50">
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
        <main className="flex-1 overflow-y-auto">
          <div className="w-full px-6 py-6 lg:px-10">{children}</div>
        </main>
      </div>
    </div>
  );
};
