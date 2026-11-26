/**
 * Shared Tabs navigation bar.
 * Active tab uses the brand color (#FDB82E); inactive tabs stay neutral.
 */
function Tabs({ items = [], activeKey, onChange, variant = 'pill', className = '' }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${
        variant === 'underline' ? 'border-b border-line pb-0' : ''
      } ${className}`}
      role="tablist"
    >
      {items.map((item) => {
        const key = item.key ?? item.id
        const isActive = activeKey === key
        const Icon = item.icon

        if (variant === 'underline') {
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange?.(key)}
              className={`inline-flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs transition-colors whitespace-nowrap -mb-px ${
                isActive
                  ? 'border-brand font-semibold text-ink'
                  : 'border-transparent font-medium text-ink-muted hover:text-ink'
              }`}
            >
              {Icon && (typeof Icon === 'function' ? <Icon size={15} /> : Icon)}
              <span>{item.label}</span>
              {item.count !== undefined && (
                <span className="text-[11px] text-ink-muted">({item.count})</span>
              )}
            </button>
          )
        }

        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange?.(key)}
            className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs transition-colors whitespace-nowrap ${
              isActive
                ? 'border-brand bg-brand font-semibold text-ink shadow-2xs'
                : 'border-line bg-surface font-medium text-ink-muted hover:bg-surface-muted hover:text-ink'
            }`}
          >
            {Icon && (typeof Icon === 'function' ? <Icon size={15} /> : Icon)}
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                  isActive ? 'text-ink' : 'text-ink-muted'
                }`}
              >
                {item.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default Tabs
