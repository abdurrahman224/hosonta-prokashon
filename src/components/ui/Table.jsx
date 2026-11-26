/**
 * Neutral table primitives with #E5E5E5 borders, plain white/muted-gray headers,
 * and consistent cell spacing.
 */
export function Table({ className = '', wrapperClassName = '', children }) {
  return (
    <div className={`overflow-x-auto rounded-xl border border-line bg-surface ${wrapperClassName}`}>
      <table className={`w-full border-collapse text-left text-sm ${className}`}>
        {children}
      </table>
    </div>
  )
}

export function TableHead({ className = '', children }) {
  return (
    <thead
      className={`border-b border-line bg-surface-muted text-xs font-semibold text-ink-muted ${className}`}
    >
      {children}
    </thead>
  )
}

export function TableBody({ className = '', children }) {
  return <tbody className={`divide-y divide-line ${className}`}>{children}</tbody>
}

export function TableRow({ hoverable = true, onClick, className = '', children }) {
  return (
    <tr
      onClick={onClick}
      className={`transition-colors ${hoverable ? 'hover:bg-surface-muted' : ''} ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </tr>
  )
}

export function TableHeaderCell({ align = 'left', className = '', children, ...rest }) {
  const alignClass =
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
  return (
    <th
      className={`whitespace-nowrap px-4 py-3 text-xs font-semibold text-ink ${alignClass} ${className}`}
      {...rest}
    >
      {children}
    </th>
  )
}

export function TableCell({ align = 'left', className = '', children, ...rest }) {
  const alignClass =
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
  return (
    <td className={`px-4 py-3 text-sm text-ink ${alignClass} ${className}`} {...rest}>
      {children}
    </td>
  )
}

export function TableEmpty({ colSpan = 1, message = 'No records found.' }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-8 text-center text-sm text-ink-muted">
        {message}
      </td>
    </tr>
  )
}

export default Table
