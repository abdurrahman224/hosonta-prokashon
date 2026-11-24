import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import DataTable from '../../../components/dashboard/DataTable'
import PageHeader from '../../../components/dashboard/PageHeader'
import StatusBadge from '../../../components/dashboard/StatusBadge'
import StarRating from '../../../components/reviews/StarRating'
import { useAuth } from '../../../context/useAuth'
import { useData } from '../../../context/useData'
import books from '../../../data/books'
import { PERMISSIONS } from '../../../utils/roles'

const tabs = [
  ['pending', 'Pending'],
  ['reported', 'Reported'],
  ['approved', 'Approved'],
  ['closed', 'Closed'],
]

function ReviewModeration() {
  const { currentUser, can } = useAuth()
  const { reviews, updateReview, deleteReview } = useData()
  const [activeTab, setActiveTab] = useState('pending')
  const [selected, setSelected] = useState([])
  const [detail, setDetail] = useState(null)
  const [moderatorNote, setModeratorNote] = useState('')
  const sortMode = 'new'

  const rows = useMemo(() => reviews.map((review) => ({
    ...review,
    bookTitle: books.find((book) => String(book.id) === String(review.bookId))?.title ?? 'বই',
    reportCount: review.reports.length,
    commentPreview: review.comment.length > 70 ? `${review.comment.slice(0, 70)}...` : review.comment,
  })).filter((review) => {
    if (activeTab === 'pending') return review.status === 'pending'
    if (activeTab === 'reported') return review.reportCount > 0
    if (activeTab === 'approved') return review.status === 'approved'
    return ['rejected', 'hidden'].includes(review.status)
  }).sort((first, second) => {
    if (sortMode === 'reports') return second.reportCount - first.reportCount
    if (sortMode === 'old') return new Date(first.createdAt) - new Date(second.createdAt)
    return new Date(second.createdAt) - new Date(first.createdAt)
  }), [activeTab, reviews, sortMode])

  const updateDecision = (review, status, note = moderatorNote) => {
    if (!can(PERMISSIONS.REVIEW_MODERATE)) return toast.error('এই কাজের অনুমতি নেই।')
    if (status === 'rejected' && !note.trim()) return toast.error('প্রত্যাখ্যানের কারণ লিখুন।')
    const result = updateReview(review.id, { status, moderatorNote: note.trim() }, currentUser)
    if (!result.success) return toast.error(result.message)
    toast.success('রিভিউয়ের সিদ্ধান্ত সংরক্ষিত হয়েছে।')
    setDetail(null)
    setModeratorNote('')
  }

  const dismissReports = (review) => {
    const result = updateReview(review.id, { reports: [] }, currentUser)
    toast[result.success ? 'success' : 'error'](result.success ? 'রিপোর্টগুলো খারিজ করা হয়েছে।' : result.message)
    if (result.success) setDetail(null)
  }

  const bulkDecision = (status) => {
    if (!can(PERMISSIONS.REVIEW_MODERATE)) return toast.error('এই কাজের অনুমতি নেই।')
    if (!selected.length) return toast.error('অন্তত একটি রিভিউ বাছাই করুন।')
    if (status === 'rejected' && !moderatorNote.trim()) return toast.error('প্রত্যাখ্যানের কারণ লিখুন।')
    selected.forEach((id) => updateReview(id, { status, moderatorNote: moderatorNote.trim() }, currentUser))
    setSelected([])
    setModeratorNote('')
    toast.success('বাছাই করা রিভিউগুলোর সিদ্ধান্ত সংরক্ষিত হয়েছে।')
  }

  const openDetail = (review) => {
    setDetail(review)
    setModeratorNote(review.moderatorNote ?? '')
  }

  return (
    <>
      <PageHeader
        title="Review Moderation"
        description="Review, moderate and manage customer book ratings and comments."
      />
      {selected.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50/50 p-3">
          <span className="mr-2 text-xs font-semibold text-slate-800">
            {selected.length} items selected
          </span>
          <button
            type="button"
            onClick={() => bulkDecision('approved')}
            className="rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-dark hover:bg-primary-hover shadow-xs"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => bulkDecision('rejected')}
            className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 shadow-xs"
          >
            Reject
          </button>
          <input
            value={moderatorNote}
            onChange={(event) => setModeratorNote(event.target.value)}
            placeholder="Rejection reason / internal note..."
            className="min-w-60 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none"
          />
        </div>
      )}
      <DataTable
        title="Reviews Queue"
        // subtitle="Manage user ratings, feedback and reported content"
        tabs={tabs.map(([value, label]) => ({
          id: value,
          label,
          count:
            value === 'reported'
              ? reviews.filter((review) => review.reports.length).length
              : value === 'closed'
              ? reviews.filter((review) => ['rejected', 'hidden'].includes(review.status)).length
              : reviews.filter((review) => review.status === value).length,
        }))}
        activeTab={activeTab}
        onTabChange={(tabId) => {
          setActiveTab(tabId)
          setSelected([])
        }}
        data={rows}
        searchKeys={['bookTitle', 'userName', 'comment', 'title']}
        searchPlaceholder="Search by book, reviewer or comment..."
        filters={[
          {
            key: 'rating',
            label: 'All Ratings',
            options: [5, 4, 3, 2, 1].map((value) => ({
              value,
              label: `${value} Stars`,
            })),
          },
          {
            key: 'verifiedPurchase',
            label: 'All Buyers',
            options: [
              { value: 'true', label: 'Verified Purchase' },
              { value: 'false', label: 'Unverified' },
            ],
          },
        ]}
        onRowClick={openDetail}
        selectable
        selectedRows={selected}
        onSelectRow={(id) =>
          setSelected((current) =>
            current.includes(id)
              ? current.filter((item) => item !== id)
              : [...current, id],
          )
        }
        onSelectAll={(isChecked) =>
          setSelected(isChecked ? rows.map((r) => r.id) : [])
        }
        columns={[
          {
            key: 'bookTitle',
            header: 'Book',
            sortable: true,
            render: (review) => (
              <span className="font-semibold text-slate-800">{review.bookTitle}</span>
            ),
          },
          { key: 'userName', header: 'Reviewer', sortable: true },
          {
            key: 'rating',
            header: 'Rating',
            sortable: true,
            render: (review) => <StarRating value={review.rating} size="text-xs" />,
          },
          {
            key: 'commentPreview',
            header: 'Comment',
            render: (review) => (
              <span className="line-clamp-1 max-w-xs text-slate-600">
                {review.comment}
              </span>
            ),
          },
          { key: 'reportCount', header: 'Reports', sortable: true },
          {
            key: 'createdAt',
            header: 'Date',
            sortable: true,
            render: (review) =>
              new Date(review.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }),
          },
          {
            key: 'status',
            header: 'Status',
            render: (review) => <StatusBadge status={review.status} />,
          },
        ]}
        rowActions={(review) => [
          { label: 'Details', onClick: () => openDetail(review) },
          ...(can(PERMISSIONS.REVIEW_DELETE_ANY)
            ? [
                {
                  label: 'Delete Permanently',
                  danger: true,
                  onClick: () => {
                    const result = deleteReview(review.id, currentUser)
                    toast[result.success ? 'success' : 'error'](
                      result.success ? 'Review deleted.' : result.message,
                    )
                  },
                },
              ]
            : []),
        ]}
        emptyMessage="No reviews found in this tab."
      />
      {detail && (
        <ReviewDetail
          review={detail}
          previousCount={reviews.filter((review) => review.userId === detail.userId && review.id !== detail.id).length}
          moderatorNote={moderatorNote}
          onNoteChange={setModeratorNote}
          onClose={() => setDetail(null)}
          onDecision={(status) => updateDecision(detail, status)}
          onDismissReports={() => dismissReports(detail)}
          canDeleteAny={can(PERMISSIONS.REVIEW_DELETE_ANY)}
          onDelete={() => { const result = deleteReview(detail.id, currentUser); toast[result.success ? 'success' : 'error'](result.success ? 'রিভিউ মুছে ফেলা হয়েছে।' : result.message); if (result.success) setDetail(null) }}
        />
      )}
    </>
  )
}

