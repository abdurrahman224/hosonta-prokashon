import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  LuArrowDown as ArrowDown,
  LuArrowRight as ArrowRight,
  LuArrowUp as ArrowUp,
  LuArrowUpDown as ArrowUpDown,
  LuBookOpen as BookOpen,
  LuCheck as CheckIcon,
  LuClock as ClockIcon,
  LuDownload as Download,
  LuExternalLink as ExternalLink,
  LuFileText as FileText,
  LuPenTool as PenTool,
  LuSearch as Search,
  LuUpload as Upload,
  LuX as XIcon,
} from 'react-icons/lu';
import PageHeader from '../../../components/dashboard/PageHeader';
import { useAuth } from '../../../context/useAuth';
import authors from '../../../data/authors';
import seedManuscripts from '../../../data/manuscripts';
import { PERMISSIONS } from '../../../utils/roles';
import {
  addActivityLog,
  getStoredManuscripts,
  saveStoredManuscripts,
} from '../../../utils/moderationStorage';

const STATUS = {
  SUBMITTED: 'submitted',
  IN_REVIEW: 'in_review',
  PUBLISHED: 'published',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

const STATUS_META = {
  submitted: {
    label: 'Submitted',
    tone: 'bg-sky-50 text-sky-700 ring-sky-200',
    dot: 'bg-sky-500',
  },
  screening: {
    label: 'Submitted',
    tone: 'bg-sky-50 text-sky-700 ring-sky-200',
    dot: 'bg-sky-500',
  },
  in_review: {
    label: 'In Review',
    tone: 'bg-amber-50 text-amber-700 ring-amber-200',
    dot: 'bg-amber-500',
  },
  revision_requested: {
    label: 'In Review',
    tone: 'bg-amber-50 text-amber-700 ring-amber-200',
    dot: 'bg-amber-500',
  },
  resubmitted: {
    label: 'Submitted',
    tone: 'bg-sky-50 text-sky-700 ring-sky-200',
    dot: 'bg-sky-500',
  },
  approved: {
    label: 'Published',
    tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dot: 'bg-emerald-500',
  },
  published: {
    label: 'Published',
    tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dot: 'bg-emerald-500',
  },
  rejected: {
    label: 'Rejected',
    tone: 'bg-rose-50 text-rose-700 ring-rose-200',
    dot: 'bg-rose-500',
  },
  withdrawn: {
    label: 'Rejected',
    tone: 'bg-rose-50 text-rose-700 ring-rose-200',
    dot: 'bg-rose-500',
  },
};

const BN_MONTHS = {
  'জানুয়ারি': 'Jan',
  'জানুয়ারি': 'Jan',
  'ফেব্রুয়ারি': 'Feb',
  'ফেব্রুয়ারি': 'Feb',
  'মার্চ': 'Mar',
  'এপ্রিল': 'Apr',
  'মে': 'May',
  'জুন': 'Jun',
  'জুলাই': 'Jul',
  'আগস্ট': 'Aug',
  'সেপ্টেম্বর': 'Sep',
  'অক্টোবর': 'Oct',
  'নভেম্বর': 'Nov',
  'ডিসেম্বর': 'Dec',
};

function toEnglishDigits(str = '') {
  const bn = '০১২৩৪৫৬৭৮৯';
  return String(str).replace(/[০-৯]/g, d => String(bn.indexOf(d)));
}

function parseFlexibleDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const raw = toEnglishDigits(value).trim();
  if (!raw) return null;

  const dmyMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmyMatch) {
    const [, dd, mm, yyyy] = dmyMatch;
    const parsed = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  let replaced = raw.replace(/,/g, '');
  Object.entries(BN_MONTHS).forEach(([bnMonth, enMonth]) => {
    replaced = replaced.replace(bnMonth, enMonth);
  });

  const parsed = new Date(replaced);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

const formatDay = d => {
  const parsed = parseFlexibleDate(d);
  if (parsed) {
    return parsed.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
  return d ? String(d) : '—';
};

const formatDateTime = d => {
  const parsed = parseFlexibleDate(d);
  if (parsed) {
    return parsed.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }
  return d ? String(d) : '—';
};

const formatFileSize = bytes => {
  if (!bytes) return '';
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

const uid = p =>
  `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function normalizeStatus(s) {
  if (s === 'revision') return STATUS.IN_REVIEW;
  if (s === 'approved') return STATUS.PUBLISHED;
  return s || STATUS.SUBMITTED;
}

function normalizeManuscript(m) {
  const seedMatch = seedManuscripts.find(item => item.id === m.id) || {};
  const merged = {
    ...seedMatch,
    ...m,
  };
  const updatedAt = merged.updatedAt || merged.reviewedAt || merged.submittedAt;
  const baseVersions = Array.isArray(merged.versions) ? merged.versions : [];
  const versions =
    baseVersions.length > 0
      ? baseVersions
      : merged.fileName
        ? [
            {
              id: `file-${merged.id}`,
              version: 1,
              name: merged.fileName,
              size: merged.fileSize || 0,
              type: merged.fileType || '',
              dataUrl: merged.fileDataUrl || null,
              submittedBy: merged.authorId,
              submittedAt: merged.submittedAt,
            },
          ]
        : [];
  const submitMode =
    merged.submitMode ||
    (versions.length > 0 || Boolean(merged.fileName) ? 'file' : 'text');

  return {
    ...merged,
    submitMode,
    versions,
    status: normalizeStatus(merged.status),
    updatedAt,
    authorFeedback:
      merged.authorFeedback ??
      (merged.feedback
        ? [
            {
              id: uid('fb'),
              text: merged.feedback,
              byId: merged.reviewedBy,
              at: merged.reviewedAt || updatedAt,
            },
          ]
        : []),
  };
}

function getAllNormalizedManuscripts() {
  return getStoredManuscripts().map(normalizeManuscript);
}

function updateManuscriptDecision(id, to, actor, feedback = '') {
  const nowIso = new Date().toISOString();
  const trimmedFeedback = feedback.trim();
  const all = getAllNormalizedManuscripts().map(m => {
    if (m.id !== id) return m;
    return {
      ...m,
      status: to,
      reviewedBy: actor.id,
      reviewedAt: nowIso,
      updatedAt: nowIso,
      feedback: trimmedFeedback || m.feedback || '',
      productionStatus: to === STATUS.PUBLISHED ? 'published' : null,
      authorFeedback: trimmedFeedback
        ? [
            ...(m.authorFeedback || []),
            { id: uid('fb'), text: trimmedFeedback, byId: actor.id, at: nowIso },
          ]
        : m.authorFeedback || [],
    };
  });
  saveStoredManuscripts(all);
  addActivityLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: to,
    entity: 'manuscript',
    entityId: id,
    comment: trimmedFeedback || undefined,
  });
  return all.find(m => m.id === id) || null;
}

function StatusPill({ status }) {
  const meta = STATUS_META[status] ?? STATUS_META.submitted;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${meta.tone}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function ManuscriptModal({
  manuscript,
  authorInfo,
  canReview,
  onClose,
  onDecisionUpdated,
}) {
  const { currentUser } = useAuth();
  const [feedback, setFeedback] = useState(manuscript?.feedback || '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKeyDown = e => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  if (!manuscript) return null;

  const isFileSubmission = manuscript.submitMode === 'file';
  const primaryFile = manuscript.versions?.[manuscript.versions.length - 1] || null;
  const readableContent =
    manuscript.text || manuscript.sampleExcerpt || manuscript.summary || '';
  const estimatedWords =
    manuscript.wordCount ||
    (readableContent ? readableContent.trim().split(/\s+/).length : 0);

  const handleDecision = nextStatus => {
    setBusy(true);
    try {
      const updated = updateManuscriptDecision(
        manuscript.id,
        nextStatus,
        currentUser,
        feedback,
      );
      toast.success(
        nextStatus === STATUS.PUBLISHED
          ? 'Manuscript marked as Published.'
          : 'Manuscript marked as Rejected.',
      );
      onDecisionUpdated(updated);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-2.5 backdrop-blur-xs sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3.5">
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-dark sm:flex">
              <BookOpen size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-heading text-lg font-bold text-slate-900 sm:text-xl">
                  {manuscript.title}
                </h2>
                <StatusPill status={manuscript.status} />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">
                  {authorInfo.name}
                </span>
                <span>•</span>
                <span>Category: {manuscript.type || 'Uncategorized'}</span>
                <span>•</span>
                <span>Submitted {formatDay(manuscript.submittedAt)}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* Modal Body: Left Manuscript Reader + Right Publishing Decision */}
        <div className="flex-1 overflow-y-auto bg-slate-50/70 p-4 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
            {/* Left Column: Manuscript Viewer */}
            <div className="space-y-4">
              {/* Manuscript Specs Strip */}
              <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 sm:grid-cols-4">
                <div>
                  <p className="text-[11px] font-medium text-slate-500">Book Name</p>
                  <p className="mt-0.5 truncate text-xs font-bold text-slate-900 sm:text-sm">
                    {manuscript.title}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-slate-500">Category</p>
                  <p className="mt-0.5 truncate text-xs font-bold text-slate-900 sm:text-sm">
                    {manuscript.type || 'General'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-slate-500">Submit as</p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-bold text-slate-900 sm:text-sm">
                    {isFileSubmission ? (
                      <>
                        <Upload size={13} className="text-blue-600" />
                        Upload File
                      </>
                    ) : (
                      <>
                        <PenTool size={13} className="text-amber-600" />
                        Write Text
                      </>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-slate-500">
                    {isFileSubmission && manuscript.pagesCount
                      ? 'Length'
                      : 'Word Count'}
                  </p>
                  <p className="mt-0.5 text-xs font-bold text-slate-900 sm:text-sm">
                    {manuscript.pagesCount
                      ? `${manuscript.pagesCount} pages`
                      : estimatedWords
                        ? `${estimatedWords.toLocaleString()} words`
                        : '—'}
                  </p>
                </div>
              </div>

              {/* Uploaded File Header (when submitted as Upload File) */}
              {isFileSubmission && primaryFile && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-200/80 bg-blue-50/40 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                      <FileText size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {primaryFile.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatFileSize(primaryFile.size) || 'Manuscript document'}
                        {manuscript.wordCount
                          ? ` • ${manuscript.wordCount.toLocaleString()} words`
                          : ''}
                      </p>
                    </div>
                  </div>
                  {primaryFile.dataUrl && (
                    <div className="flex items-center gap-2">
                      {primaryFile.type === 'application/pdf' && (
                        <a
                          href={primaryFile.dataUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                        >
                          <ExternalLink size={13} />
                          Open PDF
                        </a>
                      )}
                      <a
                        href={primaryFile.dataUrl}
                        download={primaryFile.name}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-dark px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                      >
                        <Download size={13} />
                        Download
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Manuscript Document Reader Sheet */}
              <div className="rounded-xl border border-amber-900/15  p-3 shadow-inner sm:p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-900/10 pb-3">
                  {/* <span className="text-[11px] font-bold  tracking-widest text-amber-900/70">
                    {isFileSubmission
                      ? 'Manuscript Document Preview'
                      : 'Author Written Manuscript'}
                  </span> */}
                  {/* <span className="text-xs text-slate-500">
                    {manuscript.language || 'Bengali'}
                    {estimatedWords
                      ? ` · ${estimatedWords.toLocaleString()} words`
                      : ''}
                  </span> */}
                </div>

                {isFileSubmission &&
                primaryFile?.dataUrl &&
                primaryFile?.type === 'application/pdf' ? (
                  <iframe
                    src={primaryFile.dataUrl}
                    title={manuscript.title}
                    className="mt-4 h-[380px] w-full rounded-xl"
                  />
                ) : (
                  <div className="mt-4 space-y-4">
                    {/* <div className="border-b border-dashed border-amber-900/10 pb-3">
                      <h3 className="font-heading text-xl font-bold text-slate-900">
                        {manuscript.title}
                      </h3>
                      <p className="mt-0.5 text-xs font-medium text-slate-500">
                        By {authorInfo.name} · {manuscript.type}
                      </p>
                    </div> */}

                    {manuscript.summary &&
                      manuscript.summary !== readableContent && (
                        <div className="rounded-xl  p-3.5 text-xs leading-relaxed text-slate-600 ring-1 ring-amber-900/10">
                          <span className="font-bold text-slate-800">
                            Subtitle :{' '}
                          </span>
                          {manuscript.summary}
                        </div>
                      )}

                    <div className="max-h-[340px] overflow-y-auto pr-1 text-sm leading-7 text-slate-800 whitespace-pre-line">
                      {readableContent ||
                        'File attached above. No plain-text preview was included with this upload.'}
                    </div>
                  </div>
                )}

                {manuscript.comments && (
                  <div className="mt-4 rounded-xl border border-amber-200/70 bg-amber-50/70 px-4 py-3 text-xs text-amber-950">
                    <span className="font-bold">Author Note: </span>
                    {manuscript.comments}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Author Profile & Admin Decision */}
            <div className="space-y-4">
              {/* Author Card */}
              <div className="rounded-2xl border border-slate-200/80  p-4 sm:p-5">
                <p className="text-[11px] font-bold  tracking-wider ">
                  Author Details
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={authorInfo.avatar}
                    alt={authorInfo.name}
                    className="h-11 w-11 rounded-full object-cover ring-2 ring-primary/30"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-heading text-sm font-bold text-slate-900">
                      {authorInfo.name}
                    </p>
                    <p className="truncate text-xs ">
                      {authorInfo.email}
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs">
                  <div>
                    <p className="text-slate-400">Submitted</p>
                    <p className="font-semibold text-slate-700">
                      {formatDateTime(manuscript.submittedAt)}
                    </p>
                  </div>
                  {/* <div>
                    <p className="text-slate-400">Reference ID</p>
                    <p className="font-mono font-semibold text-slate-700">
                      {manuscript.id}
                    </p>
                  </div> */}
                </div>
              </div>

              {/* Decision Card */}
              {canReview && (
                <div className="rounded-xl border border-slate-200/80 p-3.5 sm:p-4">
                  <p className="text-[11px] font-bold  tracking-wider text-slate-400">
                    Decision
                  </p>
                  {/* <p className="mt-1 text-xs ">
                    Publish this manuscript or mark it as rejected with optional feedback for the author.
                  </p> */}

                  <label className="mt-3 block">
                    <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Feedback for Author (Optional)
                    </span>
                    <textarea
                      rows={4}
                      value={feedback}
                      onChange={e => setFeedback(e.target.value)}
                      placeholder="Write review remarks or publishing instructions for the author..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:bg-white"
                    />
                  </label>

                  <div className="mt-4 grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDecision(STATUS.PUBLISHED)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <CheckIcon size={15} />
                      <span>Published</span>
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDecision(STATUS.REJECTED)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-rose-700 disabled:opacity-50"
                    >
                      <XIcon size={15} />
                      <span>Rejected</span>
                    </button>
                  </div>

                  {manuscript.feedback && (
                    <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
                      <p className="font-semibold text-slate-800">
                        Last Sent Feedback
                      </p>
                      <p className="mt-1 leading-relaxed">{manuscript.feedback}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const STAT_CARDS = [
  {
    key: 'all',
    label: 'Total Manuscripts',
    match: () => true,
    iconBg: 'bg-primary/20 text-dark',
    icon: BookOpen,
  },
  {
    key: 'pending',
    label: 'Pending Review',
    match: m => !['published', 'approved', 'rejected', 'withdrawn'].includes(m.status),
    iconBg: 'bg-amber-100 text-amber-800',
    icon: ClockIcon,
  },
  {
    key: 'published',
    label: 'Published',
    match: m => m.status === 'published' || m.status === 'approved',
    iconBg: 'bg-emerald-100 text-emerald-700',
    icon: CheckIcon,
  },
  {
    key: 'rejected',
    label: 'Rejected',
    match: m => m.status === 'rejected' || m.status === 'withdrawn',
    iconBg: 'bg-rose-100 text-rose-700',
    icon: XIcon,
  },
];

function SortButton({ field, sort, onToggle, children }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(field)}
      className="inline-flex items-center gap-1 hover:text-slate-900"
    >
      {children}
      {sort.key === field ? (
        sort.dir === 'asc' ? (
          <ArrowUp size={12} />
        ) : (
          <ArrowDown size={12} />
        )
      ) : (
        <ArrowUpDown size={12} className="text-slate-300" />
      )}
    </button>
  );
}

function ManuscriptReview() {
  const { users = [], can } = useAuth();
  const canReview = can(PERMISSIONS.MANUSCRIPTS_REVIEW);

  const [refreshTick, setRefreshTick] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'published' | 'rejected'
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sort, setSort] = useState({ key: 'submittedAt', dir: 'desc' });

  const items = useMemo(() => {
    void refreshTick;
    return getAllNormalizedManuscripts();
  }, [refreshTick]);

  const resolveAuthor = useCallback(
    manuscript => {
      const userMatch = users.find(
        u => String(u.id) === String(manuscript.authorId),
      );
      const authorMatch = authors.find(
        a => String(a.id) === String(manuscript.authorId),
      );
      return {
        name:
          manuscript.authorName ||
          userMatch?.name ||
          authorMatch?.name ||
          manuscript.authorId ||
          'Unknown Author',
        email:
          manuscript.authorEmail ||
          userMatch?.email ||
          authorMatch?.email ||
          'author@hosontoprokashon.com',
        avatar:
          userMatch?.avatar ||
          authorMatch?.photo ||
          'https://i.pravatar.cc/100?img=47',
      };
    },
    [users],
  );

  const categories = useMemo(
    () => [...new Set(items.map(m => m.type).filter(Boolean))],
    [items],
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const toDateKey = value => {
      const parsed = parseFlexibleDate(value);
      return parsed ? parsed.toISOString() : '';
    };

    const filtered = items
      .filter(m => {
        if (statusFilter === 'pending') {
          return !['published', 'approved', 'rejected', 'withdrawn'].includes(
            m.status,
          );
        }
        if (statusFilter === 'published') {
          return m.status === 'published' || m.status === 'approved';
        }
        if (statusFilter === 'rejected') {
          return m.status === 'rejected' || m.status === 'withdrawn';
        }
        return true;
      })
      .filter(m => !categoryFilter || m.type === categoryFilter)
      .filter(m => {
        if (!q) return true;
        const author = resolveAuthor(m);
        return [m.title, m.type, m.id, author.name, m.fileName].some(v =>
          String(v ?? '')
            .toLowerCase()
            .includes(q),
        );
      });

    return [...filtered].sort((a, b) => {
      const getVal = item => {
        if (sort.key === 'title') return item.title || '';
        if (sort.key === 'author') return resolveAuthor(item).name;
        if (sort.key === 'type') return item.type || '';
        if (sort.key === 'status') return item.status || '';
        return toDateKey(item.submittedAt);
      };
      const x = getVal(a);
      const y = getVal(b);
      return (x > y ? 1 : x < y ? -1 : 0) * (sort.dir === 'asc' ? 1 : -1);
    });
  }, [items, search, statusFilter, categoryFilter, sort, resolveAuthor]);

  const selectedManuscript = useMemo(
    () => items.find(m => m.id === selectedId) || null,
    [items, selectedId],
  );

  const toggleSort = key =>
    setSort(s => ({
      key,
      dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc',
    }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Author Manuscripts"
        description="Browse author manuscripts, click any row to read or inspect the submission, and publish or reject directly."
      />

      {/* Clickable Summary Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {STAT_CARDS.map(card => {
          const Icon = card.icon;
          const count = items.filter(card.match).length;
          const isActive = statusFilter === card.key;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => setStatusFilter(card.key)}
              className={`rounded-2xl border bg-white p-4 text-left shadow-xs transition ${
                isActive
                  ? 'border-primary ring-2 ring-primary/30'
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    {card.label}
                  </p>
                  <p className="mt-1 font-heading text-2xl font-bold text-slate-900">
                    {count}
                  </p>
                </div>
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg}`}
                >
                  <Icon size={18} />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Directory Table */}
      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="relative w-full sm:max-w-xs">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search book name, author, category..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              aria-label="Filter by category"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-primary"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
              {[
                { key: 'all', label: 'All' },
                { key: 'pending', label: 'Pending' },
                { key: 'published', label: 'Published' },
                { key: 'rejected', label: 'Rejected' },
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                    statusFilter === tab.key
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold  tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">
                  <SortButton field="title" sort={sort} onToggle={toggleSort}>
                    Book Name
                  </SortButton>
                </th>
                <th className="px-4 py-3.5">
                  <SortButton field="author" sort={sort} onToggle={toggleSort}>
                    Author
                  </SortButton>
                </th>
                <th className="px-4 py-3.5">
                  <SortButton field="type" sort={sort} onToggle={toggleSort}>
                    Category
                  </SortButton>
                </th>
                <th className="px-4 py-3.5">Submit as</th>
                <th className="px-4 py-3.5">
                  <SortButton field="submittedAt" sort={sort} onToggle={toggleSort}>
                    Submitted
                  </SortButton>
                </th>
                <th className="px-4 py-3.5">
                  <SortButton field="status" sort={sort} onToggle={toggleSort}>
                    Status
                  </SortButton>
                </th>
                <th className="px-5 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(m => {
                const author = resolveAuthor(m);
                const isFile = m.submitMode === 'file';
                return (
                  <tr
                    key={m.id}
                    onClick={() => setSelectedId(m.id)}
                    className="group cursor-pointer transition hover:bg-amber-50/40"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-dark">
                          <BookOpen size={17} />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-heading text-sm font-bold text-slate-900">
                            {m.title}
                          </p>
                          <p className="line-clamp-1 text-xs ">
                            {m.summary || m.comments || m.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={author.avatar}
                          alt={author.name}
                          className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold  sm:text-sm">
                            {author.name}
                          </p>
                          <p className="truncate text-[11px] ">
                            {author.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-4 py-4">
                      <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold ">
                        {m.type || 'General'}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="space-y-0.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            isFile
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {isFile ? (
                            <>
                              <Upload size={11} /> Upload File
                            </>
                          ) : (
                            <>
                              <PenTool size={11} /> Write Text
                            </>
                          )}
                        </span>
                        <p className="max-w-[160px] truncate text-[11px] text-slate-500">
                          {isFile
                            ? m.fileName || 'Document'
                            : m.wordCount
                              ? `${m.wordCount.toLocaleString()} words`
                              : 'Written manuscript'}
                        </p>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-xs font-medium text-slate-600">
                      {formatDay(m.submittedAt)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4">
                      <StatusPill status={m.status} />
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 transition group-hover:text-dark">
                        <span>Read</span>
                        <ArrowRight
                          size={14}
                          className="transition group-hover:translate-x-0.5"
                        />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="grid gap-3 p-4 md:hidden">
          {rows.map(m => {
            const author = resolveAuthor(m);
            const isFile = m.submitMode === 'file';
            return (
              <div
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-primary"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-heading text-sm font-bold text-slate-900">
                      {m.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {author.name} · {m.type}
                    </p>
                  </div>
                  <StatusPill status={m.status} />
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                    {isFile ? (
                      <>
                        <Upload size={12} /> Upload File
                      </>
                    ) : (
                      <>
                        <PenTool size={12} /> Write Text
                      </>
                    )}
                  </span>
                  <span>Submitted {formatDay(m.submittedAt)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {rows.length === 0 && (
          <div className="py-14 text-center">
            <BookOpen size={36} className="mx-auto text-slate-300" />
            <p className="mt-2 text-sm font-semibold text-slate-700">
              No manuscripts found
            </p>
            {/* <p className="text-xs text-slate-400">
              Try clearing your filters or check back when authors submit new work.
            </p> */}
          </div>
        )}
      </section>

      {selectedManuscript && (
        <ManuscriptModal
          key={selectedManuscript.id}
          manuscript={selectedManuscript}
          authorInfo={resolveAuthor(selectedManuscript)}
          canReview={canReview}
          onClose={() => setSelectedId(null)}
          onDecisionUpdated={() => setRefreshTick(t => t + 1)}
        />
      )}
    </div>
  );
}

export default ManuscriptReview;
