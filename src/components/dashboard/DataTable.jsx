import { useMemo, useState } from 'react'
import {
  FiChevronLeft,
  FiChevronRight,
  FiMoreVertical,
  FiSearch,
  FiX,
} from 'react-icons/fi'
import useSearch from '../../hooks/useSearch'

function DataTable({
  columns = [],
  data = [],
  searchKeys,
  searchPlaceholder = 'Search...',
  showSearch = true,
  filters = [],
  pageSize = 10,
  rowActions,
  onRowClick,
  loading = false,
  emptyMessage = 'No records found.',
  // Reference UI props
  title,
  subtitle,
  tabs,
  activeTab,
  onTabChange,
  headerActions,
  selectable = true,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
  pagination = true,
  className = '',
  minWidth = 'min-w-full',
  hoverable = true,
}) {
  const [sortConfig, setSortConfig] = useState(null)
  const [filterValues, setFilterValues] = useState({})
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(pageSize)
  const [activeActionRow, setActiveActionRow] = useState(null)
  const [internalSelected, setInternalSelected] = useState([])

  // Selection state (either controlled via selectedRows or internal)
  const currentSelected = onSelectRow ? selectedRows : internalSelected

  const toggleSelectRow = (id) => {
    if (onSelectRow) {
      onSelectRow(id)
    } else {
      setInternalSelected((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
      )
    }
  }

  // Search logic
  const searchKeyList = useMemo(
    () => searchKeys ?? columns.map((col) => col.key),
    [searchKeys, columns],
  )
  const { query, setQuery, results: searchedRows } = useSearch(data, searchKeyList)

  // Filters logic
  const filteredRows = useMemo(
    () =>
      searchedRows.filter((row) =>
        filters.every(
          (filter) =>
            !filterValues[filter.key] ||
            (filter.predicate
              ? filter.predicate(row, filterValues[filter.key])
              : String(row[filter.key]) === String(filterValues[filter.key])),
        ),
      ),
    [filterValues, filters, searchedRows],
  )

  // Sort logic
  const sortedRows = useMemo(() => {
    if (!sortConfig) return filteredRows
    const column = columns.find((item) => item.key === sortConfig.key)
    if (!column) return filteredRows

    return [...filteredRows].sort((firstRow, secondRow) => {
      const firstValue = column.sortValue
        ? column.sortValue(firstRow)
        : firstRow[column.key]
      const secondValue = column.sortValue
        ? column.sortValue(secondRow)
        : secondRow[column.key]
      const comparison =
        typeof firstValue === 'number' && typeof secondValue === 'number'
          ? firstValue - secondValue
          : String(firstValue ?? '').localeCompare(String(secondValue ?? ''), undefined, {
              numeric: true,
            })
      return sortConfig.direction === 'asc' ? comparison : -comparison
    })
  }, [columns, filteredRows, sortConfig])

  // Pagination logic
  const effectivePageSize = rowsPerPage || 10
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / effectivePageSize))
  const currentPage = Math.min(Math.max(1, page), totalPages)
  const visibleRows = pagination
    ? sortedRows.slice(
        (currentPage - 1) * effectivePageSize,
        currentPage * effectivePageSize,
      )
    : sortedRows

  const toggleSort = (column) => {
    if (!column.sortable) return
    setPage(1)
    setSortConfig((current) => {
      if (!current || current.key !== column.key) {
        return { key: column.key, direction: 'asc' }
      }
      if (current.direction === 'asc') {
        return { key: column.key, direction: 'desc' }
      }
      return null
    })
  }

  const updateFilter = (key, value) => {
    setPage(1)
    setFilterValues((current) => ({ ...current, [key]: value }))
  }

  // Multi-select helpers
  const allVisibleSelected =
    selectable &&
    visibleRows.length > 0 &&
    visibleRows.every((row) => currentSelected.includes(row.id))

  const handleSelectAll = (e) => {
    const isChecked = e.target.checked
    if (onSelectAll) {
      onSelectAll(isChecked)
    } else {
      if (isChecked) {
        const visibleIds = visibleRows.map((r) => r.id)
        setInternalSelected((prev) => [...new Set([...prev, ...visibleIds])])
      } else {
        const visibleIds = new Set(visibleRows.map((r) => r.id))
        setInternalSelected((prev) => prev.filter((id) => !visibleIds.has(id)))
      }
    }
  }

  const startIndex = sortedRows.length === 0 ? 0 : (currentPage - 1) * effectivePageSize + 1
  const endIndex = Math.min(currentPage * effectivePageSize, sortedRows.length)

  // Smart page numbers array for pagination bar
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    if (currentPage <= 3) {
      return [1, 2, 3, 4, '...', totalPages]
    }
    if (currentPage >= totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages]
  }, [currentPage, totalPages])

  const hasHeaderContent = Boolean(
    title ||
      subtitle ||
      (tabs && tabs.length > 0) ||
      headerActions ||
      showSearch ||
      filters.length > 0,
  )

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition ${className}`}
      onClick={() => activeActionRow && setActiveActionRow(null)}
    >
      {/* 1. Header Area: Clean single section matching reference image */}
      {hasHeaderContent && (
        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: Title & Subtitle */}
          {/* <div>
            {title && (
              <h2 className="font-heading text-lg font-bold text-slate-800 tracking-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-slate-400 font-normal">
                {subtitle}
              </p>
            )}
          </div> */}
          {/* Right: Tabs, Filter buttons, Search */}
          <div className="flex flex-wrap items-center gap-2.5 sm:justify-end">
            {/* Tab Pills (like [All Shipments] [Delivered] ... in image) */}
            {tabs && tabs.length > 0 && (
              <div className="inline-flex items-center gap-1">
                {tabs.map(tab => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => onTabChange?.(tab.id)}
                      className={`whitespace-nowrap px-3 py-1.5 text-xs rounded-lg transition ${
                        isActive
                          ? 'border border-slate-200/80 bg-white font-semibold text-slate-900 shadow-2xs'
                          : 'font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      {tab.label}
                      {tab.count !== undefined && (
                        <span className="ml-1 text-[11px] text-slate-400">
                          ({tab.count})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Custom Header Actions (e.g. Date Range button) */}
            {headerActions && (
              <div className="flex items-center gap-2">{headerActions}</div>
            )}

            {/* Compact Search Bar */}
            {showSearch && (
              <div className="relative w-full sm:w-64">
                <FiSearch
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={13}
                />
                <input
                  type="text"
                  value={query}
                  onChange={e => {
                    setPage(1);
                    setQuery(e.target.value);
                  }}
                  placeholder={searchPlaceholder}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-[#E5A72A] focus:outline-none focus-visible:outline-none"
                  aria-label={searchPlaceholder}
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setPage(1);
                      setQuery('');
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:text-slate-700"
                    aria-label="Clear search"
                  >
                    <FiX size={12} />
                  </button>
                )}
              </div>
            )}

            {/* Dropdown Filters styled as clean buttons */}
            {/* {filters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {filters.map(filter => (
                  <select
                    key={filter.key}
                    value={filterValues[filter.key] ?? ''}
                    onChange={event =>
                      updateFilter(filter.key, event.target.value)
                    }
                    aria-label={filter.label}
                    className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:outline-none focus-visible:outline-none"
                  >
                    <option value="">{filter.label}</option>
                    {filter.options.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ))}
              </div>
            )} */}
          </div>
        </div>
      )}

      {/* 2. Main Table */}
      <div className="overflow-x-auto">
        <table
          className={`w-full ${minWidth} border-collapse text-left text-sm`}
        >
          <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 text-xs font-medium text-slate-500 backdrop-blur-sm">
            <tr>
              {selectable && (
                <th className="w-12 px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={handleSelectAll}
                    aria-label="Select all"
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                </th>
              )}

              {columns.map(column => {
                const alignClass =
                  column.align === 'center'
                    ? 'text-center'
                    : column.align === 'right'
                      ? 'text-center'
                      : 'text-left';

                return (
                  <th
                    key={column.key}
                    style={column.width ? { width: column.width } : undefined}
                    className={`whitespace-nowrap px-4 py-3 tracking-normal   text-black text-sm  font-medium ${alignClass} ${
                      column.className || ''
                    }`}
                  >
                    <span>{column.header}</span>
                  </th>
                );
              })}

              {rowActions && (
                <th
                  className="w-14 px-3 py-3 text-right font-medium"
                  aria-label="Actions"
                />
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <LoadingRows
                columnCount={
                  columns.length + (rowActions ? 1 : 0) + (selectable ? 1 : 0)
                }
              />
            ) : visibleRows.length > 0 ? (
              visibleRows.map((row, index) => {
                const isSelected =
                  selectable && currentSelected.includes(row.id);
                return (
                  <tr
                    key={row.id ?? index}
                    onClick={() => onRowClick?.(row)}
                    className={`transition-colors duration-100 ${
                      hoverable ? 'hover:bg-slate-50/50' : ''
                    } ${
                      onRowClick ? 'cursor-pointer' : ''
                    } ${isSelected ? 'bg-blue-50/20' : ''}`}
                  >
                    {selectable && (
                      <td
                        className="px-3 py-3 text-center"
                        onClick={e => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(row.id)}
                          aria-label={`Select row ${row.id}`}
                          className="h-4 w-4 rounded border-slate-300 text-[#E5A72A] outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus:ring-offset-0 cursor-pointer"
                        />
                      </td>
                    )}

                    {columns.map(column => {
                      const alignClass =
                        column.align === 'center'
                          ? 'text-center'
                          : column.align === 'right'
                            ? 'text-right'
                            : 'text-left';

                      return (
                        <td
                          key={column.key}
                          style={
                            column.width ? { width: column.width } : undefined
                          }
                          className={`px-2 py-1.5 text-slate-700 ${alignClass} ${
                            column.cellClassName || ''
                          }`}
                        >
                          {column.render
                            ? column.render(row, index)
                            : row[column.key]}
                        </td>
                      );
                    })}

                    {rowActions && (
                      <td
                        className="relative px-3 py-3 text-right"
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setActiveActionRow(current =>
                              current === row.id ? null : row.id,
                            )
                          }
                          className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          aria-label="Row actions"
                        >
                          {/* <FiMoreVertical size={15} /> */}
                        </button>

                        {activeActionRow === row.id && (
                          <div className="absolute right-4 top-11 z-20 w-44 rounded-xl border border-slate-200/80 bg-white p-1 text-left shadow-lg ring-1 ring-black/5">
                            {(typeof rowActions === 'function'
                              ? rowActions(row)
                              : rowActions
                            ).map(action => (
                              <button
                                type="button"
                                key={action.label}
                                onClick={() => {
                                  action.onClick(row);
                                  setActiveActionRow(null);
                                }}
                                className={`block w-full rounded-lg px-3 py-2 text-xs font-medium transition hover:bg-slate-50 ${
                                  action.danger
                                    ? 'text-rose-600 hover:bg-rose-50'
                                    : 'text-slate-700 hover:text-slate-900'
                                }`}
                              >
                                {action.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={
                    columns.length + (rowActions ? 1 : 0) + (selectable ? 1 : 0)
                  }
                  className="px-2.5 py-2.5 text-center text-slate-400 text-xs md:text-sm"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 3. Footer: "Showing X to Y of Z" on left, blue page button on right */}
      {pagination && !loading && sortedRows.length > 0 && (
        <div className="grid gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-500 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={rowsPerPage}
              onChange={event => {
                setRowsPerPage(Number(event.target.value));
                setPage(1);
              }}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:outline-none focus-visible:outline-none"
              aria-label="Rows per page"
            >
              {[10, 25, 50, 100].map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>entries</span>
          </div>

          <div className="text-left md:text-center">
            Showing{' '}
            <strong className="font-semibold text-slate-800">
              {startIndex}
            </strong>{' '}
            to{' '}
            <strong className="font-semibold text-slate-800">{endIndex}</strong>{' '}
            of{' '}
            <strong className="font-semibold text-slate-800">
              {sortedRows.length}
            </strong>{' '}
            entries
          </div>

          <div className="flex items-center justify-start md:justify-end gap-1">
            {/* Prev Button */}
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <FiChevronLeft size={16} />
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {pageNumbers.map((pageNum, idx) => {
                if (pageNum === '...') {
                  return (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-2 py-1 text-slate-400 select-none"
                    >
                      ...
                    </span>
                  );
                }

                const isActive = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setPage(pageNum)}
                    className={`min-w-[28px] rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setPage(currentPage + 1)}
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingRows({ columnCount }) {
  return Array.from({ length: 5 }, (_, rowIndex) => (
    <tr key={rowIndex}>
      {Array.from({ length: columnCount }, (_, columnIndex) => (
        <td key={columnIndex} className="px-2.5 py-2.5">
          <div className="h-4 w-full max-w-[120px] animate-pulse rounded bg-slate-100" />
        </td>
      ))}
    </tr>
  ))
}

export default DataTable
