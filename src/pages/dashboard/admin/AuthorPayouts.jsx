import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiEye,
  FiUser,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import DataTable from '../../../components/dashboard/DataTable';
import PageHeader from '../../../components/dashboard/PageHeader';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import { getStoredBooks } from '../../../utils/authorStorage';
import { formatCurrency } from '../../../utils/format';
import {
  getAllPaymentRequests,
  updatePaymentRequestStatus,
} from '../../../utils/paymentStorage';

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

export default function AuthorPayouts() {
  const [requests, setRequests] = useState(getAllPaymentRequests);
  const [requestTab, setRequestTab] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionModal, setActionModal] = useState(null); // { type: 'approve' | 'reject' | 'pay', request }
  const [adminNote, setAdminNote] = useState('');

  const books = getStoredBooks();

  // Reload payment requests
  const reload = () => setRequests(getAllPaymentRequests());

  // 1. Author Book Commissions Calculation (কোন বইয়ে Author কতো টাকা কমিশন পাবে)
  const authorCommissions = useMemo(() => {
    return books
      .filter(b => b.status === 'published' || !b.status)
      .map((book, index) => {
        const units = Number(book.soldCopies) || Math.max(240 - index * 25, 35);
        const price = toNumber(book.price || 250);
        const commissionPercent = Number(book.royaltyPercent) || (15 + (index % 3) * 5); // 15%, 20%, 25%
        const commissionPerCopy =
          Number(book.royaltyPerCopy) || Math.round(price * (commissionPercent / 100));
        const authorCommission = units * commissionPerCopy;
        const totalSales = units * price;

        return {
          id: book.id,
          title: book.title,
          cover: book.cover || book.coverImage,
          author: book.author || 'Author',
          category: book.category || 'General',
          price,
          units,
          commissionPercent,
          commissionPerCopy,
          authorCommission,
          totalSales,
        };
      });
  }, [books]);

  // Overall statistics
  const stats = useMemo(() => {
    const pending = requests.filter(r => r.status === 'Pending');
    const approved = requests.filter(r => r.status === 'Approved');
    const paid = requests.filter(r => r.status === 'Paid');

    const pendingTotal = pending.reduce((sum, r) => sum + Number(r.amount || 0), 0);
    const paidTotal = paid.reduce((sum, r) => sum + Number(r.amount || 0), 0);
    const totalRoyalties = authorCommissions.reduce(
      (sum, item) => sum + item.authorCommission,
      0,
    );
    const uniqueAuthors = new Set(authorCommissions.map(b => b.author)).size;

    return {
      pendingCount: pending.length,
      pendingTotal,
      approvedCount: approved.length,
      paidTotal,
      totalRoyalties,
      uniqueAuthors,
    };
  }, [requests, authorCommissions]);

  // Tab filtered payment requests
  const filteredRequests = useMemo(() => {
    if (requestTab === 'all') return requests;
    return requests.filter(
      r => r.status.toLowerCase() === requestTab.toLowerCase(),
    );
  }, [requests, requestTab]);

  // Request Tabs definition
  const requestTabs = useMemo(
    () => [
      { id: 'all', label: 'All Requests', count: requests.length },
      {
        id: 'pending',
        label: 'Pending',
        count: requests.filter(r => r.status === 'Pending').length,
      },
      {
        id: 'approved',
        label: 'Approved',
        count: requests.filter(r => r.status === 'Approved').length,
      },
      {
        id: 'paid',
        label: 'Paid',
        count: requests.filter(r => r.status === 'Paid').length,
      },
      {
        id: 'rejected',
        label: 'Rejected',
        count: requests.filter(r => r.status === 'Rejected').length,
      },
    ],
    [requests],
  );

  // Status update handler
  const handleUpdateStatus = (id, newStatus, note = '') => {
    updatePaymentRequestStatus(id, newStatus, note);
    reload();
    setActionModal(null);
    setAdminNote('');
    toast.success(`Payment request marked as ${newStatus}.`);
  };

  // Author categories for filter
  const authorOptions = useMemo(
    () => [
      ...new Set(authorCommissions.map(b => b.author)),
    ].map(author => ({ value: author, label: author })),
    [authorCommissions],
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Author Royalties & Payouts"
        description="Monitor author payout requests, manage approval workflows, and inspect per-book author commission breakdown."
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <FiClock size={18} />
          </span>
          <p className="mt-3 text-xs font-medium text-slate-500">Pending Requests</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-heading text-2xl font-bold text-amber-600">
              {formatCurrency(stats.pendingTotal)}
            </span>
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
              {stats.pendingCount} pending
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <FiCheckCircle size={18} />
          </span>
          <p className="mt-3 text-xs font-medium text-slate-500">Total Settled & Paid</p>
          <p className="mt-1 font-heading text-2xl font-bold text-slate-900">
            {formatCurrency(stats.paidTotal)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FiDollarSign size={18} />
          </span>
          <p className="mt-3 text-xs font-medium text-slate-500">Total Royalties Accrued</p>
          <p className="mt-1 font-heading text-2xl font-bold text-slate-900">
            {formatCurrency(stats.totalRoyalties)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
            <FiUsers size={18} />
          </span>
          <p className="mt-3 text-xs font-medium text-slate-500">Published Authors</p>
          <p className="mt-1 font-heading text-2xl font-bold text-slate-900">
            {stats.uniqueAuthors} Authors
          </p>
        </div>
      </div>

      {/* 1. TABLE: Author Payment Requests (কে পেমেন্ট রিকুয়েস্ট দিয়েছেন) */}
      <section>
        <DataTable
          title="Author Payment Requests"
          subtitle="Requests submitted by authors to withdraw their earned book royalties"
          tabs={requestTabs}
          activeTab={requestTab}
          onTabChange={setRequestTab}
          data={filteredRequests}
          searchKeys={['id', 'authorName', 'authorEmail', 'method', 'account']}
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
              sortable: true,
              render: request => (
                <span className="font-medium text-slate-700">#{request.id}</span>
              ),
            },
            {
              key: 'amount',
              header: 'Amount',
              sortable: true,
              sortValue: r => Number(r.amount || 0),
              render: request => (
                <span className="font-bold text-slate-900 text-sm">
                  {formatCurrency(request.amount)}
                </span>
              ),
            },
            {
              key: 'method',
              header: 'Payment Method',
              render: request => (
                <div>
                  <span className="font-medium text-slate-800 block">
                    {request.method}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {request.account}
                  </span>
                </div>
              ),
            },
            {
              key: 'requestedAt',
              header: 'Requested on',
              sortable: true,
              render: request => (
                <div>
                  <span className="text-slate-700 block text-xs">
                    {formatDate(request.requestedAt)}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                    <FiClock size={10} /> {formatTime(request.requestedAt)}
                  </span>
                </div>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              align: 'center',
              render: request => (
                <StatusBadge status={request.status.toLowerCase()} />
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              align: 'right',
              render: request => (
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedRequest(request)}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 transition"
                    title="View details"
                  >
                    <FiEye size={12} />
                    <span>Details</span>
                  </button>

                  {request.status === 'Pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setActionModal({ type: 'approve', request })
                        }
                        className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setActionModal({ type: 'reject', request })
                        }
                        className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {request.status === 'Approved' && (
                    <button
                      type="button"
                      onClick={() => setActionModal({ type: 'pay', request })}
                      className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                    >
                      Mark Paid
                    </button>
                  )}
                </div>
              ),
            },
          ]}
          emptyMessage="No payment requests found."
        />
      </section>

      {/* 2. TABLE: Author Commission by Book (কোন বইয়ে Author কতো টাকা কমিশন পাবে) */}
      <section>
        <DataTable
          title="Author Book Commission Breakdown"
          subtitle="Inspect per-book author royalty rates, units sold, and payable commissions"
          data={authorCommissions}
          searchKeys={['title', 'author', 'category']}
          searchPlaceholder="Search by book, author or category..."
          filters={[
            {
              key: 'author',
              label: 'All Authors',
              options: authorOptions,
            },
          ]}
          headerActions={
            <span className="text-xs text-slate-500 font-normal">
              Total Accrued Royalties:{' '}
              <strong className="font-semibold text-emerald-600">
                {formatCurrency(stats.totalRoyalties)}
              </strong>
            </span>
          }
          columns={[
            {
              key: 'title',
              header: 'Book Details',
              sortable: true,
              render: book => (
                <div className="flex items-center gap-3">
                  <img
                    src={book.cover}
                    alt=""
                    className="h-11 w-8 rounded-lg object-cover shadow-2xs"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block">
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
              header: 'Author',
              sortable: true,
              render: book => (
                <span className="font-medium text-slate-800">{book.author}</span>
              ),
            },
            {
              key: 'price',
              header: 'Selling Price',
              sortable: true,
              sortValue: b => b.price,
              render: book => formatCurrency(book.price),
            },
            {
              key: 'commissionPercent',
              header: 'Commission Rate',
              align: 'center',
              sortable: true,
              sortValue: b => b.commissionPercent,
              render: book => (
                <div>
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                    {book.commissionPercent}%
                  </span>
                  <span className="block text-[11px] text-slate-400 mt-0.5">
                    ৳{book.commissionPerCopy} / copy
                  </span>
                </div>
              ),
            },
            {
              key: 'units',
              header: 'Copies Sold',
              align: 'center',
              sortable: true,
              sortValue: b => b.units,
              render: book => (
                <span className="font-medium text-slate-700">
                  {book.units.toLocaleString('en-US')}
                </span>
              ),
            },
            {
              key: 'totalSales',
              header: 'Total Book Sales',
              sortable: true,
              sortValue: b => b.totalSales,
              render: book => (
                <span className="text-slate-600 font-medium">
                  {formatCurrency(book.totalSales)}
                </span>
              ),
            },
            {
              key: 'authorCommission',
              header: 'Author Commission',
              align: 'right',
              sortable: true,
              sortValue: b => b.authorCommission,
              render: book => (
                <span className="font-bold text-emerald-600 text-sm">
                  {formatCurrency(book.authorCommission)}
                </span>
              ),
            },
            {
              key: 'status',
              header: 'Payout Status',
              align: 'center',
              render: () => (
                <span className="inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
                  Payable
                </span>
              ),
            },
          ]}
          emptyMessage="No book commission records found."
        />
      </section>

      {/* Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-dark/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-medium text-slate-400">
                  Withdrawal Request Details
                </span>
                <h3 className="font-heading text-xl font-bold text-slate-900 mt-0.5">
                  #{selectedRequest.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-3 text-xs md:text-sm">
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4">
                <div>
                  <span className="text-slate-400 block text-xs">Author Name:</span>
                  <strong className="text-slate-900">{selectedRequest.authorName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">Requested Amount:</span>
                  <strong className="text-emerald-600 font-bold text-base">
                    {formatCurrency(selectedRequest.amount)}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">Payment Method:</span>
                  <span className="text-slate-800">{selectedRequest.method}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">Account:</span>
                  <span className="text-slate-800 font-mono">{selectedRequest.account}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">Date:</span>
                  <span className="text-slate-800">{formatDate(selectedRequest.requestedAt)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">Current Status:</span>
                  <StatusBadge status={selectedRequest.status.toLowerCase()} />
                </div>
              </div>

              {selectedRequest.note && (
                <div className="rounded-xl border border-slate-200/80 p-3">
                  <span className="text-xs font-semibold text-slate-700 block mb-1">
                    Author Note:
                  </span>
                  <p className="text-slate-600 text-xs">{selectedRequest.note}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve / Reject / Pay Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-dark/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-heading text-lg font-bold text-slate-900">
              {actionModal.type === 'approve'
                ? 'Approve Payment Request'
                : actionModal.type === 'pay'
                  ? 'Confirm Payment Settlement'
                  : 'Reject Payment Request'}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {actionModal.type === 'approve'
                ? `Approve withdrawal of ${formatCurrency(actionModal.request.amount)} for ${actionModal.request.authorName}.`
                : actionModal.type === 'pay'
                  ? `Confirm that ${formatCurrency(actionModal.request.amount)} has been transferred to ${actionModal.request.account}.`
                  : `Reject withdrawal request #${actionModal.request.id}.`}
            </p>

            <label className="mt-4 block text-xs font-semibold text-slate-700">
              {actionModal.type === 'reject'
                ? 'Reason for Rejection *'
                : 'Transaction Note / Reference (Optional)'}
              <textarea
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                rows="3"
                placeholder={
                  actionModal.type === 'reject'
                    ? 'State the reason to notify author...'
                    : 'e.g. Bank Trx ID / bKash TrxID...'
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 outline-none focus:border-blue-500"
              />
            </label>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setActionModal(null);
                  setAdminNote('');
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (actionModal.type === 'reject' && !adminNote.trim()) {
                    toast.error('Please enter a rejection reason.');
                    return;
                  }
                  const targetStatus =
                    actionModal.type === 'approve'
                      ? 'Approved'
                      : actionModal.type === 'pay'
                        ? 'Paid'
                        : 'Rejected';
                  handleUpdateStatus(
                    actionModal.request.id,
                    targetStatus,
                    adminNote,
                  );
                }}
                className={`rounded-xl px-4 py-2 text-xs font-bold shadow-xs transition ${
                  actionModal.type === 'reject'
                    ? 'bg-rose-600 text-white hover:bg-rose-700'
                    : 'bg-primary text-dark hover:bg-primary-hover'
                }`}
              >
                {actionModal.type === 'approve'
                  ? 'Confirm Approval'
                  : actionModal.type === 'pay'
                    ? 'Mark as Paid'
                    : 'Reject Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
