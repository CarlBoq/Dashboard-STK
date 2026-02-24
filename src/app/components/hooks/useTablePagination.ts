import { useEffect, useMemo, useState } from 'react';

export interface TablePaginationState<T> {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  paginatedItems: T[];
  goToPage: (page: number) => void;
  goToPreviousPage: () => void;
  goToNextPage: () => void;
  setPageSize: (size: number) => void;
}

export function useTablePagination<T>(items: T[], initialPageSize = 10): TablePaginationState<T> {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
  }, [items, currentPage, pageSize]);

  const goToPage = (page: number) => {
    if (!Number.isFinite(page)) return;
    const clamped = Math.min(Math.max(1, Math.trunc(page)), totalPages);
    setCurrentPage(clamped);
  };

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const setPageSize = (size: number) => {
    if (!Number.isFinite(size) || size <= 0) return;
    setPageSizeState(Math.trunc(size));
    setCurrentPage(1);
  };

  return {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    paginatedItems,
    goToPage,
    goToPreviousPage,
    goToNextPage,
    setPageSize,
  };
}
