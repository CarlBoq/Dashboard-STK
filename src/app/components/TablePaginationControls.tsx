import { useEffect, useState } from 'react';
import { Button } from './ui/button';

interface TablePaginationControlsProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPrevious: () => void;
  onNext: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}

export function TablePaginationControls({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPrevious,
  onNext,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: TablePaginationControlsProps) {
  const [pageInput, setPageInput] = useState(String(currentPage));

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const applyPageInput = () => {
    const parsed = Number(pageInput);
    if (!Number.isFinite(parsed)) {
      setPageInput(String(currentPage));
      return;
    }
    const clamped = Math.min(Math.max(1, Math.trunc(parsed)), totalPages);
    onPageChange(clamped);
    setPageInput(String(clamped));
  };

  return (
    <div className="px-4 py-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
      <div className="flex items-center gap-2">
        <span>Rows per page</span>
        <select
          value={String(pageSize)}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
        >
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onPrevious} disabled={currentPage <= 1}>
          Previous
        </Button>

        <div className="flex items-center gap-2">
          <span>Page</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={pageInput}
            onChange={(event) => setPageInput(event.target.value)}
            onBlur={applyPageInput}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                applyPageInput();
              }
            }}
            className="h-9 w-16 rounded-md border border-gray-300 px-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
          />
          <span>of {totalPages}</span>
        </div>

        <Button type="button" variant="outline" size="sm" onClick={onNext} disabled={currentPage >= totalPages}>
          Next
        </Button>
      </div>

      <div className="text-xs text-gray-500">Page {currentPage} of {totalPages} ({totalItems} rows)</div>
    </div>
  );
}
