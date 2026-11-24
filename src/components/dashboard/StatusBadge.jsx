const statusClasses = {
  published: 'bg-emerald-50 text-emerald-600',
  pending: 'bg-sky-50 text-sky-600',
  draft: 'bg-slate-100 text-slate-600',
  active: 'bg-emerald-50 text-emerald-600',
  suspended: 'bg-rose-50 text-rose-600',
  rejected: 'bg-rose-50 text-rose-600',
  hidden: 'bg-slate-100 text-slate-600',
  submitted: 'bg-sky-50 text-sky-600',
  in_review: 'bg-amber-50 text-amber-600',
  approved: 'bg-emerald-50 text-emerald-600',
  revision: 'bg-orange-50 text-orange-600',
  open: 'bg-sky-50 text-sky-600',
  resolved: 'bg-emerald-50 text-emerald-600',
  spam: 'bg-rose-50 text-rose-600',
  new: 'bg-sky-50 text-sky-600',
  processing: 'bg-blue-50 text-blue-600',
  shipped: 'bg-amber-50 text-amber-600',
  delivered: 'bg-emerald-50 text-emerald-600',
  cancelled: 'bg-rose-50 text-rose-600',
  paid: 'bg-emerald-50 text-emerald-600',
  due: 'bg-rose-50 text-rose-600',
}

const statusLabels = {
  published: 'Published',
  pending: 'Pending',
  draft: 'Draft',
  active: 'Active',
  suspended: 'Suspended',
  rejected: 'Rejected',
  hidden: 'Hidden',
  submitted: 'Submitted',
  in_review: 'In Review',
  approved: 'Approved',
  revision: 'Revision',
  open: 'Open',
  resolved: 'Resolved',
  spam: 'Spam',
  new: 'New',
  processing: 'Processing',
  shipped: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Canceled',
  paid: 'Paid',
  due: 'Due',
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-3 py-0.5 text-xs font-medium ${
        statusClasses[status] ?? 'bg-slate-100 text-slate-600'
      }`}
    >
      {statusLabels[status] || status}
    </span>
  )
}

export default StatusBadge
