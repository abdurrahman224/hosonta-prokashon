import { useMemo, useState } from 'react';
import {
  FiCheck,
  FiClock,
  FiEye,
  FiTrash2,
  FiX,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import StarRating from '../../../components/reviews/StarRating';
import ConfirmModal from '../../../components/dashboard/ConfirmModal';
import DataTable from '../../../components/dashboard/DataTable';
import PageHeader from '../../../components/dashboard/PageHeader';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import { useAuth } from '../../../context/useAuth';
import { useData } from '../../../context/useData';
import { PERMISSIONS } from '../../../utils/roles';

const TABS = [
  ['pending', 'Pending'],
  ['approved', 'Approved'],
  ['reported', 'Reported'],
  ['all', 'All'],
];

function ReviewModeration() {
  const { currentUser, can } = useAuth();
  const { reviews, books = [], updateReview, deleteReview } = useData();
  const [tab, setTab] = useState('pending');
  const [selected, setSelected] = useState([]);
  const [detail, setDetail] = useState(null);
  const [moderatorNote, setModeratorNote] = useState('');
  const [reviewToDelete, setReviewToDelete] = useState(null);

  const bookMap = useMemo(() => {
    const map = new Map();
    books.forEach(b => map.set(String(b.id), b));
    return map;
  }, [books]);

  const getBookTitle = bookId =>
    bookMap.get(String(bookId))?.title || `Book #${bookId}`;

  const counts = {
    pending: reviews.filter(r => r.status === 'pending').length,
    approved: reviews.filter(r => r.status === 'approved').length,
    reported: reviews.filter(r => (r.reports?.length || 0) > 0).length,
    all: reviews.length,
  };

  const visible = reviews.filter(review => {
    if (tab === 'pending') return review.status === 'pending';
    if (tab === 'approved') return review.status === 'approved';
    if (tab === 'reported') return (review.reports?.length || 0) > 0;
    return true;
  });

  const previousReviewsCount = userId =>
    reviews.filter(item => item.userId === userId).length;

  const updateDecision = (review, status, note = moderatorNote) => {
    if (!can(PERMISSIONS.REVIEW_MODERATE)) {
      toast.error('You do not have permission to moderate reviews.');
      return;
    }
    const result = updateReview(
      review.id,
      { status, moderatorNote: (note || '').trim() },
      currentUser,
    );
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    toast.success(
      status === 'approved' ? 'Review approved.' : 'Review moved to pending.',
    );
    setDetail(null);
    setModeratorNote('');
  };

  const applyBulkDecision = status => {
    if (!can(PERMISSIONS.REVIEW_MODERATE)) {
      toast.error('You do not have permission to moderate reviews.');
      return;
    }
    selected.forEach(id => {
      updateReview(id, { status }, currentUser);
    });
    setSelected([]);
    toast.success(
      status === 'approved'
        ? 'Selected reviews approved.'
        : 'Selected reviews moved to pending.',
    );
  };

  const handleBulkDelete = () => {
    if (!can(PERMISSIONS.REVIEW_DELETE_ANY)) {
      toast.error('You do not have permission to delete reviews.');
      return;
    }
    let deleted = 0;
    selected.forEach(id => {
      const res = deleteReview(id, currentUser);
      if (res.success) deleted += 1;
    });
    setSelected([]);
    if (deleted > 0) {
      toast.success(`${deleted} review(s) deleted.`);
    }
  };

  const confirmDeleteSingle = () => {
    if (!reviewToDelete) return;
    const result = deleteReview(reviewToDelete.id, currentUser);
    if (!result.success) {
      toast.error(result.message);
    } else {
      toast.success('Review deleted.');
      setSelected(prev => prev.filter(id => id !== reviewToDelete.id));
      if (detail?.id === reviewToDelete.id) setDetail(null);
    }
    setReviewToDelete(null);
  };

  const dismissReports = review => {
    if (!can(PERMISSIONS.REVIEW_MODERATE)) return;
    const result = updateReview(review.id, { reports: [] }, currentUser);
    if (result.success) {
      toast.success('Reports dismissed.');
      setDetail(prev => (prev ? { ...prev, reports: [] } : null));
    }
  };

  const openDetail = review => {
    setDetail(review);
    setModeratorNote(review.moderatorNote ?? '');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reviews"
        description="Approve, hold as pending, or remove reader reviews."
      />

      {/* Tabs + Bulk actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setTab(id);
                setSelected([]);
              }}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                tab === id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {label} ({counts[id]})
            </button>
          ))}
        </div>

        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs">
            <span className="font-semibold text-slate-700">
              {selected.length} selected
            </span>
            <button
              type="button"
              onClick={() => applyBulkDecision('approved')}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 font-medium text-emerald-700 transition hover:bg-emerald-50"
              title="Approve Selected"
            >
              <FiCheck size={13} />
              Approve
            </button>
            <button
              type="button"
              onClick={() => applyBulkDecision('pending')}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 font-medium text-amber-700 transition hover:bg-amber-50"
              title="Set Pending"
            >
              <FiClock size={13} />
              Pending
            </button>
            {can(PERMISSIONS.REVIEW_DELETE_ANY) && (
              <button
                type="button"
                onClick={handleBulkDelete}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 font-medium text-rose-600 transition hover:bg-rose-50"
                title="Delete Selected"
              >
                <FiTrash2 size={13} />
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <DataTable
        data={visible}
        searchKeys={['userName', 'title', 'comment']}
        searchPlaceholder="Search by reviewer or comment..."
        selectable
        selectedRows={selected}
        onSelectRow={id =>
          setSelected(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id],
          )
        }
        onSelectAll={checked =>
          setSelected(checked ? visible.map(item => item.id) : [])
        }
        onRowClick={openDetail}
        columns={[
          {
            key: 'userName',
            header: 'Reviewer',
            sortable: true,
            render: review => (
              <div className="min-w-[140px]">
                <p className="font-semibold text-slate-900">{review.userName}</p>
                <p className="truncate text-xs text-slate-500">
                  {getBookTitle(review.bookId)}
                </p>
              </div>
            ),
          },
          {
            key: 'rating',
            header: 'Rating',
            sortable: true,
            render: review => <StarRating value={review.rating} size="text-sm" />,
          },
          {
            key: 'comment',
            header: 'Review',
            render: review => (
              <p className="max-w-md truncate text-sm text-slate-700">
                {review.comment}
              </p>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: review => <StatusBadge status={review.status} />,
          },
          {
            key: 'reports',
            header: 'Reports',
            align: 'center',
            render: review => (
              <span className="text-xs text-slate-500">
                {review.reports?.length || 0}
              </span>
            ),
          },
          {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            render: review => (
              <div
                className="flex items-center justify-end gap-1"
                onClick={e => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => openDetail(review)}
                  className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                  title="View"
                  aria-label="View review"
                >
                  <FiEye size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => updateDecision(review, 'approved')}
                  className={`rounded-lg p-1.5 transition ${
                    review.status === 'approved'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                  title="Approve"
                  aria-label="Approve review"
                >
                  <FiCheck size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => updateDecision(review, 'pending')}
                  className={`rounded-lg p-1.5 transition ${
                    review.status === 'pending'
                      ? 'bg-amber-50 text-amber-700'
                      : 'text-slate-500 hover:bg-amber-50 hover:text-amber-700'
                  }`}
                  title="Pending"
                  aria-label="Set pending"
                >
                  <FiClock size={15} />
                </button>
                {can(PERMISSIONS.REVIEW_DELETE_ANY) && (
                  <button
                    type="button"
                    onClick={() => setReviewToDelete(review)}
                    className="rounded-lg p-1.5 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                    title="Delete"
                    aria-label="Delete review"
                  >
                    <FiTrash2 size={15} />
                  </button>
                )}
              </div>
            ),
          },
        ]}
        emptyMessage="No reviews found."
      />

      {detail && (
        <ReviewDetail
          review={detail}
          bookTitle={getBookTitle(detail.bookId)}
          previousCount={previousReviewsCount(detail.userId)}
          moderatorNote={moderatorNote}
          onNoteChange={setModeratorNote}
          onClose={() => {
            setDetail(null);
            setModeratorNote('');
          }}
          onDecision={status => updateDecision(detail, status)}
          onDismissReports={() => dismissReports(detail)}
          canDeleteAny={can(PERMISSIONS.REVIEW_DELETE_ANY)}
          onDelete={() => setReviewToDelete(detail)}
        />
      )}

      <ConfirmModal
        isOpen={Boolean(reviewToDelete)}
        title="Delete Review?"
        message={`Are you sure you want to permanently delete ${reviewToDelete?.userName || 'this'}'s review?`}
        confirmLabel="Delete"
        onConfirm={confirmDeleteSingle}
        onCancel={() => setReviewToDelete(null)}
      />
    </div>
  );
}

function ReviewDetail({
  review,
  bookTitle,
  previousCount,
  moderatorNote,
  onNoteChange,
  onClose,
  onDecision,
  onDismissReports,
  canDeleteAny,
  onDelete,
}) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/45 px-4 py-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-lg font-bold text-slate-900">
                {review.userName}
              </h2>
              <StatusBadge status={review.status} />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Book: <span className="font-medium text-slate-700">{bookTitle}</span> ·{' '}
              {previousCount} total review{previousCount === 1 ? '' : 's'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <FiX size={14} />
            Close
          </button>
        </div>

        {/* Review Content */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <StarRating value={review.rating} />
            {review.createdAt && (
              <span className="text-xs text-slate-400">
                {new Date(review.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>
          {review.title && (
            <h3 className="text-sm font-semibold text-slate-900">
              {review.title}
            </h3>
          )}
          <p className="whitespace-pre-line rounded-lg border border-slate-100 bg-slate-50/70 p-3.5 text-sm leading-6 text-slate-700">
            {review.comment}
          </p>
        </div>

        {/* Reports if any */}
        {review.reports?.length > 0 && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50/60 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-rose-700">
                Reports ({review.reports.length})
              </p>
              <button
                type="button"
                onClick={onDismissReports}
                className="text-xs font-semibold text-rose-700 underline hover:text-rose-800"
              >
                Dismiss
              </button>
            </div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-rose-700">
              {review.reports.map(report => (
                <li key={`${report.userId}-${report.createdAt}`}>
                  {report.reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Note */}
        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-medium text-slate-600">
            Note (optional)
          </label>
          <textarea
            value={moderatorNote}
            onChange={event => onNoteChange(event.target.value)}
            placeholder="Add internal or moderation note..."
            rows={2}
            className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-800 outline-none focus:border-slate-500"
          />
        </div>

        {/* Actions: Only Approve, Pending, Delete */}
        <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => onDecision('approved')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
            title="Approve"
          >
            <FiCheck size={14} />
            Approve
          </button>
          <button
            type="button"
            onClick={() => onDecision('pending')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-50"
            title="Pending"
          >
            <FiClock size={14} />
            Pending
          </button>
          {canDeleteAny && (
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
              title="Delete"
            >
              <FiTrash2 size={14} />
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReviewModeration;
