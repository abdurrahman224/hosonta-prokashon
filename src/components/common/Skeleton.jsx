function Skeleton({ className = '' }) {
  return <span aria-hidden="true" className={`block animate-pulse rounded-lg bg-dark/10 ${className}`} />
}

export function BookCardSkeleton({ compact = false }) {
  if (compact) {
    return (
      <div className="overflow-hidden rounded-xl border border-dark/10 bg-white shadow-sm">
        <Skeleton className="aspect-[3/4] rounded-none" />
        <div className="space-y-2 p-2 sm:p-3">
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="mt-2 h-4 w-1/3" />
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-dark/10 bg-white">
      <Skeleton className="aspect-[4/5] rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  )
}

export function AuthorCardSkeleton() {
  return (
    <div className="rounded-xl border border-dark/10 bg-white p-5">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <Skeleton className="mt-5 h-12 w-full" />
    </div>
  )
}

export function TableRowSkeleton({ columns = 4 }) {
  return (
    <div className="grid gap-4 border-b border-dark/10 px-4 py-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {Array.from({ length: columns }, (_, index) => <Skeleton key={index} className="h-4 w-4/5" />)}
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-dark/10 bg-white p-5">
      <div className="flex justify-between">
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-20" />
        </div>
        <Skeleton className="h-11 w-11 rounded-lg" />
      </div>
    </div>
  )
}

export default Skeleton