function ReviewDetail({ review, previousCount, moderatorNote, onNoteChange, onClose, onDecision, onDismissReports, canDeleteAny, onDelete }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-dark/60 px-5 py-8">
      <div className="max-h-full w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div><h2 className="font-heading text-2xl font-bold text-dark">{review.userName}</h2><p className="mt-1 text-sm text-dark-muted">আগের রিভিউ: {previousCount}টি</p></div>
          <button type="button" onClick={onClose} className="text-sm font-semibold text-dark-muted">বন্ধ করুন</button>
        </div>
        <div className="mt-5"><StarRating value={review.rating} /><p className="mt-4 leading-8 text-dark">{review.comment}</p></div>
        {review.reports.length > 0 && <div className="mt-5 rounded-lg bg-red-50 p-4"><p className="font-semibold text-red-700">রিপোর্টের কারণ</p><ul className="mt-2 list-disc pl-5 text-sm text-red-700">{review.reports.map((report) => <li key={`${report.userId}-${report.createdAt}`}>{report.reason}</li>)}</ul><button type="button" onClick={onDismissReports} className="mt-3 text-sm font-semibold text-red-700 underline">রিপোর্ট খারিজ করুন</button></div>}
        <textarea value={moderatorNote} onChange={(event) => onNoteChange(event.target.value)} placeholder="প্রত্যাখ্যান/মডারেটরের কারণ" rows={3} className="mt-5 w-full rounded-lg border border-dark/10 bg-cream p-3 text-dark" />
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={() => onDecision('approved')} className="rounded-md bg-primary px-4 py-2 font-semibold text-dark">অনুমোদন</button>
          <button type="button" onClick={() => onDecision('rejected')} className="rounded-md bg-red-600 px-4 py-2 font-semibold text-white">প্রত্যাখ্যান</button>
          <button type="button" onClick={() => onDecision('hidden')} className="rounded-md border border-dark/10 px-4 py-2 font-semibold text-dark">লুকান</button>
          {canDeleteAny && <button type="button" onClick={onDelete} className="rounded-md border border-red-200 px-4 py-2 font-semibold text-red-600">স্থায়ীভাবে মুছুন</button>}
        </div>
      </div>
    </div>
  )
}

export default ReviewModeration
