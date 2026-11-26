import { FiAlertCircle, FiAlertTriangle, FiCheckCircle, FiInfo } from 'react-icons/fi'

const VARIANT_CONFIG = {
  info: { icon: FiInfo, textClass: 'text-status-info' },
  success: { icon: FiCheckCircle, textClass: 'text-status-success' },
  warning: { icon: FiAlertTriangle, textClass: 'text-status-warning' },
  danger: { icon: FiAlertCircle, textClass: 'text-status-danger' },
}

/**
 * Neutral alert banner. Semantic color is applied strictly to the icon and title text,
 * keeping the container background plain white (#FFFFFF) with a light gray border (#E5E5E5).
 */
function Alert({ variant = 'info', title, action, className = '', children }) {
  const { icon: Icon, textClass } = VARIANT_CONFIG[variant] ?? VARIANT_CONFIG.info

  return (
    <div
      role="status"
      className={`flex items-start justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3.5 shadow-2xs ${className}`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <Icon className={`mt-0.5 shrink-0 text-base ${textClass}`} aria-hidden="true" />
        <div className="min-w-0 text-sm">
          {title && <p className={`font-semibold ${textClass}`}>{title}</p>}
          {children && <div className="text-ink-muted leading-relaxed">{children}</div>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export default Alert
