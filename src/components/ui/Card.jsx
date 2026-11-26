import { FiArrowDown, FiArrowUp } from 'react-icons/fi'

const PADDING_CLASSES = {
  none: '',
  sm: 'p-3.5',
  md: 'p-5',
  lg: 'p-6',
}

/**
 * Neutral white surface container with #E5E5E5 border.
 * Supports `active` state (brand border) and `hoverable` state.
 */
export function Card({
  padding = 'md',
  hoverable = false,
  active = false,
  onClick,
  className = '',
  children,
  ...rest
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border bg-surface text-ink shadow-2xs transition-colors ${
        active
          ? 'border-brand ring-1 ring-brand/30'
          : 'border-line'
      } ${hoverable || onClick ? 'hover:border-line-strong' : ''} ${
        onClick ? 'cursor-pointer' : ''
      } ${PADDING_CLASSES[padding] ?? PADDING_CLASSES.md} ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className = '', children }) {
  return (
    <div className={`flex items-center justify-between gap-3 border-b border-line px-5 py-4 ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ className = '', children }) {
  return (
    <h3 className={`font-heading text-base font-bold text-ink ${className}`}>
      {children}
    </h3>
  )
}

export function CardDescription({ className = '', children }) {
  return (
    <p className={`text-xs text-ink-muted ${className}`}>
      {children}
    </p>
  )
}

export function CardBody({ className = '', children }) {
  return <div className={`p-5 ${className}`}>{children}</div>
}

export function CardFooter({ className = '', children }) {
  return (
    <div className={`flex items-center justify-end gap-2 border-t border-line px-5 py-3.5 ${className}`}>
      {children}
    </div>
  )
}

/**
 * Neutral KPI summary card adhering strictly to white surface, light border,
 * and semantic text/icon only (no colored backgrounds).
 */
export function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  trendLabel,
  active = false,
  compact = false,
  onClick,
  className = '',
}) {
  const isPositive = trend >= 0
  const renderIcon = () => {
    if (!Icon) return null
    if (typeof Icon === 'function') return <Icon />
    return Icon
  }

  return (
    <Card
      padding={compact ? 'sm' : 'md'}
      active={active}
      hoverable={Boolean(onClick)}
      onClick={onClick}
      className={className}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-ink-muted">{title}</p>
          <p className={`mt-1.5 font-heading font-bold tracking-tight text-ink ${compact ? 'text-lg' : 'text-2xl'}`}>
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-ink-muted">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <span
            className={`flex shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-ink-muted ${
              compact ? 'h-8 w-8 text-sm' : 'h-10 w-10 text-lg'
            }`}
          >
            {renderIcon()}
          </span>
        )}
      </div>
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2 py-0.5 text-xs font-semibold ${
              isPositive ? 'text-status-success' : 'text-status-danger'
            }`}
          >
            {isPositive ? (
              <FiArrowUp className="text-xs" />
            ) : (
              <FiArrowDown className="text-xs" />
            )}
            {Math.abs(trend)}%
          </span>
          {trendLabel && <span className="text-xs text-ink-muted">{trendLabel}</span>}
        </div>
      )}
    </Card>
  )
}

export default Card
