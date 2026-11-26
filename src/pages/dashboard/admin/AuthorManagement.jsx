import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  FiArrowLeft,
  FiBookOpen,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiCopy,
  FiDollarSign,
  FiEdit2,
  FiEye,
  FiFileText,
  FiUser,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import DataTable from '../../../components/dashboard/DataTable';
import PageHeader from '../../../components/dashboard/PageHeader';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import { useAuth } from '../../../context/useAuth';
import authors from '../../../data/authors';
import { getStoredBooks, saveStoredBooks } from '../../../utils/authorStorage';
import {
  getAllPaymentRequests,
  updatePaymentRequestStatus,
} from '../../../utils/paymentStorage';
import { PERMISSIONS } from '../../../utils/roles';
import {
  getAuthorApplications,
  saveAuthorApplications,
} from '../../../utils/userStorage';

function toNumber(value) {
  const bengaliDigits = '০১২৩৪৫৬৭৮৯';
  return (
    Number(
      String(value || '')
        .replace(/[০-৯]/g, digit => bengaliDigits.indexOf(digit).toString())
        .replace(/[^\d]/g, ''),
    ) || 0
  );
}

const formatDate = iso =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const formatTime = iso =>
  new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

const formatCurrency = value => {
  const num = Number(value || 0);
  return `৳${num.toLocaleString('en-US', {
    maximumFractionDigits: 2,
  })}`;
};

const formatTaka = formatCurrency;

function CopyableAccountNumber({ account, className = '' }) {
  const [copied, setCopied] = useState(false);

  if (!account) return <span className="text-slate-400">—</span>;

  const handleCopy = e => {
    e.stopPropagation();
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(account);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = account;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('Copy failed:', err);
      }
      document.body.removeChild(textarea);
    }
    setCopied(true);
    toast.success(`কপি করা হয়েছে: ${account}`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="font-mono text-xs font-semibold text-slate-800 select-all tracking-wider">
        {account}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        title={copied ? 'Copied!' : 'Copy Account Number'}
        className={`inline-flex h-6 w-6 items-center justify-center rounded-md transition ${
          copied
            ? 'bg-emerald-50 text-emerald-600'
            : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
        }`}
      >
        {copied ? <FiCheck size={13} className="text-emerald-600" /> : <FiCopy size={13} />}
      </button>
    </div>
  );
}

