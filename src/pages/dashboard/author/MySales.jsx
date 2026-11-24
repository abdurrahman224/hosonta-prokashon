import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  FiBookOpen,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiSend,
  FiTrendingUp,
  FiX,
} from 'react-icons/fi';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import PageHeader from '../../../components/dashboard/PageHeader';
import DataTable from '../../../components/dashboard/DataTable';
import { useAuth } from '../../../context/useAuth';
import PaymentRequestModal from '../../../components/dashboard/PaymentRequestModal';
import { getStoredBooks } from '../../../utils/authorStorage';
import {
  MIN_WITHDRAWAL,
  cancelPaymentRequest,
  getCommittedAmount,
  getPaymentRequests,
} from '../../../utils/paymentStorage';

const monthlySales = [
  { month: 'Jan', sales: 120 },
  { month: 'Feb', sales: 180 },
  { month: 'Mar', sales: 145 },
  { month: 'Apr', sales: 230 },
  { month: 'May', sales: 210 },
  { month: 'Jun', sales: 285 },
];

const STATUS_STYLES = {
  Pending: 'bg-amber-50 text-amber-700',
  Approved: 'bg-sky-50 text-sky-700',
  Paid: 'bg-emerald-50 text-emerald-700',
  Rejected: 'bg-rose-50 text-rose-700',
  Cancelled: 'bg-slate-100 text-slate-600',
};

const FILTERS = ['All', 'Pending', 'Approved', 'Paid', 'Rejected', 'Cancelled'];

function toNumber(value) {
  const bengaliDigits = '০১২৩৪৫৬৭৮৯';
  return Number(
    String(value)
      .replace(/[০-৯]/g, digit => bengaliDigits.indexOf(digit).toString())
      .replace(/[^\d]/g, ''),
  ) || 0;
}

const formatMoney = value => `৳${Number(value || 0).toLocaleString('en-US')}`;

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

