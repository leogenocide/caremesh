import { ArrowLeft, ArrowRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/**
 * Reusable Pagination UI Component
 */
export const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  startIndex = 0,
  endIndex = 0,
  onPageChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  showPageSizeSelector = true,
  itemName = 'records',
  compact = false,
  showIfSinglePage
}) => {
  if (totalItems === 0) return null;

  // By default, compact mode hides pagination if there is only 1 page
  const shouldShowSinglePage = showIfSinglePage !== undefined ? showIfSinglePage : !compact;
  if (totalPages <= 1 && !shouldShowSinglePage) return null;

  // Generate page numbers with ellipses
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push('...');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  const btnSize = compact ? '24px' : '32px';
  const iconSize = compact ? 12 : 14;
  const fontSize = compact ? '0.75rem' : '0.82rem';

  return (
    <div 
      className={`d-flex align-center justify-between gap-2 flex-wrap ${compact ? 'pt-2 pb-0.5 mt-1' : 'pt-3 pb-1 mt-2'} border-top`} 
      style={{ width: '100%' }}
    >
      {/* Items range summary */}
      <div className={`${compact ? 'text-xs' : 'text-xs'} text-muted`} style={{ fontSize }}>
        Showing <span className="font-semibold text-primary">{startIndex}–{endIndex}</span> of <span className="font-semibold text-primary">{totalItems}</span> {itemName}
      </div>

      {/* Navigation Controls */}
      <div className="d-flex align-center gap-1 flex-wrap">
        {/* First page button */}
        {totalPages > 7 && (
          <button
            type="button"
            className="btn btn-ghost p-1"
            onClick={() => onPageChange(1)}
            disabled={currentPage <= 1}
            title="First page"
            aria-label="First page"
            style={{ width: btnSize, height: btnSize, minWidth: btnSize, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronsLeft size={iconSize} />
          </button>
        )}

        {/* Previous page button */}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          title="Previous page"
          aria-label="Previous page"
          style={{
            height: btnSize,
            padding: compact ? '0 0.45rem' : '0 0.75rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
            fontSize,
            fontWeight: 500
          }}
        >
          <ArrowLeft size={iconSize} />
          <span className={compact ? 'd-none' : 'd-none d-sm-inline'}>Prev</span>
        </button>

        {/* Numbered Page Buttons */}
        {getPageNumbers().map((page, idx) => {
          if (page === '...') {
            return (
              <span key={`ellipsis_${idx}`} className="text-muted px-1" style={{ fontSize, userSelect: 'none' }}>
                …
              </span>
            );
          }

          const isActive = currentPage === page;
          return (
            <button
              key={`page_${page}`}
              type="button"
              className={`btn ${isActive ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => onPageChange(page)}
              aria-current={isActive ? 'page' : undefined}
              style={{
                width: btnSize,
                height: btnSize,
                minWidth: btnSize,
                padding: 0,
                fontSize,
                fontWeight: isActive ? 700 : 500
              }}
            >
              {page}
            </button>
          );
        })}

        {/* Next page button */}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          title="Next page"
          aria-label="Next page"
          style={{
            height: btnSize,
            padding: compact ? '0 0.45rem' : '0 0.75rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
            fontSize,
            fontWeight: 500
          }}
        >
          <span className={compact ? 'd-none' : 'd-none d-sm-inline'}>Next</span>
          <ArrowRight size={iconSize} />
        </button>

        {/* Last page button */}
        {totalPages > 7 && (
          <button
            type="button"
            className="btn btn-ghost p-1"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage >= totalPages}
            title="Last page"
            aria-label="Last page"
            style={{ width: btnSize, height: btnSize, minWidth: btnSize, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronsRight size={iconSize} />
          </button>
        )}
      </div>

      {/* Page Size Selector */}
      {showPageSizeSelector && onPageSizeChange && (
        <div className="d-flex align-center gap-1.5 text-xs text-muted" style={{ fontSize }}>
          <span>Show:</span>
          <select
            className="form-input py-0 px-1.5"
            style={{ height: compact ? '24px' : '30px', fontSize, width: 'auto', borderRadius: 'var(--radius-sm)' }}
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Items per page"
          >
            {pageSizeOptions.map(opt => (
              <option key={opt} value={opt}>
                {opt} / page
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};
