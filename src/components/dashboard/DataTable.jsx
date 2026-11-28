import { useMemo, useState } from 'react'
import {
  FiSearch,
  FiX,
} from 'react-icons/fi'
import Pagination from '../common/Pagination'
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

            {/* Dropdown Filters */}
            {filters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {filters.map(filter => (
                  <select
                    key={filter.key}
                    value={filterValues[filter.key] ?? ''}
                    onChange={event =>
                      updateFilter(filter.key, event.target.value)
                    }
                    aria-label={filter.label}
                    className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition hover:border-slate-300 focus:border-slate-500"
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
            )}
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
                      ? 'text-right'
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
                  className="w-14 whitespace-nowrap px-3 py-3 text-right font-medium"
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

      {/* 3. Shared Pagination */}
      {pagination && !loading && sortedRows.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={sortedRows.length}
          pageSize={rowsPerPage}
          onPageChange={setPage}
          onPageSizeChange={size => {
            setRowsPerPage(size);
            setPage(1);
          }}
        />
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
