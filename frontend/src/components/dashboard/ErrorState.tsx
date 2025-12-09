import React from "react";
import { WarningCircle, ArrowClockwise } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

/**
 * ErrorState Component
 * Displays an error message with retry button
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  onRetry,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="rounded-full bg-red-100 p-3 mb-4">
        <WarningCircle size={32} className="text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-grey-900 mb-2">
        {t("error_state.title")}
      </h3>
      <p className="text-sm text-grey-500 text-center mb-6 max-w-md">
        {message || t("error_state.default_message")}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <ArrowClockwise size={16} />
          {t("error_state.retry")}
        </Button>
      )}
    </div>
  );
};
