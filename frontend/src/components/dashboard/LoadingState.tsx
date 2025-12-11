import React from "react";
import { CircleNotch } from "@phosphor-icons/react";

interface LoadingStateProps {
  message?: string;
}

/**
 * LoadingState Component
 * Displays a loading spinner with optional message
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Cargando...",
}) => {
  return (
    <div
      className="flex flex-col items-center justify-center py-12"
      role="status"
      aria-live="polite"
    >
      <CircleNotch size={32} className="animate-spin text-primary" />
      <p className="mt-4 text-sm text-grey-500">{message}</p>
      <span className="sr-only">Cargando...</span>
    </div>
  );
};

/**
 * LoadingCard Component
 * Skeleton loading state for cards
 */
export const LoadingCard: React.FC = () => {
  return (
    <div className="rounded-xl border border-grey-200 bg-white p-6 shadow-sm">
      <div className="animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-grey-200 rounded w-24"></div>
          <div className="h-10 w-10 bg-grey-200 rounded-full"></div>
        </div>
        <div className="h-8 bg-grey-200 rounded w-16 mb-2"></div>
        <div className="h-3 bg-grey-200 rounded w-32"></div>
      </div>
    </div>
  );
};
