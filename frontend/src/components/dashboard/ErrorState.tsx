import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

/**
 * ErrorState Component
 * Displays an error message with retry button
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  message = "Ocurrió un error al cargar los datos",
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="rounded-full bg-red-100 p-3 mb-4">
        <AlertCircle className="h-8 w-8 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Error al cargar datos
      </h3>
      <p className="text-sm text-gray-500 text-center mb-6 max-w-md">
        {message}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Reintentar
        </Button>
      )}
    </div>
  );
};
