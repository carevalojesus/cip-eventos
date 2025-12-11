import React from "react";
import { useTranslation } from "react-i18next";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  pageNumbers: number[];
  onPageChange: (page: number) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  isFirstPage: boolean;
  isLastPage: boolean;
  itemLabel?: string;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  pageNumbers,
  onPageChange,
  onNextPage,
  onPrevPage,
  isFirstPage,
  isLastPage,
  itemLabel,
}) => {
  const { t } = useTranslation();

  const label = itemLabel || t("common.items", "elementos");

  const containerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "var(--space-4) 0",
    marginTop: "var(--space-4)",
  };

  const infoStyle: React.CSSProperties = {
    fontSize: "var(--font-size-sm)",
    color: "var(--color-text-muted)",
  };

  const buttonsStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-2)",
  };

  const pageButtonStyle = (isActive: boolean = false, isDisabled: boolean = false): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "32px",
    height: "32px",
    padding: "0 var(--space-2)",
    fontSize: "var(--font-size-sm)",
    fontWeight: isActive ? 600 : 400,
    color: isDisabled
      ? "var(--color-grey-400)"
      : isActive
      ? "var(--color-primary)"
      : "var(--color-text-primary)",
    backgroundColor: isActive ? "var(--color-red-050)" : "transparent",
    border: "1px solid transparent",
    borderRadius: "var(--radius-md)",
    cursor: isDisabled ? "not-allowed" : "pointer",
    transition: "all 150ms ease",
  });

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div style={containerStyle}>
      <div style={infoStyle}>
        {t("common.pagination.showing", "Mostrando")} {startIndex}-{endIndex}{" "}
        {t("common.pagination.of", "de")} {totalItems} {label}
      </div>
      <div style={buttonsStyle}>
        <button
          style={pageButtonStyle(false, isFirstPage)}
          onClick={onPrevPage}
          disabled={isFirstPage}
          aria-label={t("common.pagination.previous", "Anterior")}
        >
          <CaretLeft size={18} />
        </button>

        {pageNumbers.map((pageNum) => (
          <button
            key={pageNum}
            style={pageButtonStyle(currentPage === pageNum)}
            onClick={() => onPageChange(pageNum)}
          >
            {pageNum}
          </button>
        ))}

        <button
          style={pageButtonStyle(false, isLastPage)}
          onClick={onNextPage}
          disabled={isLastPage}
          aria-label={t("common.pagination.next", "Siguiente")}
        >
          <CaretRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default TablePagination;
