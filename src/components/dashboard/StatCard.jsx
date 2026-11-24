import { FiArrowDown, FiArrowUp } from 'react-icons/fi'
import useFormat from '../../hooks/useFormat'

function StatCard({ title, value, icon: Icon, trend, trendLabel }) {
  const { formatNumber } = useFormat()
  const isPositive = trend >= 0

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-dark/10 bg-white p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-dark-muted">{title}</p>
          <p className="mt-2 font-heading text-3xl font-bold tracking-tight text-dark">
            {typeof value === 'number' ? formatNumber(value) : value}
          </p>
        </div>
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-2xl text-dark transition-colors duration-300 group-hover:bg-primary">
          <Icon />
        </span>
      </div>
      {trend !== undefined && (
        <div className="mt-4 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              isPositive
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {isPositive ? <FiArrowUp className="text-xs" /> : <FiArrowDown className="text-xs" />}
            {formatNumber(Math.abs(trend))}%
          </span>
          <span className="text-xs text-dark-muted">{trendLabel ?? 'গত মাসের তুলনায়'}</span>
        </div>
      )}
    </article>
  )
}

export default StatCard