export default function MySales() {
  const { currentUser } = useAuth();

  // Author books
  const allStoredBooks = getStoredBooks();
  const authorOwnedBooks = allStoredBooks.filter(
    book => String(book.authorId) === String(currentUser.id) && (book.status === 'published' || !book.status),
  );
  const myBooks = authorOwnedBooks.length > 0 ? authorOwnedBooks : allStoredBooks.slice(0, 6);

  // Author Commission calculated per book
  const salesRows = useMemo(
    () =>
      myBooks.map((book, index) => {
        const units = Number(book.soldCopies) || Math.max(220 - index * 35, 30);
        const price = toNumber(book.price || 250);
        const commissionPercent = Number(book.royaltyPercent) || (15 + (index % 3) * 5); // 15%, 20%, 25%
        const commissionPerCopy =
          Number(book.royaltyPerCopy) || Math.round(price * (commissionPercent / 100));
        const authorCommission = units * commissionPerCopy;
        const totalSales = units * price;
        return {
          ...book,
          units,
          price,
          commissionPercent,
          commissionPerCopy,
          authorCommission,
          revenue: totalSales,
        };
      }),
    [myBooks],
  );

  const totalAuthorCommission = useMemo(
    () => salesRows.reduce((sum, row) => sum + row.authorCommission, 0),
    [salesRows],
  );
  const totalCopiesSold = useMemo(
    () => salesRows.reduce((sum, row) => sum + row.units, 0),
    [salesRows],
  );

  // Payment requests state
  const [requests, setRequests] = useState(() =>
    getPaymentRequests(currentUser.id),
  );
  const [filter, setFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);

  const reloadRequests = () => setRequests(getPaymentRequests(currentUser.id));

  const committed = getCommittedAmount(requests);
  const pendingTotal = requests
    .filter(request => request.status === 'Pending')
    .reduce((sum, request) => sum + request.amount, 0);
  const paidTotal = requests
    .filter(request => request.status === 'Paid')
    .reduce((sum, request) => sum + request.amount, 0);
  const availableBalance = Math.max(totalAuthorCommission - committed, 0);

  const visibleRequests =
    filter === 'All'
      ? requests
      : requests.filter(request => request.status === filter);

  const countFor = status =>
    status === 'All'
      ? requests.length
      : requests.filter(request => request.status === status).length;

  const cancelRequest = id => {
    cancelPaymentRequest(id);
    reloadRequests();
    toast.success('Payment request cancelled.');
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Author Sales & Royalties"
        description="Book royalty commissions, total sales revenue, and payment request withdrawals."
      />

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={FiBookOpen}
          title="Total Copies Sold"
          value={totalCopiesSold.toLocaleString('en-US')}
        />
        <SummaryCard
          icon={FiDollarSign}
          title="Total Author Commission"
          value={formatMoney(totalAuthorCommission)}
        />
        <SummaryCard
          icon={FiTrendingUp}
          title="Growth This Month"
          value="+18%"
          valueClass="text-emerald-600"
        />
        <div className="relative overflow-hidden rounded-2xl bg-dark p-5 text-white shadow-xs">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-dark">
            <FiCreditCard className="text-lg" />
          </span>
          <p className="mt-4 text-xs text-white/70">Available Balance</p>
          <p className="mt-1 font-heading text-2xl font-bold text-primary">
            {formatMoney(availableBalance)}
          </p>
          <p className="mt-2.5 border-t border-white/10 pt-2 text-[11px] text-white/60">
            {formatMoney(pendingTotal)} pending · {formatMoney(paidTotal)} paid out
          </p>
        </div>
      </div>

      {/* Monthly Sales Chart */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-lg font-bold text-slate-800">
              Monthly Sales Performance
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Copies sold per month, January to June
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Peak Month</p>
            <p className="font-heading text-base font-bold text-slate-800">
              Jun · 285 copies
            </p>
          </div>
        </div>
        <div className="mt-6 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={monthlySales}
              margin={{ top: 10, right: 8, left: -12, bottom: 0 }}
            >
              <defs>
                <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FDB82E" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#FDB82E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="4 4"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                width={48}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: '#FDB82E', strokeDasharray: '4 4' }}
              />
              <Area
                type="monotone"
                dataKey="sales"
                name="Copies sold"
                stroke="#E59E0B"
                strokeWidth={2.5}
                fill="url(#salesFill)"
                dot={{ r: 4, fill: '#fff', stroke: '#E59E0B', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#E59E0B', stroke: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 1. TABLE: Author Commission by Book (কোন বইয়ে Author কতো টাকা কমিশন পাবে) */}
      <section>
        <DataTable
          title="Author Commission by Book"
          subtitle="Breakdown of book sales, royalty rate, and earnings received per book"
          data={salesRows}
          showSearch={false}
          headerActions={
            salesRows.length > 0 && (
              <span className="text-xs text-slate-500 font-normal">
                Total Royalty:{' '}
                <strong className="font-semibold text-emerald-600">
                  {formatMoney(totalAuthorCommission)}
                </strong>
              </span>
            )
          }
          columns={[
            {
              key: 'title',
              header: 'Book Details',
              // sortable: true,
              render: (book, index) => (
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <span className="font-semibold text-slate-800 block">
                      {book.title}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {book.category || 'Published Edition'}
                    </span>
                  </div>
                </div>
              ),
            },
            {
              key: 'price',
              header: 'Price',
              // sortable: true,
              render: book => formatMoney(book.price),
            },
            {
              key: 'commissionRate',
              header: 'Commission Rate',
              // align: 'center',
              // sortable: true,
              sortValue: book => book.commissionPercent,
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
              // align: 'center',
              // sortable: true,
              render: book => (
                <span className="font-medium text-slate-700">
                  {book.units.toLocaleString('en-US')}
                </span>
              ),
            },
            // {
            //   key: 'revenue',
            //   header: 'Total Sales',
            //   sortable: true,
            //   render: book => (
            //     <span className="text-slate-600 font-medium">
            //       {formatMoney(book.revenue)}
            //     </span>
            //   ),
            // },
            {
              key: 'authorCommission',
              header: 'Author Commission',
              // align: 'right',
              // sortable: true,
              sortValue: book => book.authorCommission,
              render: book => (
                <span className="font-bold text-emerald-600 text-sm">
                  {formatMoney(book.authorCommission)}
                </span>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              // align: 'center',
              render: () => (
                <span className="inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
                  Payable
                </span>
              ),
            },
          ]}
          emptyMessage="You have no published books yet."
        />
      </section>

      {/* Payment Request Action Box */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-dark">
            <FiSend size={19} />
          </span>
          <div>
            <h2 className="font-heading text-lg font-bold text-slate-900">
              Payment Request
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Available to withdraw:{' '}
              <span className="font-semibold text-slate-900">
                {formatMoney(availableBalance)}
              </span>
              . Minimum withdrawal is {formatMoney(MIN_WITHDRAWAL)}.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-dark shadow-xs transition hover:bg-primary-hover focus:outline-none"
        >
          <FiSend /> Request Payment
        </button>
      </section>

      {/* 2. TABLE: Author Payment Requests (Author এর পেমেন্ট রিকুয়েস্টের টেবিল) */}
      <section>
        <DataTable
          title="Payment Requests"
          subtitle="Track the status of all your payout requests and withdrawals"
          tabs={FILTERS.map(item => ({
            id: item,
            label: item,
            count: countFor(item),
          }))}
          activeTab={filter}
          onTabChange={setFilter}
          data={visibleRequests}
          showSearch={false}
          columns={[
            {
              key: 'id',
              header: 'Request ID',
              sortable: true,
              render: request => (
                <span className="font-semibold text-slate-800">#{request.id}</span>
              ),
            },
            {
              key: 'amount',
              header: 'Amount',
              sortable: true,
              sortValue: request => request.amount,
              render: request => (
                <span className="font-semibold text-slate-900">
                  {formatMoney(request.amount)}
                </span>
              ),
            },
            {
              key: 'method',
              header: 'Method & Account',
              render: request => (
                <div>
                  <p className="font-medium text-slate-800">{request.method}</p>
                  <p className="text-xs text-slate-400">{request.account}</p>
                </div>
              ),
            },
            {
              key: 'requestedAt',
              header: 'Requested on',
              sortable: true,
              render: request => (
                <div>
                  <p className="text-slate-700">{formatDate(request.requestedAt)}</p>
                  <p className="flex items-center gap-1 text-xs text-slate-400">
                    <FiClock size={11} /> {formatTime(request.requestedAt)}
                  </p>
                </div>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: request => (
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[request.status] || 'bg-slate-100 text-slate-600'}`}
                >
                  {request.status}
                </span>
              ),
            },
            {
              key: 'action',
              header: 'Action',
              align: 'right',
              render: request =>
                request.status === 'Pending' ? (
                  <button
                    type="button"
                    onClick={() => cancelRequest(request.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                  >
                    <FiX size={14} /> Cancel
                  </button>
                ) : (
                  <span className="text-slate-300">—</span>
                ),
            },
          ]}
          emptyMessage={`No ${filter === 'All' ? '' : filter.toLowerCase()} payment requests yet.`}
        />
      </section>

      {/* Payment Request Modal */}
      <PaymentRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        availableBalance={availableBalance}
        onSubmitted={() => {
          reloadRequests();
          toast.success('Payment request submitted.');
        }}
      />
    </div>
  );
}

function SummaryCard({ icon: Icon, title, value, valueClass = 'text-slate-900' }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
        <Icon size={18} />
      </span>
      <p className="mt-3 text-xs font-medium text-slate-500">{title}</p>
      <p className={`mt-0.5 font-heading text-2xl font-bold ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-lg">
      <p className="text-xs font-semibold text-slate-800">{label}</p>
      <p className="mt-1 text-xs text-slate-600">
        Copies sold:{' '}
        <span className="font-bold text-amber-600">
          {payload[0].value} copies
        </span>
      </p>
    </div>
  );
}
