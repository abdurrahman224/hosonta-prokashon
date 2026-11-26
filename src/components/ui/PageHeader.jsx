/**
 * Unified page header component.
 */
function PageHeader({ title, description, action, backAction, className = '' }) {
  return (
    <div
      className={`mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end ${className}`}
    >
      <div className="min-w-0">
        {backAction && <div className="mb-2">{backAction}</div>}
        <h1 className="font-heading text-lg font-bold text-ink sm:text-xl">{title}</h1>
        {description && (
          <p className="mt-1 text-xs text-ink-muted sm:text-sm">{description}</p>
        )}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  )
}

export default PageHeader
