import React, { useState } from "react";
import { useTranslation } from "react-i18next";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}) => {
  const { t } = useTranslation();

  const getPaginationPages = () => {
    const pages: number[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      for (let i = 1; i <= maxVisible; i++) pages.push(i);
    } else if (currentPage >= totalPages - 2) {
      for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) pages.push(i);
    } else {
      for (let i = currentPage - 2; i <= currentPage + 2; i++) pages.push(i);
    }
    return pages;
  };

  const containerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "2rem",
    padding: "1rem 0",
  };

  const infoStyle: React.CSSProperties = {
    fontSize: "0.875rem",
    color: "var(--color-grey-500)",
    margin: 0,
  };

  const controlsStyle: React.CSSProperties = {
    display: "flex",
    gap: "0.25rem",
  };

  const PageButton: React.FC<{
    page: number | string;
    isActive?: boolean;
    disabled?: boolean;
    onClick: () => void;
  }> = ({ page, isActive = false, disabled = false, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);

    const buttonStyle: React.CSSProperties = {
      height: "var(--button-height-sm)",
      minWidth: "var(--button-height-sm)",
      padding: "0 0.5rem",
      fontSize: "0.875rem",
      fontWeight: isActive ? 600 : 400,
      color: isActive
        ? "var(--color-primary)"
        : disabled
          ? "var(--color-grey-300)"
          : "var(--color-grey-600)",
      backgroundColor: isActive
        ? "var(--color-red-050)"
        : isHovered && !disabled
          ? "var(--color-grey-050)"
          : "transparent",
      border: "none",
      borderRadius: "var(--radius-md)",
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "all var(--transition-fast)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    };

    return (
      <button
        style={buttonStyle}
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {page}
      </button>
    );
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div style={containerStyle}>
      <p style={infoStyle}>
        {t("dashboard.events_view.pagination.showing", "Mostrando")}{" "}
        <strong>{startItem}</strong> - <strong>{endItem}</strong>{" "}
        {t("dashboard.events_view.pagination.of", "de")}{" "}
        <strong>{totalItems}</strong>{" "}
        {t("dashboard.events_view.pagination.events", "eventos")}
      </p>
      <div style={controlsStyle}>
        <PageButton
          page="←"
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        />
        {getPaginationPages().map((page) => (
          <PageButton
            key={page}
            page={page}
            isActive={currentPage === page}
            onClick={() => onPageChange(page)}
          />
        ))}
        <PageButton
          page="→"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        />
      </div>
    </div>
  );
};
