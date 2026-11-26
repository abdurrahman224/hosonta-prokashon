const VARIANT_CLASSES = {
  neutral: 'border-line bg-surface text-ink-muted',
  dark: 'border-line bg-surface text-ink',
  brand: 'border-brand bg-brand text-ink font-semibold',
  success: 'border-line bg-surface text-status-success',
  warning: 'border-line bg-surface text-status-warning',
  danger: 'border-line bg-surface text-status-danger',
  info: 'border-line bg-surface text-status-info',
}

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-0.5 text-xs',
}

/**
 * Shared Badge primitive.
 * Semantic badges strictly render a neutral light border (#E5E5E5) on white surface
 * with semantic colored text/icon only (no colored backgrounds).
 */
function Badge({
  variant = 'neutral',
  size = 'md',
  icon,
  dot = false,
  className = '',
  children,
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold whitespace-nowrap ${
        VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.neutral
      } ${SIZE_CLASSES[size] ?? SIZE_CLASSES.md} ${className}`}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full bg-current shrink-0"
          aria-hidden="true"
        />
      )}
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      {children}
    </span>
  )
}

export default Badge