export default function AuthorManagement() {
  const { currentUser, approveAuthorApplication, can } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { id: routeAuthorId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isAllUsersRoute = location.pathname.startsWith('/dashboard/all-users/authors');
  const getAuthorUrl = authorId =>
    isAllUsersRoute
      ? `/dashboard/all-users/authors/${authorId}`
      : `/dashboard/authors/${authorId}`;
  const backUrl = isAllUsersRoute
    ? '/dashboard/all-users/authors'
    : '/dashboard/authors';

  // Tab state synced with URL query (?tab=directory | applications | payouts)
  const tabParam = searchParams.get('tab');
  const validTabs = ['directory', 'applications', 'payouts'];
  const activeTab = validTabs.includes(tabParam) ? tabParam : 'directory';

  const handleTabChange = tabKey => {
    setSearchParams({ tab: tabKey });
  };

  // -------------------------------------------------------------
  // 1. DATA: Verified Authors
  // -------------------------------------------------------------
  const visibleAuthors = useMemo(
    () => (can(PERMISSIONS.AUTHORS_READ) ? authors : []),
    [can],
  );

  // -------------------------------------------------------------
  // 2. DATA: Author Applications
  // -------------------------------------------------------------
  const [applications, setApplications] = useState(getAuthorApplications);
  const [rejectingApp, setRejectingApp] = useState(null);
  const [appFeedback, setAppFeedback] = useState('');

  const decideApplication = (application, decision) => {
    if (!can(PERMISSIONS.AUTHOR_APPLICATIONS_REVIEW)) {
      toast.error('Permission denied to review applications.');
      return;
    }
    if (decision === 'approve') {
      const result = approveAuthorApplication(application.userId);
      if (!result.success) return toast.error(result.message);
    }
    const next = applications.map(item =>
      item.id === application.id
        ? {
            ...item,
            status: decision === 'approve' ? 'approved' : 'rejected',
            feedback: appFeedback,
            reviewedBy: currentUser?.id,
            reviewedAt: new Date().toISOString(),
          }
        : item,
    );
    saveAuthorApplications(next);
    setApplications(next);
    setRejectingApp(null);
    setAppFeedback('');
    toast.success(
      decision === 'approve'
        ? 'Author application approved successfully.'
        : 'Author application rejected.',
    );
  };

  // -------------------------------------------------------------
  // 3. DATA: Author Payouts & Royalties
  // -------------------------------------------------------------
  const [payoutRequests, setPayoutRequests] = useState(getAllPaymentRequests);
  const [payoutFilterTab, setPayoutFilterTab] = useState('all');
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [payoutActionModal, setPayoutActionModal] = useState(null); // { type: 'approve' | 'reject' | 'pay', request }
  const [payoutAdminNote, setPayoutAdminNote] = useState('');

  const reloadPayouts = () => setPayoutRequests(getAllPaymentRequests());

  const [booksList, setBooksList] = useState(getStoredBooks);
  const reloadBooks = () => setBooksList(getStoredBooks());

  // Book royalty editing dialog state & author detail tab
  const [editingBookRoyalty, setEditingBookRoyalty] = useState(null);
  const [authorDetailTab, setAuthorDetailTab] = useState('books'); // 'books' | 'payouts'

  // Author Book Commissions Calculation
  const authorCommissions = useMemo(() => {
    return booksList
      .filter(b => b.status === 'published' || !b.status)
      .map((book, index) => {
        const units = Number(book.soldCopies) || Math.max(240 - index * 25, 35);
        const price = toNumber(book.price || 250);
        const royaltyType = book.royaltyType || 'percentage'; // 'percentage' | 'fixed'
        const commissionPercent =
          book.royaltyPercent !== undefined
            ? Number(book.royaltyPercent)
            : 15 + (index % 3) * 5;
        const commissionPerCopy =
          royaltyType === 'percentage'
            ? Number(((price * commissionPercent) / 100).toFixed(2))
            : 0;
        const fixedAmount =
          royaltyType === 'fixed'
            ? Number(
                book.royaltyFixedAmount !== undefined
                  ? book.royaltyFixedAmount
                  : book.royaltyPerCopy || 0,
              )
            : 0;
        const authorCommission =
          royaltyType === 'fixed'
            ? fixedAmount
            : Number((units * commissionPerCopy).toFixed(2));
        const totalSales = units * price;

        return {
          id: book.id,
          title: book.title,
          cover: book.cover || book.coverImage,
          author: book.author || 'Author',
          authorId: book.authorId,
          category: book.category || 'General',
          price,
          units,
          royaltyType,
          commissionPercent,
          commissionPerCopy,
          fixedAmount,
          authorCommission,
          totalSales,
        };
      });
  }, [booksList]);

  const handleUpdateBookRoyalty = ({
    bookId,
    type,
    price,
    percent,
    fixedAmount,
  }) => {
    const royaltyType = type === 'fixed' ? 'fixed' : 'percentage';
    const numericPrice = Math.max(0, Number(price) || 0);
    const numericPercent = Math.min(100, Math.max(0, Number(percent) || 0));
    const numericFixed = Math.max(0, Number(fixedAmount) || 0);
    const perCopy = Number(((numericPrice * numericPercent) / 100).toFixed(2));

    const currentBooks = getStoredBooks();
    const updated = currentBooks.map(b => {
      if (String(b.id) === String(bookId)) {
        if (royaltyType === 'fixed') {
          return {
            ...b,
            royaltyType: 'fixed',
            royaltyFixedAmount: numericFixed,
          };
        }
        return {
          ...b,
          price: numericPrice,
          royaltyType: 'percentage',
          royaltyPercent: numericPercent,
          royaltyPerCopy: perCopy,
        };
      }
      return b;
    });
    saveStoredBooks(updated);
    reloadBooks();
    setEditingBookRoyalty(null);
    toast.success('Book royalty rate updated successfully.');
  };

  // Authors with dynamic Royalty Earnings & Payable Dues (Total Due)
  const authorsWithStats = useMemo(() => {
    return visibleAuthors.map(author => {
      // 1. Calculate royalty earned from their published books
      const matchingBooks = authorCommissions.filter(
        b =>
          String(b.authorId) === String(author.id) ||
          b.author?.trim().toLowerCase() === author.name?.trim().toLowerCase(),
      );
      const computedEarned = matchingBooks.reduce(
        (sum, b) => sum + (b.authorCommission || 0),
        0,
      );
      // Realistic fallback based on author ID if no books mapped in seed
      const defaultEarned =
        Number(author.id) * 14800 + 12500 || 28000;
      const totalEarned = computedEarned > 0 ? computedEarned : defaultEarned;

      // 2. Calculate paid amount and pending requests
      const authorPayouts = payoutRequests.filter(
        r =>
          String(r.userId) === String(author.id) ||
          r.authorName?.trim().toLowerCase() === author.name?.trim().toLowerCase(),
      );
      const paidAmount = authorPayouts
        .filter(
          r =>
            r.status?.toLowerCase() === 'completed' ||
            r.status?.toLowerCase() === 'paid',
        )
        .reduce((sum, r) => sum + Number(r.amount || 0), 0);

      const pendingAmount = authorPayouts
        .filter(r => r.status?.toLowerCase() === 'pending')
        .reduce((sum, r) => sum + Number(r.amount || 0), 0);

      // 3. Total Due (মোট পাওনা)
      const totalDue = Math.max(totalEarned - paidAmount, 0);
      const totalBooks =
        matchingBooks.length > 0 ? matchingBooks.length : (author.booksCount || 2);

      return {
        ...author,
        booksCount: totalBooks,
        totalEarned,
        paidAmount,
        pendingAmount,
        totalDue,
      };
    });
  }, [visibleAuthors, authorCommissions, payoutRequests]);

  // Current author if visiting /dashboard/authors/:id
  const currentAuthor = useMemo(() => {
    if (!routeAuthorId) return null;
    return authorsWithStats.find(a => String(a.id) === String(routeAuthorId)) || null;
  }, [routeAuthorId, authorsWithStats]);

  // Selected author's books list
  const authorBooksList = useMemo(() => {
    if (!currentAuthor) return [];
    const list = authorCommissions.filter(
      b =>
        String(b.authorId) === String(currentAuthor.id) ||
        b.author?.trim().toLowerCase() === currentAuthor.name?.trim().toLowerCase(),
    );
    if (list.length === 0) {
      return authorCommissions.filter(
        b => String(b.authorId) === String(currentAuthor.id),
      );
    }
    return list;
  }, [currentAuthor, authorCommissions]);

  // Selected author's payout and payment history
  const authorPayoutHistory = useMemo(() => {
    if (!currentAuthor) return [];
    return payoutRequests.filter(
      r =>
        String(r.userId) === String(currentAuthor.id) ||
        r.authorName?.trim().toLowerCase() === currentAuthor.name?.trim().toLowerCase(),
    );
  }, [currentAuthor, payoutRequests]);

  // Overall KPI counts
  const pendingAppsCount = useMemo(
    () => applications.filter(a => a.status === 'pending').length,
    [applications],
  );

  const pendingPayoutsCount = useMemo(
    () => payoutRequests.filter(r => r.status === 'pending').length,
    [payoutRequests],
  );

  const payoutStats = useMemo(() => {
    const pendingTotal = payoutRequests
      .filter(r => r.status === 'pending')
      .reduce((sum, r) => sum + r.amount, 0);

    const paidTotal = payoutRequests
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + r.amount, 0);

    const totalRoyalties = authorCommissions.reduce(
      (sum, item) => sum + item.authorCommission,
      0,
    );

    return {
      pendingTotal,
      paidTotal,
      totalRoyalties,
    };
  }, [payoutRequests, authorCommissions]);

  // Filtered payout requests by tab
  const filteredPayoutRequests = useMemo(() => {
    if (payoutFilterTab === 'all') return payoutRequests;
    if (payoutFilterTab === 'paid') {
      return payoutRequests.filter(r => ['paid', 'completed'].includes(r.status?.toLowerCase()));
    }
    return payoutRequests.filter(r => r.status?.toLowerCase() === payoutFilterTab.toLowerCase());
  }, [payoutRequests, payoutFilterTab]);

  // Payout tabs config
  const payoutTabsConfig = useMemo(() => {
    const all = payoutRequests.length;
    const pending = payoutRequests.filter(r => r.status?.toLowerCase() === 'pending').length;
    const approved = payoutRequests.filter(r => r.status?.toLowerCase() === 'approved').length;
    const paid = payoutRequests.filter(r => ['paid', 'completed'].includes(r.status?.toLowerCase())).length;
    const rejected = payoutRequests.filter(r => r.status?.toLowerCase() === 'rejected').length;
    const cancelled = payoutRequests.filter(r => r.status?.toLowerCase() === 'cancelled').length;

    return [
      { key: 'all', label: `All Requests (${all})` },
      { key: 'pending', label: `Pending (${pending})` },
      { key: 'approved', label: `Approved (${approved})` },
      { key: 'paid', label: `Paid (${paid})` },
      { key: 'rejected', label: `Rejected (${rejected})` },
      { key: 'cancelled', label: `Cancelled (${cancelled})` },
    ];
  }, [payoutRequests]);

  const handlePayoutStatusChange = (requestId, newStatus, note = '') => {
    updatePaymentRequestStatus(requestId, newStatus, note);
    reloadPayouts();
    setPayoutActionModal(null);
    setPayoutAdminNote('');
    toast.success(`Payment request marked as ${newStatus}.`);
  };

  const getPayoutStatusSelectClass = val => {
    switch (val) {
      case 'Paid':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700 focus:border-emerald-500';
      case 'Approved':
        return 'border-blue-200 bg-blue-50 text-blue-700 focus:border-blue-500';
      case 'Rejected':
        return 'border-rose-200 bg-rose-50 text-rose-700 focus:border-rose-500';
      case 'Cancelled':
        return 'border-slate-200 bg-slate-100 text-slate-600 focus:border-slate-400';
      case 'Pending':
      default:
        return 'border-sky-200 bg-sky-50 text-sky-700 focus:border-sky-500';
    }
  };

  const authorOptions = useMemo(
    () =>
      [...new Set(authorCommissions.map(b => b.author))].map(author => ({
        value: author,
        label: author,
      })),
    [authorCommissions],
  );

  // Check admin/finance permissions
  const canViewPayouts = can(PERMISSIONS.MANAGE_USERS) || currentUser?.role === 'admin';

  // Modal Dialog for Editing Book Royalty Rate
  const renderRoyaltyModal = () => {
    if (!editingBookRoyalty) return null;
    const isFixed = editingBookRoyalty.type === 'fixed';
    const numericPrice = Math.max(0, Number(editingBookRoyalty.price) || 0);
    const numericPercent = Math.min(100, Math.max(0, Number(editingBookRoyalty.percent) || 0));
    const numericFixed = Math.max(0, Number(editingBookRoyalty.fixedAmount) || 0);
    const perCopyEarned = Number(((numericPrice * numericPercent) / 100).toFixed(2));
    const totalRoyaltyPreview = isFixed
      ? numericFixed
      : Number((editingBookRoyalty.units * perCopyEarned).toFixed(2));

    return (
      <div
        onClick={() => setEditingBookRoyalty(null)}
        className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-xs sm:items-center sm:p-4"
      >
        <div
          onClick={e => e.stopPropagation()}
          className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
        >
          {/* Sticky Modal Header */}
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-6 sm:py-4">
            <div className="min-w-0">
              <h3 className="font-heading text-base font-bold text-slate-900">
                Update Royalty Rate
              </h3>
              <p className="mt-0.5 line-clamp-1 text-xs text-slate-600">
                Book: <strong>{editingBookRoyalty.title}</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditingBookRoyalty(null)}
              className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              aria-label="Close"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Scrollable Modal Body */}
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
            <div className="space-y-1.5 rounded-xl bg-slate-50 p-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs sm:text-sm ">Book Retail Price:</span>
                <span className="font-semibold text-xs sm:text-sm text-slate-900">
                  {formatCurrency(numericPrice)}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs sm:text-sm ">Total Sold Copies:</span>
                <span className="font-semibold text-xs sm:text-sm text-slate-900">
                  {isFixed ? 'N/A' : `${editingBookRoyalty.units} copies`}
                </span>
              </div>
            </div>

            {/* Model Type Selector: Percentage vs Fixed */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Royalty Model / Type
              </label>
              <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() =>
                    setEditingBookRoyalty(prev => ({
                      ...prev,
                      type: 'percentage',
                    }))
                  }
                  className={`rounded-lg px-2 py-2 text-xs font-semibold transition-all ${
                    !isFixed
                      ? 'bg-primary text-dark shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Percentage (%)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setEditingBookRoyalty(prev => ({
                      ...prev,
                      type: 'fixed',
                    }))
                  }
                  className={`rounded-lg px-2 py-2 text-xs font-semibold transition-all ${
                    isFixed
                      ? 'bg-primary text-dark shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Fixed Amount (৳)
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {!isFixed ? (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700">
                        Book Price (৳)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          value={editingBookRoyalty.price}
                          onChange={e =>
                            setEditingBookRoyalty(prev => ({
                              ...prev,
                              price: e.target.value === '' ? '' : Math.max(0, Number(e.target.value)),
                            }))
                          }
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 pr-8 text-sm text-slate-900 outline-none focus:border-primary"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                          ৳
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700">
                        Royalty Percentage (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editingBookRoyalty.percent}
                          onChange={e =>
                            setEditingBookRoyalty(prev => ({
                              ...prev,
                              percent:
                                e.target.value === ''
                                  ? ''
                                  : Math.min(100, Math.max(0, Number(e.target.value))),
                            }))
                          }
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 pr-8 text-sm text-slate-900 outline-none focus:border-primary"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Calculated author earnings:{' '}
                    <strong>{formatCurrency(perCopyEarned)}</strong> per copy ({numericPercent}% of{' '}
                    {formatCurrency(numericPrice)}).
                  </p>
                </>
              ) : (
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Fixed Total Amount (৳)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 10000"
                      value={editingBookRoyalty.fixedAmount}
                      onChange={e =>
                        setEditingBookRoyalty(prev => ({
                          ...prev,
                          fixedAmount:
                            e.target.value === '' ? '' : Math.max(0, Number(e.target.value)),
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 pr-10 text-sm text-slate-900 outline-none focus:border-primary"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                      ৳
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    One-time / total fixed royalty amount for this book (not multiplied by copies sold).
                  </p>
                </div>
              )}

              {/* Live Preview Box */}
              <div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <span className="text-slate-600">Applied Rate:</span>
                  <span className="text-right font-bold text-slate-900">
                    {isFixed
                      ? `Fixed Amount (${formatCurrency(numericFixed)})`
                      : `${numericPercent}% of ${formatCurrency(numericPrice)} (${formatCurrency(perCopyEarned)} / copy)`}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-1.5 border-t border-slate-200 pt-1.5">
                  <span className="font-semibold text-slate-800">
                    {isFixed
                      ? 'Total Royalty (Fixed):'
                      : `Total Royalty (${editingBookRoyalty.units} copies):`}
                  </span>
                  <span className="font-heading text-sm font-bold text-emerald-700">
                    {formatCurrency(totalRoyaltyPreview)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Modal Footer */}
          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 bg-white px-4 py-3 sm:flex-row sm:justify-end sm:px-6 sm:py-4">
            <button
              type="button"
              onClick={() => setEditingBookRoyalty(null)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition sm:w-auto sm:py-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleUpdateBookRoyalty(editingBookRoyalty)}
              className="w-full rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-dark hover:bg-primary-hover transition shadow-xs sm:w-auto sm:py-2"
            >
              Save & Update
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Modal Dialogs for Viewing Payout Details & Action Confirmations
  const renderPayoutModals = () => (
    <>
      {/* MODAL: View Payout Request Details */}
      {selectedPayout && (
        <div
          onClick={() => setSelectedPayout(null)}
          className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-xs sm:items-center sm:p-4"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3.5 sm:px-6 sm:py-4">
              <h3 className="font-heading text-base font-bold text-slate-900">
                Payment Request Details
              </h3>
              <button
                type="button"
                onClick={() => setSelectedPayout(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 text-xs sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 py-1.5">
                <span className="text-xs sm:text-sm text-slate-500">Request ID</span>
                <span className="font-mono font-bold text-slate-800">
                  #{selectedPayout.id}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 py-1.5">
                <span className="text-xs sm:text-sm text-slate-500">Author</span>
                <span className="font-semibold text-slate-800">
                  {selectedPayout.authorName}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 py-1.5">
                <span className="text-xs sm:text-sm text-slate-500">Amount Requested</span>
                <span className="font-heading text-sm font-bold text-slate-900">
                  {formatCurrency(selectedPayout.amount)}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 py-1.5">
                <span className="text-xs sm:text-sm text-slate-500">Payment Method</span>
                <span className="inline-block rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                  {selectedPayout.method}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 py-1.5">
                <span className="text-xs sm:text-sm text-slate-500">Account Number</span>
                <CopyableAccountNumber account={selectedPayout.account} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 py-1.5">
                <span className="text-xs sm:text-sm text-slate-500">Submission Date</span>
                <span className="text-slate-700">
                  {formatDate(
                    selectedPayout.requestDate || selectedPayout.requestedAt,
                  )}{' '}
                  {formatTime(
                    selectedPayout.requestDate || selectedPayout.requestedAt,
                  )}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 py-1.5">
                <span className="text-xs sm:text-sm text-slate-500">Current Status</span>
                <StatusBadge status={selectedPayout.status} />
              </div>
              {selectedPayout.authorNote && (
                <div className="border-b border-slate-100 py-1.5">
                  <span className="mb-1 block text-slate-500">
                    Author's Note
                  </span>
                  <p className="rounded-lg bg-slate-50 p-2 text-slate-700 italic">
                    "{selectedPayout.authorNote}"
                  </p>
                </div>
              )}
              {selectedPayout.adminNote && (
                <div className="py-1.5">
                  <span className="mb-1 block text-slate-500">
                    Admin Note / Feedback
                  </span>
                  <p className="rounded-lg bg-amber-50 p-2 text-amber-800">
                    {selectedPayout.adminNote}
                  </p>
                </div>
              )}
            </div>

            <div className="flex shrink-0 justify-end border-t border-slate-100 px-4 py-3 sm:px-6 sm:py-4">
              <button
                type="button"
                onClick={() => setSelectedPayout(null)}
                className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 sm:w-auto sm:py-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Payout Action Confirmation (Approve / Reject / Pay) */}
      {payoutActionModal && (
        <div
          onClick={() => {
            setPayoutActionModal(null);
            setPayoutAdminNote('');
          }}
          className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-xs sm:items-center sm:p-4"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3.5 sm:px-6 sm:py-4">
              <h3 className="font-heading text-base font-bold text-slate-900">
                {payoutActionModal.type === 'approve' &&
                  'Approve Payment Request'}
                {payoutActionModal.type === 'reject' && 'Reject Payment Request'}
                {payoutActionModal.type === 'pay' && 'Confirm Payment Settlement'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setPayoutActionModal(null);
                  setPayoutAdminNote('');
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
              <p className="text-xs text-slate-500">
                Author: <strong>{payoutActionModal.request.authorName}</strong> |
                Amount:{' '}
                <strong className="text-slate-900">
                  {formatCurrency(payoutActionModal.request.amount)}
                </strong>
              </p>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  {payoutActionModal.type === 'pay'
                    ? 'Transaction Reference / TrxID Note (Optional)'
                    : 'Admin Note / Feedback (Optional)'}
                </label>
                <textarea
                  value={payoutAdminNote}
                  onChange={e => setPayoutAdminNote(e.target.value)}
                  placeholder={
                    payoutActionModal.type === 'pay'
                      ? 'e.g., bKash TrxID: 9X29A8812'
                      : 'Enter note for the author...'
                  }
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 px-4 py-3 sm:flex-row sm:justify-end sm:px-6 sm:py-4">
              <button
                type="button"
                onClick={() => {
                  setPayoutActionModal(null);
                  setPayoutAdminNote('');
                }}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 sm:w-auto sm:py-2"
              >
                Cancel
              </button>

              {payoutActionModal.type === 'approve' && (
                <button
                  type="button"
                  onClick={() =>
                    handlePayoutStatusChange(
                      payoutActionModal.request.id,
                      'approved',
                      payoutAdminNote,
                    )
                  }
                  className="w-full rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-dark hover:bg-primary-hover shadow-xs sm:w-auto sm:py-2"
                >
                  Approve Request
                </button>
              )}

              {payoutActionModal.type === 'reject' && (
                <button
                  type="button"
                  onClick={() =>
                    handlePayoutStatusChange(
                      payoutActionModal.request.id,
                      'rejected',
                      payoutAdminNote,
                    )
                  }
                  className="w-full rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-rose-700 shadow-xs sm:w-auto sm:py-2"
                >
                  Reject Request
                </button>
              )}

              {payoutActionModal.type === 'pay' && (
                <button
                  type="button"
                  onClick={() =>
                    handlePayoutStatusChange(
                      payoutActionModal.request.id,
                      'completed',
                      payoutAdminNote,
                    )
                  }
                  className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs sm:w-auto sm:py-2"
                >
                  Confirm Paid
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );

  // =========================================================
  // DEDICATED PAGE VIEW: /dashboard/authors/:id
  // =========================================================
  if (routeAuthorId) {
    if (!currentAuthor) {
      return (
        <div className="space-y-6">
          <button
            type="button"
            onClick={() => navigate(backUrl)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <FiArrowLeft size={16} />
            <span>Back to Authors Directory</span>
          </button>
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-base font-semibold text-slate-700">Author Not Found</p>
            <p className="text-xs text-slate-400 mt-1">Please return to the authors directory and select a valid author.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Top Navigation & Status */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate(backUrl)}
            className="inline-flex items-center gap-2 px-4 py-1 text-xs font-semibold text-slate-700  transition shadow-2xs"
          >
            <FiArrowLeft size={16} />
          </button>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
            ● Verified
          </span>
        </div>

        {/* Author Profile Banner Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <img
              src={
                currentAuthor.photo ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60'
              }
              alt={currentAuthor.name}
              className="h-20 w-20 rounded-2xl object-cover shadow-xs border border-slate-200 shrink-0"
            />
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-heading text-xl font-semibold text-slate-900">
                  {currentAuthor.name}
                </h1>
                {/* <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
                  Author ID: #{currentAuthor.id}
                </span> */}
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  {currentAuthor.role || 'Author'}
                </span>
              </div>
              <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                {currentAuthor.bio || 'No biography provided for this author.'}
              </p>
            </div>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <span className="text-xs font-medium text-slate-500 block">
              Published Books
            </span>
            <span className="font-heading text-2xl font-bold text-slate-900 mt-1 block">
              {authorBooksList.length} Books
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Active catalog books
            </span>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <span className="text-xs font-medium text-slate-500 block">
              Sold Copies
            </span>
            <span className="font-heading text-2xl font-bold text-blue-600 mt-1 block">
              {authorBooksList.reduce((sum, b) => sum + (b.units || 0), 0)}{' '}
              copies
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Total copies ordered
            </span>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <span className="text-xs font-medium text-slate-500 block">
              Total Royalty Earned
            </span>
            <span className="font-heading text-2xl font-bold text-purple-600 mt-1 block">
              {formatCurrency(
                authorBooksList.reduce(
                  (sum, b) => sum + (b.authorCommission || 0),
                  0,
                ),
              )}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Earned from book sales
            </span>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-xs">
            <span className="text-xs font-medium text-emerald-800 block">
              Total Due Balance
            </span>
            <span className="font-heading text-2xl font-bold text-emerald-600 mt-1 block">
              {formatCurrency(currentAuthor.totalDue)}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Earned: {formatCurrency(currentAuthor.totalEarned)} · Paid:{' '}
              {formatCurrency(currentAuthor.paidAmount)}
            </span>
          </div>
        </div>

        {/* Author Details Sub-Tabs (Published Books vs Payment History) */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setAuthorDetailTab('books')}
            className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
              authorDetailTab === 'books'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200/70 hover:bg-slate-50'
            }`}
          >
            <FiBookOpen size={15} />
            <span>Published Books & Royalty</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                authorDetailTab === 'books'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {authorBooksList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAuthorDetailTab('payouts')}
            className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
              authorDetailTab === 'payouts'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200/70 hover:bg-slate-50'
            }`}
          >
            <FiDollarSign size={15} />
            <span>Payment & Payout History</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                authorDetailTab === 'payouts'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {authorPayoutHistory.length}
            </span>
          </button>
        </div>

        {/* TAB 1: Books & Royalty Rate Table Card */}
        {authorDetailTab === 'books' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              {/* <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-heading text-base font-bold text-slate-900">
                    Published Books & Royalty Settings
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Manage book royalty rates (percentage or fixed rate per copy) and monitor sales performance.
                  </p>
                </div>
                <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  Total Books: {authorBooksList.length}
                </span>
              </div> */}

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-700">
                    <tr className="whitespace-nowrap">
                      <th className="min-w-[240px] px-4 py-3.5">
                        Book Details
                      </th>
                      <th className="px-4 py-3.5">Unit Price</th>
                      <th className="px-4 py-3.5">Sold Copies</th>
                      <th className="px-4 py-3.5">Royalty Rate</th>
                      <th className="px-4 py-3.5">Total Royalty</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {authorBooksList.length > 0 ? (
                      authorBooksList.map(book => (
                        <tr
                          key={book.id}
                          className="hover:bg-slate-50/60 transition"
                        >
                          <td className="min-w-[240px] px-4 py-3.5">
                            <div className="flex items-center gap-3.5">
                              <img
                                src={book.cover}
                                alt={book.title}
                                className="h-14 w-10 shrink-0 rounded-lg border border-slate-200 object-cover shadow-2xs"
                              />
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 text-sm whitespace-nowrap">
                                  {book.title}
                                </p>
                                <span className="mt-0.5 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                                  {book.category}
                                </span>
                                <span className="mt-0.5 block text-[11px] text-slate-400">
                                  Book ID: #{book.id}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 font-medium text-slate-700">
                            {formatCurrency(book.price)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-slate-800">
                            <span
                              className={`inline-block rounded-md bg-slate-100 px-2 py-1 text-xs ${
                                book.royaltyType === 'fixed' ? 'text-slate-500' : ''
                              }`}
                            >
                              {book.royaltyType === 'fixed' ? 'N/A' : `${book.units} copies`}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5">
                            <div>
                              {book.royaltyType === 'fixed' ? (
                                <>
                                  <span className="inline-block rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                                    Fixed Amount
                                  </span>
                                   
                                </>
                              ) : (
                                <>
                                  <span className="inline-block rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                                    {book.commissionPercent}%
                                  </span>
                                  
                                </>
                              )}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 font-heading font-bold text-sm text-emerald-600">
                            {formatCurrency(book.authorCommission)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                setEditingBookRoyalty({
                                  bookId: book.id,
                                  title: book.title,
                                  price: book.price,
                                  type: book.royaltyType || 'percentage',
                                  percent: book.commissionPercent,
                                  fixedAmount:
                                    book.royaltyType === 'fixed'
                                      ? book.fixedAmount
                                      : book.authorCommission || 10000,
                                  units: book.units,
                                })
                              }
                              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-600 hover:text-white transition shadow-2xs"
                            >
                              <FiEdit2 size={13} />
                              <span>Edit Royalty</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-12 text-center text-slate-400"
                        >
                          No published books found for this author.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Single Author Payment & Payout History Table */}
        {authorDetailTab === 'payouts' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-heading text-base font-bold text-slate-900">
                    Payment & Payout History
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    All royalty withdrawal requests, settlement channels,
                    transaction references, and statuses for{' '}
                    {currentAuthor.name}.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                    Settled: {formatCurrency(currentAuthor.paidAmount)}
                  </span>
                  {currentAuthor.pendingAmount > 0 && (
                    <span className="rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 border border-amber-200">
                      Pending: {formatCurrency(currentAuthor.pendingAmount)}
                    </span>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] border-collapse text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-700">
                    <tr className="whitespace-nowrap">
                      <th className="px-4 py-3.5">Request ID</th>
                      <th className="px-4 py-3.5">Amount</th>
                      <th className="px-4 py-3.5">Payment Method</th>
                      <th className="px-4 py-3.5">Account Number</th>
                      <th className="px-4 py-3.5">Requested Date</th>
                      <th className="px-4 py-3.5">Note / TrxID</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {authorPayoutHistory.length > 0 ? (
                      authorPayoutHistory.map(request => (
                        <tr
                          key={request.id}
                          className="hover:bg-slate-50/60 transition"
                        >
                          <td className="px-4 py-3.5 font-mono font-semibold text-slate-700">
                            #{request.id}
                          </td>
                          <td className="px-4 py-3.5 font-heading font-bold text-slate-900 text-sm">
                            {formatCurrency(request.amount)}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                              {request.method}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <CopyableAccountNumber account={request.account} />
                          </td>
                          <td className="px-4 py-3.5 text-slate-600">
                            <div>
                              <p className="font-medium text-slate-700">
                                {formatDate(
                                  request.requestDate || request.requestedAt,
                                )}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {formatTime(
                                  request.requestDate || request.requestedAt,
                                )}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 max-w-xs">
                            <span className="line-clamp-2 text-slate-600 text-xs">
                              {request.adminNote ||
                                request.note ||
                                request.authorNote ||
                                '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            {(() => {
                              const currentStatus =
                                request.status?.toLowerCase() === 'completed'
                                  ? 'Paid'
                                  : request.status
                                    ? request.status.charAt(0).toUpperCase() +
                                      request.status.slice(1).toLowerCase()
                                    : 'Pending';
                              return (
                                <select
                                  value={currentStatus}
                                  onChange={e =>
                                    handlePayoutStatusChange(
                                      request.id,
                                      e.target.value,
                                    )
                                  }
                                  className={`h-7 rounded-lg border px-2 py-0.5 text-xs font-semibold cursor-pointer outline-none transition ${getPayoutStatusSelectClass(
                                    currentStatus,
                                  )}`}
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Approved">Approved</option>
                                  <option value="Paid">Paid</option>
                                  <option value="Rejected">Rejected</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                              );
                            })()}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setSelectedPayout(request)}
                                title="View Details"
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                              >
                                <FiEye size={16} />
                              </button>

                              {request.status?.toLowerCase() === 'pending' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPayoutActionModal({
                                        type: 'approve',
                                        request,
                                      })
                                    }
                                    title="Approve Request"
                                    className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 transition"
                                  >
                                    <FiCheck size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPayoutActionModal({
                                        type: 'reject',
                                        request,
                                      })
                                    }
                                    title="Reject Request"
                                    className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 transition"
                                  >
                                    <FiX size={16} />
                                  </button>
                                </>
                              )}

                              {request.status?.toLowerCase() === 'approved' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPayoutActionModal({
                                      type: 'pay',
                                      request,
                                    })
                                  }
                                  className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-2xs"
                                >
                                  Mark as Paid
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-12 text-center text-slate-400"
                        >
                          No payment requests or payout history found for this
                          author.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Royalty Edit Modal */}
        {renderRoyaltyModal()}

        {/* Payout Details & Action Modals */}
        {renderPayoutModals()}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Author Management"
        // description="Manage verified author profiles, review author applications, and handle royalties and payout requests."
      />

      {/* Top KPI Summary Cards */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Card 1: Active Authors */}
        <div
          onClick={() => handleTabChange('directory')}
          className={`w-[calc(50%-6px)] sm:w-48 cursor-pointer rounded-xl border bg-white px-3 py-2 transition-all shadow-2xs hover:border-slate-300 ${
            activeTab === 'directory'
              ? 'border-blue-500 ring-1 ring-blue-500/20'
              : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-xs font-medium text-slate-500 truncate">
              Active Authors
            </span>
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
              <FiUsers size={12} />
            </span>
          </div>
          <div className="mt-0.5 flex items-baseline justify-between gap-1">
            <span className="font-heading text-base font-bold text-slate-900 sm:text-lg">
              {visibleAuthors.length}
            </span>
            <span className="text-[10px] text-slate-400">Total Registered</span>
          </div>
        </div>

        {/* Card 2: Pending Applications */}
        <div
          onClick={() => handleTabChange('applications')}
          className={`w-[calc(50%-6px)] sm:w-48 cursor-pointer rounded-xl border bg-white px-3 py-2 transition-all shadow-2xs hover:border-slate-300 ${
            activeTab === 'applications'
              ? 'border-amber-500 ring-1 ring-amber-500/20'
              : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-xs font-medium text-slate-500 truncate">
              Applications
            </span>
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-600">
              <FiFileText size={12} />
            </span>
          </div>
          <div className="mt-0.5 flex items-baseline justify-between gap-1">
            <span className="font-heading text-base font-bold text-amber-600 sm:text-lg">
              {pendingAppsCount}
            </span>
            <span
              className={`text-[10px] font-semibold ${
                pendingAppsCount > 0 ? 'text-amber-600' : 'text-slate-400'
              }`}
            >
              {pendingAppsCount > 0 ? `${pendingAppsCount} Pending` : 'Reviewed'}
            </span>
          </div>
        </div>

        {/* Card 3: Pending Payout Requests */}
        {canViewPayouts && (
          <div
            onClick={() => handleTabChange('payouts')}
            className={`w-[calc(50%-6px)] sm:w-48 cursor-pointer rounded-xl border bg-white px-3 py-2 transition-all shadow-2xs hover:border-slate-300 ${
              activeTab === 'payouts'
                ? 'border-emerald-500 ring-1 ring-emerald-500/20'
                : 'border-slate-200/80'
            }`}
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-xs font-medium text-slate-500 truncate">
                Pending Payouts
              </span>
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-600">
                <FiClock size={12} />
              </span>
            </div>
            <div className="mt-0.5 flex items-baseline justify-between gap-1">
              <span className="font-heading text-base font-bold text-slate-900 sm:text-lg">
                {formatTaka(payoutStats.pendingTotal)}
              </span>
              <span
                className={`text-[10px] font-semibold ${
                  pendingPayoutsCount > 0 ? 'text-amber-600' : 'text-slate-400'
                }`}
              >
                {pendingPayoutsCount} Req
              </span>
            </div>
          </div>
        )}

        {/* Card 4: Settled Royalties */}
        {canViewPayouts && (
          <div
            onClick={() => handleTabChange('payouts')}
            className="w-[calc(50%-6px)] sm:w-48 cursor-pointer rounded-xl border border-slate-200/80 bg-white px-3 py-2 shadow-2xs transition-all hover:border-slate-300"
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-xs font-medium text-slate-500 truncate">
                Settled Royalties
              </span>
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                <FiCheckCircle size={12} />
              </span>
            </div>
            <div className="mt-0.5 flex items-baseline justify-between gap-1">
              <span className="font-heading text-base font-bold text-emerald-600 sm:text-lg">
                {formatTaka(payoutStats.paidTotal)}
              </span>
              <span className="text-[10px] font-medium text-emerald-600">
                Paid Total
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => handleTabChange('directory')}
          className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
            activeTab === 'directory'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200/70 hover:bg-slate-50'
          }`}
        >
          <FiUsers size={16} />
          <span>Authors Directory</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
              activeTab === 'directory'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {visibleAuthors.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('applications')}
          className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
            activeTab === 'applications'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200/70 hover:bg-slate-50'
          }`}
        >
          <FiFileText size={16} />
          <span>Author Applications</span>
          {pendingAppsCount > 0 ? (
            <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-bold text-white animate-pulse">
              {pendingAppsCount} New
            </span>
          ) : (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                activeTab === 'applications'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {applications.length}
            </span>
          )}
        </button>

        {canViewPayouts && (
          <button
            type="button"
            onClick={() => handleTabChange('payouts')}
            className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
              activeTab === 'payouts'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200/70 hover:bg-slate-50'
            }`}
          >
            <FiDollarSign size={16} />
            <span>Royalties & Payouts</span>
            {pendingPayoutsCount > 0 && (
              <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-white">
                {pendingPayoutsCount} Pending
              </span>
            )}
          </button>
        )}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: AUTHORS DIRECTORY                                  */}
      {/* ========================================================= */}
      {activeTab === 'directory' && (
        <section className="space-y-4">
          <DataTable
            title="Verified Authors Directory"
            subtitle="Catalog of active and approved publishing authors with royalty balances"
            data={authorsWithStats}
            searchKeys={['name', 'bio']}
            searchPlaceholder="Search author name or bio..."
            onRowClick={author => navigate(getAuthorUrl(author.id))}
            selectable={false}
            columns={[
              {
                key: 'name',
                header: 'Author Details',
                width: '240px',
                render: author => (
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        author.photo ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60'
                      }
                      alt={author.name}
                      className="h-10 w-10 shrink-0 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <span className="font-semibold text-slate-900 block text-xs">
                        {author.name}
                      </span>
                     
                    </div>
                  </div>
                ),
              },
              {
                key: 'bio',
                header: 'Biography',
                render: author => (
                  <span
                    className="block truncate max-w-xs text-xs text-slate-600"
                    title={author.bio}
                  >
                    {author.bio || 'No biography provided'}
                  </span>
                ),
              },
              {
                key: 'booksCount',
                header: 'Published Books',
                width: '160px',
                render: author => (
                  <span className="text-xs font-medium text-slate-800">
                    {author.booksCount || 0} Books
                  </span>
                ),
              },
              {
                key: 'totalDue',
                header: 'Total Due',
                render: author => (
                  <span className="text-xs font-semibold text-slate-900">
                    {formatTaka(author.totalDue)}
                  </span>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                width: '120px',
                render: () => <StatusBadge status="approved" />,
              },
            ]}
            emptyMessage="No authors found."
          />
        </section>
      )}

      {/* ========================================================= */}
      {/* TAB 2: AUTHOR APPLICATIONS                                */}
      {/* ========================================================= */}
      {activeTab === 'applications' && (
        <section className="space-y-4">
          <DataTable
            title="Author Applications Queue"
            subtitle="লেখক হওয়ার জন্য পাঠকদের জমাকৃত আবেদনসমূহ পর্যালোচনা ও সিদ্ধান্ত গ্রহণ"
            data={applications}
            searchKeys={['name', 'identity', 'sample', 'motivation']}
            searchPlaceholder="Search applicant, identity or sample..."
            filters={[
              {
                key: 'status',
                label: 'All Statuses',
                options: [
                  { value: 'pending', label: 'Pending' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' },
                ],
              },
            ]}
            columns={[
              {
                key: 'name',
                header: 'Applicant',
                sortable: true,
                render: item => (
                  <div>
                    <span className="font-semibold text-slate-800 block">
                      {item.name}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      User ID: #{item.userId}
                    </span>
                  </div>
                ),
              },
              {
                key: 'identity',
                header: 'Identity / Occupation',
                render: item => (
                  <span className="text-xs text-slate-700">
                    {item.identity || 'N/A'}
                  </span>
                ),
              },
              {
                key: 'sample',
                header: 'Sample Work / Intro',
                render: item => (
                  <span className="line-clamp-2 max-w-sm text-xs text-slate-600">
                    {item.sample || item.motivation || 'No sample provided'}
                  </span>
                ),
              },
              {
                key: 'submittedAt',
                header: 'Submission Date',
                render: item => (
                  <span className="text-xs text-slate-500">
                    {item.submittedAt ? formatDate(item.submittedAt) : 'Recent'}
                  </span>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: item => <StatusBadge status={item.status} />,
              },
            ]}
            rowActions={application =>
              application.status === 'pending'
                ? [
                    {
                      label: 'Approve',
                      onClick: () => decideApplication(application, 'approve'),
                    },
                    {
                      label: 'Reject',
                      danger: true,
                      onClick: () => setRejectingApp(application),
                    },
                  ]
                : []
            }
            emptyMessage="No author applications found."
          />
        </section>
      )}

      {/* ========================================================= */}
      {/* TAB 3: ROYALTIES & PAYOUTS                                */}
      {/* ========================================================= */}
      {activeTab === 'payouts' && canViewPayouts && (
        <section className="space-y-8">
          {/* 3A. Payment Requests Table */}
          <DataTable
            title="Author Payment Requests"
            subtitle="Review and process author royalty withdrawal requests"
            tabs={payoutTabsConfig}
            activeTab={payoutFilterTab}
            onTabChange={setPayoutFilterTab}
            data={filteredPayoutRequests}
            searchKeys={[
              'id',
              'authorName',
              'authorEmail',
              'method',
              'account',
            ]}
            searchPlaceholder="Search author, request ID or account..."
            columns={[
              {
                key: 'authorName',
                header: 'Author Details',
                sortable: true,
                render: request => (
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-semibold text-xs">
                      <FiUser size={15} />
                    </span>
                    <div>
                      <span className="font-semibold text-slate-800 block">
                        {request.authorName}
                      </span>
                      <span className="text-xs text-slate-400">
                        {request.authorEmail || `ID: ${request.userId}`}
                      </span>
                    </div>
                  </div>
                ),
              },
              {
                key: 'id',
                header: 'Request ID',
                render: request => (
                  <span className="font-mono text-xs font-semibold text-slate-600">
                    #{request.id}
                  </span>
                ),
              },
              {
                key: 'amount',
                header: 'Amount',
                sortable: true,
                sortValue: request => request.amount,
                render: request => (
                  <span className="font-heading text-sm font-bold text-slate-900">
                    {formatCurrency(request.amount)}
                  </span>
                ),
              },
              {
                key: 'method',
                header: 'Payment Method',
                render: request => (
                  <span className="inline-block rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {request.method}
                  </span>
                ),
              },
              {
                key: 'account',
                header: 'Account Number',
                render: request => (
                  <span className="font-mono text-xs font-semibold text-slate-800">
                    {request.account}
                  </span>
                ),
              },
              {
                key: 'requestDate',
                header: 'Requested Date',
                sortable: true,
                render: request => (
                  <div className="text-xs">
                    <p className="font-medium text-slate-700">
                      {formatDate(request.requestDate)}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {formatTime(request.requestDate)}
                    </p>
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: request => {
                  const currentStatus =
                    request.status?.toLowerCase() === 'completed'
                      ? 'Paid'
                      : request.status
                      ? request.status.charAt(0).toUpperCase() + request.status.slice(1).toLowerCase()
                      : 'Pending';

                  return (
                    <select
                      value={currentStatus}
                      onChange={e => handlePayoutStatusChange(request.id, e.target.value)}
                      className={`h-7 rounded-lg border px-2 py-0.5 text-xs font-semibold cursor-pointer outline-none transition ${getPayoutStatusSelectClass(
                        currentStatus
                      )}`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Paid">Paid</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  );
                },
              },
              {
                key: 'actions',
                header: 'Actions',
                align: 'right',
                render: request => (
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedPayout(request)}
                      title="View Details"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <FiEye size={16} />
                    </button>

                    {request.status?.toLowerCase() === 'pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setPayoutActionModal({ type: 'approve', request })
                          }
                          title="Approve Request"
                          className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50"
                        >
                          <FiCheck size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setPayoutActionModal({ type: 'reject', request })
                          }
                          title="Reject Request"
                          className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50"
                        >
                          <FiX size={16} />
                        </button>
                      </>
                    )}

                    {request.status?.toLowerCase() === 'approved' && (
                      <button
                        type="button"
                        onClick={() =>
                          setPayoutActionModal({ type: 'pay', request })
                        }
                        className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        Mark as Paid
                      </button>
                    )}
                  </div>
                ),
              },
            ]}
            emptyMessage="No payment requests found."
          />

          {/* 3B. Per-Book Author Commission Table */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="font-heading text-lg font-bold text-slate-900">
                  Book-wise Author Royalty Breakdown
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track real-time copies sold and royalty earnings per
                  publication.
                </p>
              </div>
            </div>

            <DataTable
              data={authorCommissions}
              searchKeys={['title', 'author', 'category']}
              searchPlaceholder="Search book title, author, or category..."
              filters={[
                {
                  key: 'author',
                  label: 'All Authors',
                  options: authorOptions,
                },
              ]}
              columns={[
                {
                  key: 'title',
                  header: 'Book Title',
                  sortable: true,
                  render: book => (
                    <div className="flex items-center gap-3">
                      <img
                        src={book.cover}
                        alt={book.title}
                        className="h-10 w-8 rounded object-cover shadow-2xs border border-slate-200"
                      />
                      <div>
                        <span className="font-semibold text-slate-800 line-clamp-1">
                          {book.title}
                        </span>
                        <span className="text-xs text-slate-400">
                          {book.category}
                        </span>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'author',
                  header: 'Author Name',
                  sortable: true,
                  render: book => (
                    <span className="font-medium text-slate-700 text-xs">
                      {book.author}
                    </span>
                  ),
                },
                {
                  key: 'price',
                  header: 'Unit Price',
                  sortable: true,
                  sortValue: b => b.price,
                  render: book => (
                    <span className="text-xs text-slate-600">
                      {formatCurrency(book.price)}
                    </span>
                  ),
                },
                {
                  key: 'units',
                  header: 'Sold Copies',
                  sortable: true,
                  sortValue: b => (b.royaltyType === 'fixed' ? -1 : b.units),
                  render: book => (
                    <span
                      className={`font-semibold text-xs ${
                        book.royaltyType === 'fixed' ? 'text-slate-400' : 'text-slate-800'
                      }`}
                    >
                      {book.royaltyType === 'fixed' ? 'N/A' : `${book.units} copies`}
                    </span>
                  ),
                },
                {
                  key: 'commissionPercent',
                  header: 'Royalty Rate',
                  render: book => (
                    <div>
                      {book.royaltyType === 'fixed' ? (
                        <>
                          <span className="inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                            Fixed Amount
                          </span>
                          <span className="block text-[11px] text-slate-400 mt-0.5">
                            Total: {formatCurrency(book.fixedAmount)}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="inline-block rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                            {book.commissionPercent}%
                          </span>
                          <span className="block text-[11px] text-slate-400 mt-0.5">
                            ({formatCurrency(book.commissionPerCopy)} / copy)
                          </span>
                        </>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'totalSales',
                  header: 'Total Book Sales',
                  sortable: true,
                  sortValue: b => b.totalSales,
                  render: book => (
                    <span className="text-xs text-slate-500">
                      {formatCurrency(book.totalSales)}
                    </span>
                  ),
                },
                {
                  key: 'authorCommission',
                  header: 'Author Royalty Earned',
                  sortable: true,
                  sortValue: b => b.authorCommission,
                  render: book => (
                    <span className="font-heading text-sm font-bold text-emerald-600">
                      {formatCurrency(book.authorCommission)}
                    </span>
                  ),
                },
              ]}
              emptyMessage="No book commission records found."
            />
          </section>
        </section>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: Reject Application Reason Modal                  */}
      {/* ========================================================= */}
      {rejectingApp && (
        <div
          onClick={() => {
            setRejectingApp(null);
            setAppFeedback('');
          }}
          className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-xs sm:items-center sm:p-4"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3.5 sm:px-6 sm:py-4">
              <div>
                <h2 className="font-heading text-base font-bold text-slate-900 sm:text-lg">
                  Reason for Rejection
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Applicant: <strong>{rejectingApp.name}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRejectingApp(null);
                  setAppFeedback('');
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <FiX size={18} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              <textarea
                value={appFeedback}
                onChange={event => setAppFeedback(event.target.value)}
                rows="4"
                placeholder="Enter specific reason for rejecting this application..."
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              />
            </div>
            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 px-4 py-3 sm:flex-row sm:justify-end sm:px-6 sm:py-4">
              <button
                type="button"
                onClick={() => {
                  setRejectingApp(null);
                  setAppFeedback('');
                }}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 sm:w-auto sm:py-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  appFeedback.trim()
                    ? decideApplication(rejectingApp, 'reject')
                    : toast.error('Please specify a rejection reason.')
                }
                className="w-full rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-rose-700 shadow-xs sm:w-auto sm:py-2"
              >
                Reject Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payout Details & Action Confirmation Modals */}
      {renderPayoutModals()}

      {/* MODAL: Edit Book Royalty Rate Dialog */}
      {renderRoyaltyModal()}
    </div>
  );
}
