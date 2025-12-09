import React from "react";
import { useTranslation } from "react-i18next";
import type { Event, EventStatus } from "@/types/event";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

interface EventTableProps {
  events: Event[];
  onNavigate?: (path: string) => void;
  pagination?: PaginationProps;
}

export const EventTable: React.FC<EventTableProps> = ({ events, onNavigate, pagination }) => {
  const { t } = useTranslation();

  // TODO: Implementar nueva UI
  return null;
};
