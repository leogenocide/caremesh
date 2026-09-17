import { useState, useMemo } from 'react';

/**
 * usePagination Hook
 * Provides client-side pagination over an array of items.
 *
 * @param {Array} items - The full list of items to paginate
 * @param {number} initialPageSize - Initial number of items per page (default 10)
 * @returns {Object} pagination state and controls
 */
export function usePagination(items = [], initialPageSize = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalItems = Array.isArray(items) ? items.length : 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Ensure currentPage is strictly within valid bounds [1, totalPages]
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  // Slicing window
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginatedItems = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.slice(startIndex, endIndex);
  }, [items, startIndex, endIndex]);

  const setPage = (page) => {
    const p = Math.max(1, Math.min(totalPages, page));
    setCurrentPage(p);
  };

  const nextPage = () => {
    if (validCurrentPage < totalPages) {
      setCurrentPage(validCurrentPage + 1);
    }
  };

  const prevPage = () => {
    if (validCurrentPage > 1) {
      setCurrentPage(validCurrentPage - 1);
    }
  };

  const resetPage = () => {
    setCurrentPage(1);
  };

  const handlePageSizeChange = (newSize) => {
    const size = Math.max(1, parseInt(newSize, 10) || 10);
    setPageSize(size);
    setCurrentPage(1);
  };

  return {
    currentPage: validCurrentPage,
    pageSize,
    totalPages,
    totalItems,
    startIndex: totalItems > 0 ? startIndex + 1 : 0,
    endIndex,
    paginatedItems,
    setPage,
    setPageSize: handlePageSizeChange,
    nextPage,
    prevPage,
    resetPage,
    hasNext: validCurrentPage < totalPages,
    hasPrev: validCurrentPage > 1
  };
}
