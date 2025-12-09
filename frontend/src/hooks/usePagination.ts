import { useState, useMemo, useCallback, useEffect } from "react";

/**
 * usePagination - A reusable hook for managing pagination state
 *
 * @example
 * ```tsx
 * const {
 *   currentPage,
 *   setCurrentPage,
 *   paginatedItems,
 *   totalPages,
 *   pageNumbers,
 *   goToNextPage,
 *   goToPrevPage,
 *   startIndex,
 *   endIndex,
 *   isFirstPage,
 *   isLastPage
 * } = usePagination({
 *   items: users,
 *   itemsPerPage: 10
 * });
 * ```
 */
export interface UsePaginationOptions<T> {
  items: T[];
  itemsPerPage?: number;
  initialPage?: number;
  maxPageButtons?: number;
}

export interface UsePaginationReturn<T> {
  currentPage: number;
  setCurrentPage: (page: number) => void;
  paginatedItems: T[];
  totalPages: number;
  totalItems: number;
  pageNumbers: number[];
  goToNextPage: () => void;
  goToPrevPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  startIndex: number;
  endIndex: number;
  isFirstPage: boolean;
  isLastPage: boolean;
  hasMultiplePages: boolean;
  itemsPerPage: number;
}

export function usePagination<T>({
  items,
  itemsPerPage = 10,
  initialPage = 1,
  maxPageButtons = 5,
}: UsePaginationOptions<T>): UsePaginationReturn<T> {
  const [currentPage, setCurrentPageState] = useState(initialPage);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(items.length / itemsPerPage));
  }, [items.length, itemsPerPage]);

  // Reset to page 1 when items change significantly
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPageState(Math.max(1, totalPages));
    }
  }, [totalPages, currentPage]);

  // Safe page setter
  const setCurrentPage = useCallback(
    (page: number) => {
      const safePage = Math.max(1, Math.min(page, totalPages));
      setCurrentPageState(safePage);
    },
    [totalPages]
  );

  // Get paginated items
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  }, [items, currentPage, itemsPerPage]);

  // Calculate page numbers to display
  const pageNumbers = useMemo(() => {
    if (totalPages <= maxPageButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const halfButtons = Math.floor(maxPageButtons / 2);
    let start = Math.max(1, currentPage - halfButtons);
    let end = Math.min(totalPages, start + maxPageButtons - 1);

    // Adjust if we're near the end
    if (end === totalPages) {
      start = Math.max(1, end - maxPageButtons + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [totalPages, currentPage, maxPageButtons]);

  // Navigation helpers
  const goToNextPage = useCallback(() => {
    setCurrentPage(currentPage + 1);
  }, [currentPage, setCurrentPage]);

  const goToPrevPage = useCallback(() => {
    setCurrentPage(currentPage - 1);
  }, [currentPage, setCurrentPage]);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, [setCurrentPage]);

  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages, setCurrentPage]);

  // Index calculations (1-based for display)
  const startIndex = useMemo(() => {
    if (items.length === 0) return 0;
    return (currentPage - 1) * itemsPerPage + 1;
  }, [currentPage, itemsPerPage, items.length]);

  const endIndex = useMemo(() => {
    return Math.min(currentPage * itemsPerPage, items.length);
  }, [currentPage, itemsPerPage, items.length]);

  // Boolean helpers
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;
  const hasMultiplePages = totalPages > 1;

  return {
    currentPage,
    setCurrentPage,
    paginatedItems,
    totalPages,
    totalItems: items.length,
    pageNumbers,
    goToNextPage,
    goToPrevPage,
    goToFirstPage,
    goToLastPage,
    startIndex,
    endIndex,
    isFirstPage,
    isLastPage,
    hasMultiplePages,
    itemsPerPage,
  };
}

export default usePagination;
