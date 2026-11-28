import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  if (currentPage <= 3) {
    return [1, 2, 3, 4, '...', totalPages];
  }
  if (currentPage >= totalPages - 2) {
    return [
      1,
      '...',
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }
  return [
    1,
    '...',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    '...',
    totalPages,
  ];
}

export function paginateItems(items = [], currentPage = 1, pageSize = 10) {
  const safeSize = Math.max(1, Number(pageSize) || 10);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / safeSize));
  const safePage = Math.min(Math.max(1, Number(currentPage) || 1), totalPages);
  const startIndex = (safePage - 1) * safeSize;
  return {
    items: items.slice(startIndex, startIndex + safeSize),
    currentPage: safePage,
    totalPages,
    totalItems,
    pageSize: safeSize,
    startItem: totalItems === 0 ? 0 : startIndex + 1,
    endItem: Math.min(startIndex + safeSize, totalItems),
  };
}

function Pagination({
  currentPage = 1,
  totalPages: totalPagesProp,
  totalItems,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  itemLabel = 'entries',
  variant = 'table', // 'table' | 'minimal'
  ariaLabel = 'Pagination',
  className = '',
}) {
  const computedTotalPages =
    totalPagesProp ??
    Math.max(1, Math.ceil((totalItems ?? 0) / (Number(pageSize) || 10)));

  if (variant === 'minimal') {
    if (computedTotalPages <= 1) return null;
    const pages = getPageNumbers(currentPage, computedTotalPages);

    return (
      <nav
        data-no-translate="true"
        className={`mt-8 flex flex-wrap items-center justify-center gap-2 ${className}`}
        aria-label={ariaLabel}
      >
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange?.(currentPage - 1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <FiChevronLeft size={16} />
        </button>

        {pages.map((pageNum, idx) =>
          pageNum === '...' ? (
            <span
              key={`ellipsis-${idx}`}
              className="px-2 py-1 text-xs text-slate-400 select-none"
            >
              ...
            </span>
          ) : (
            <button
              type="button"
              key={pageNum}
              onClick={() => onPageChange?.(pageNum)}
              aria-current={pageNum === currentPage ? 'page' : undefined}
              className={`min-w-[36px] h-9 rounded-lg px-2.5 text-xs font-semibold transition ${
                pageNum === currentPage
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {pageNum}
            </button>
          ),
        )}

        <button
          type="button"
          disabled={currentPage >= computedTotalPages}
          onClick={() => onPageChange?.(currentPage + 1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <FiChevronRight size={16} />
        </button>
      </nav>
    );
  }

  const effectiveTotal = totalItems ?? 0;
  if (effectiveTotal === 0 && !onPageSizeChange) return null;

  const startItem =
    effectiveTotal === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, effectiveTotal);
  const pages = getPageNumbers(currentPage, computedTotalPages);

  return (
    <div
      data-no-translate="true"
      className={`grid gap-3 border-t border-slate-100 px-5 py-3.5 text-xs text-slate-500 md:grid-cols-[1fr_auto_1fr] md:items-center ${className}`}
    >
      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <>
            <span>Show</span>
            <select
              value={pageSize}
              onChange={event => onPageSizeChange(Number(event.target.value))}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none focus:border-slate-500"
              aria-label="Rows per page"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>{itemLabel}</span>
          </>
        )}
      </div>

      <div className="text-left md:text-center">
        {totalItems !== undefined ? (
          <>
            Showing{' '}
            <strong className="font-semibold text-slate-800">
              {startItem}
            </strong>{' '}
            to{' '}
            <strong className="font-semibold text-slate-800">{endItem}</strong>{' '}
            of{' '}
            <strong className="font-semibold text-slate-800">
              {effectiveTotal}
            </strong>{' '}
            {itemLabel}
          </>
        ) : (
          <>
            Page <strong className="text-slate-800">{currentPage}</strong> of{' '}
            <strong className="text-slate-800">{computedTotalPages}</strong>
          </>
        )}
      </div>

      <div className="flex items-center justify-start gap-1 md:justify-end">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange?.(currentPage - 1)}
          className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Previous page"
        >
          <FiChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-1">
          {pages.map((pageNum, idx) =>
            pageNum === '...' ? (
              <span
                key={`ellipsis-${idx}`}
                className="px-2 py-1 text-slate-400 select-none"
              >
                ...
              </span>
            ) : (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange?.(pageNum)}
                aria-current={pageNum === currentPage ? 'page' : undefined}
                className={`min-w-[28px] rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  pageNum === currentPage
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {pageNum}
              </button>
            ),
          )}
        </div>

        <button
          type="button"
          disabled={currentPage >= computedTotalPages}
          onClick={() => onPageChange?.(currentPage + 1)}
          className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Next page"
        >
          <FiChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default Pagination;
