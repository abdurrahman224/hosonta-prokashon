import { useState, useMemo } from 'react';
import {
  FiArrowLeft,
  FiBookOpen,
  FiCheckCircle,
  FiCreditCard,
  FiDollarSign,
  FiEdit2,
  FiEye,
  FiMail,
  FiMapPin,
  FiPhone,
  FiPlus,
  FiPrinter,
  FiSearch,
  FiShoppingBag,
  FiTrendingUp,
  FiUserCheck,
  FiX,
  FiAlertTriangle,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../../components/dashboard/PageHeader';
import { useAuth } from '../../../context/useAuth';
import { useData } from '../../../context/useData';
import { ROLES } from '../../../utils/roles';
import {
  getStoredShops,
} from '../../../data/shops';
import { initialCounterOrders } from '../employee/counterOrders/dummyData';
import AddShopModal from '../../../components/dashboard/AddShopModal';

const DUE_PAYMENTS_KEY = 'hosonta_wholesale_due_payments_v1';

function getStoredDuePayments() {
  try {
    const raw = localStorage.getItem(DUE_PAYMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDuePaymentReceipt(receipt) {
  try {
    const prev = getStoredDuePayments();
    const next = [receipt, ...prev];
    localStorage.setItem(DUE_PAYMENTS_KEY, JSON.stringify(next));
    return next;
  } catch {
    return [receipt];
  }
}

/* ------------------------------------------------------------------ */
/* Constants & Helpers                                                 */
/* ------------------------------------------------------------------ */

const COMPANY = {
  name: 'Hosonta Prokashon',
  legalName: 'Hosonta Prokashon',
  address: '38/2 Mannan Market (2nd Floor), Banglabazar, Dhaka-1100',
  hotline: '01628-037591',
  email: 'support@hosontoprokashon.com',
  website: 'www.hosontoprokashon.com',
};

const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80';

const toEnDigits = value => {
  const bnDigits = '০১২৩৪৫৬৭৮৯';
  return String(value ?? '').replace(/[০-৯]/g, d =>
    String(bnDigits.indexOf(d)),
  );
};

const formatCurrency = value => {
  const num = Number(value || 0);
  return `৳${num.toLocaleString('en-US', {
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = isoString => {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
};

const paymentLabel = (m, long = false) => {
  if (m === 'cash') return 'Cash';
  if (m === 'bkash') return 'bKash';
  if (m === 'bank') return long ? 'Bank Transfer' : 'Bank';
  if (m === 'nagad') return long ? 'Nagad Digital' : 'Nagad';
  return m || 'Cash';
};

const toShopRouteParam = (name = '') =>
  encodeURIComponent(String(name).trim().replace(/\s+/g, '-'));

// Resolves book details (cover, title, author, price) from the books dataset
function resolveOrderItem(item, allBooks = []) {
  const matchedBook = allBooks.find(
    b => String(b.id) === String(item.bookId || item.id),
  );

  return {
    ...item,
    cover:
      item.cover ||
      item.image ||
      matchedBook?.cover ||
      matchedBook?.image ||
      FALLBACK_COVER,
    title: item.title || matchedBook?.title || 'Book Title',
    author: item.author || matchedBook?.author || 'Author',
    category: item.category || matchedBook?.category || 'Literature',
    price: Number(item.price ?? matchedBook?.price ?? 0),
    quantity: Number(item.quantity ?? item.qty ?? 1),
  };
}

// Same order -> numbers logic used by table rows & mobile cards
function getOrderFigures(order) {
  const items = order.items || [];
  const subtotal =
    order.subtotal ||
    items.reduce((s, i) => s + Number(i.price * i.quantity), 0);
  const commission = Number(order.commission || 0);
  const total = Number(order.total || subtotal);
  const paid =
    order.amountPaid !== undefined ? Number(order.amountPaid) : total;
  const due =
    order.dueAmount !== undefined
      ? Number(order.dueAmount)
      : Math.max(0, total - paid);
  const copies = items.reduce((s, i) => s + Number(i.quantity || 1), 0);
  return { items, subtotal, commission, total, paid, due, copies };
}

const inputCls =
  'w-full rounded-lg border border-dark/15 px-3 py-2 text-sm text-dark focus:border-primary focus:outline-none';

// Shared modal shell: bottom-sheet on mobile, centered dialog on >= sm
function ModalShell({ children, maxW = 'max-w-lg' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs sm:items-center sm:p-4">
      <div
        className={`flex max-h-[95vh] w-full ${maxW} flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-2xl`}
      >
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: Counter Invoice / Cash Memo Modal                            */
/* ------------------------------------------------------------------ */

function CounterOrderInvoiceModal({ order, shop, allBooks = [], onClose }) {
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'invoice'

  if (!order) return null;

  const resolvedItems = (order.items || []).map(item =>
    resolveOrderItem(item, allBooks),
  );

  const subtotal =
    order.subtotal ||
    resolvedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const commission = Number(order.commission || 0);
  const commissionDeduction =
    order.commissionAmount !== undefined
      ? order.commissionAmount
      : Math.round((subtotal * commission) / 100);

  const grandTotal = Number(
    order.total || Math.max(0, subtotal - commissionDeduction),
  );
  const paidAmount =
    order.amountPaid !== undefined ? Number(order.amountPaid) : grandTotal;
  const dueAmount =
    order.dueAmount !== undefined
      ? Number(order.dueAmount)
      : Math.max(0, grandTotal - paidAmount);

  const handlePrint = () => {
    window.print();
  };

  const tabBtn = (key, label, icon) => (
    <button
      type="button"
      onClick={() => setActiveTab(key)}
      className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition sm:flex-none ${
        activeTab === key
          ? 'bg-white text-dark shadow-xs'
          : 'text-dark/60 hover:text-dark'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs sm:items-center sm:p-4 print:static print:bg-white print:p-0">
      <div className="flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-2xl print:max-h-none print:w-full print:overflow-visible print:rounded-none print:shadow-none">
        {/* Header - Screen Only */}
        <div className="flex flex-col gap-3 border-b border-dark/10 px-4 py-3 sm:px-5 sm:py-4 lg:flex-row lg:items-center lg:justify-between print:hidden">
          {/* Row 1: title + close (close only on small screens here) */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-dark">
                <FiShoppingBag className="text-xl" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <h3 className="font-heading text-base font-bold text-dark sm:text-lg">
                    Counter Invoice: {order.id}
                  </h3>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      dueAmount > 0
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {dueAmount > 0
                      ? `Due: ${formatCurrency(dueAmount)}`
                      : 'Fully Paid'}
                  </span>
                </div>
                <p className="truncate text-xs text-dark/60">
                  Shop: {order.shopName || shop?.shopName || 'Counter Sale'} •
                  Date: {formatDate(order.date)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-2 text-dark/50 transition hover:bg-dark/5 hover:text-dark lg:hidden"
              aria-label="Close modal"
            >
              <FiX className="text-lg" />
            </button>
          </div>

          {/* Row 2: tabs + print (+ close on large screens) */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex w-full rounded-lg bg-dark/5 p-1 sm:w-auto">
              {tabBtn('details', 'Invoice Details')}
              {tabBtn(
                'invoice',
                'Cash Memo',
                <FiPrinter className="text-xs" />,
              )}
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-dark shadow-2xs transition hover:bg-primary-hover sm:flex-none"
            >
              <FiPrinter className="text-sm" /> Print Invoice
            </button>

            <button
              type="button"
              onClick={onClose}
              className="hidden rounded-lg p-2 text-dark/50 transition hover:bg-dark/5 hover:text-dark lg:block"
              aria-label="Close modal"
            >
              <FiX className="text-lg" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-6 print:overflow-visible print:p-0">
          {activeTab === 'details' ? (
            <div className="space-y-5 print:hidden sm:space-y-6">
              {/* Order Info & Store Summary */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                <div className="min-w-0 rounded-xl border border-dark/10 bg-cream/50 p-3.5">
                  <span className="text-xs font-semibold text-dark/60">
                    Shop Name
                  </span>
                  <p className="mt-1 break-words font-heading text-base font-bold text-dark">
                    {order.shopName || shop?.shopName || '—'}
                  </p>
                  <p className="text-xs text-dark/60">
                    {order.representative || shop?.representative || 'Owner'}
                  </p>
                </div>

                <div className="min-w-0 rounded-xl border border-dark/10 bg-cream/50 p-3.5">
                  <span className="text-xs font-semibold text-dark/60">
                    Contact Number
                  </span>
                  <p className="mt-1 break-words font-mono text-sm font-bold text-dark">
                    {toEnDigits(order.phone || shop?.phone || '—')}
                  </p>
                  <p className="break-words text-xs text-dark/60">
                    {order.address || shop?.address || 'Banglabazar'}
                  </p>
                </div>

                <div className="min-w-0 rounded-xl border border-dark/10 bg-cream/50 p-3.5">
                  <span className="text-xs font-semibold text-dark/60">
                    Payment Method
                  </span>
                  <p className="mt-1 font-heading text-sm font-bold capitalize text-dark">
                    {paymentLabel(order.paymentMethod, true)}
                  </p>
                  <p className="text-xs text-dark/60">
                    Served by: {order.servedBy || 'Counter Sales'}
                  </p>
                </div>

                <div className="min-w-0 rounded-xl border border-dark/10 bg-cream/50 p-3.5">
                  <span className="text-xs font-semibold text-dark/60">
                    Total Invoice Value
                  </span>
                  <p className="mt-1 font-heading text-base font-bold text-emerald-700">
                    {formatCurrency(grandTotal)}
                  </p>
                  <p className="text-xs font-semibold text-dark/60">
                    Commission: {commission}% ({formatCurrency(commissionDeduction)})
                  </p>
                </div>
              </div>

              {/* Purchased Books */}
              <div className="rounded-xl border border-dark/10 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dark/10 bg-dark/2 px-3 py-3 sm:px-4">
                  <h4 className="flex items-center gap-2 font-heading text-sm font-bold text-dark">
                    <FiBookOpen className="text-base text-primary" />
                    Ordered Books ({resolvedItems.length}{' '}
                    {resolvedItems.length === 1 ? 'Title' : 'Titles'})
                  </h4>
                  <span className="text-xs font-medium text-dark/60">
                    Total Copies:{' '}
                    <strong className="text-dark">
                      {resolvedItems.reduce((s, i) => s + i.quantity, 0)}
                    </strong>
                  </span>
                </div>

                <div className="divide-y divide-dark/5">
                  {resolvedItems.map((item, idx) => {
                    const itemTotal = item.price * item.quantity;
                    return (
                      <div
                        key={idx}
                        className="flex items-start justify-between gap-3 p-3 transition hover:bg-cream/30 sm:items-center sm:p-3.5"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <img
                            src={item.cover}
                            alt={item.title}
                            className="h-14 w-10 shrink-0 rounded border border-dark/10 object-cover shadow-2xs"
                            onError={e => {
                              e.currentTarget.src = FALLBACK_COVER;
                            }}
                          />
                          <div className="min-w-0">
                            <h5 className="break-words font-heading text-sm font-bold text-dark">
                              {item.title}
                            </h5>
                            <p className="text-xs text-dark/60">
                              Author: {item.author} • Category: {item.category}
                            </p>
                            <span className="text-xs text-dark/70">
                              Cover Price: {formatCurrency(item.price)} ×{' '}
                              <strong className="text-dark">
                                {item.quantity} {item.quantity === 1 ? 'copy' : 'copies'}
                              </strong>
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <span className="font-heading text-sm font-bold text-dark">
                            {formatCurrency(itemTotal)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
                <div className="border-t border-dark/10 bg-cream/40 p-3 sm:p-4">
                  <div className="space-y-1.5 text-xs sm:ml-auto sm:max-w-xs">
                    <div className="flex justify-between gap-3 text-dark/70">
                      <span>Subtotal:</span>
                      <span className="font-mono">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between gap-3 text-emerald-700">
                      <span>Wholesale Commission ({commission}%):</span>
                      <span className="font-mono">
                        -{formatCurrency(commissionDeduction)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3 border-t border-dark/10 pt-1.5 font-heading text-sm font-bold text-dark">
                      <span>Grand Total:</span>
                      <span className="text-emerald-700">
                        {formatCurrency(grandTotal)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3 text-dark/70">
                      <span>Paid:</span>
                      <span className="font-mono font-bold text-dark">
                        {formatCurrency(paidAmount)}
                      </span>
                    </div>
                    {dueAmount > 0 ? (
                      <div className="flex justify-between gap-3 border-t border-amber-200 pt-1 font-bold text-amber-800">
                        <span>Due Amount:</span>
                        <span className="font-mono">{formatCurrency(dueAmount)}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between gap-3 font-bold text-emerald-700">
                        <span>Due:</span>
                        <span>Paid</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {order.notes && (
                <div className="rounded-xl border border-dark/10 bg-amber-50/50 p-3.5 text-xs text-dark/80">
                  <span className="font-bold text-dark">Invoice Note:</span>{' '}
                  {order.notes}
                </div>
              )}
            </div>
          ) : null}

          {/* Printable Official Cash Memo (Tab 2 or Print View) */}
          <div
            className={`rounded-2xl border border-dark/15 bg-white p-4 text-dark shadow-xs sm:p-8 print:border-none print:p-0 ${
              activeTab === 'invoice' ? 'block' : 'hidden print:block'
            }`}
          >
            {/* Publisher Header */}
            <div className="border-b-2 border-dark/80 pb-4 text-center">
              <h2 className="font-heading text-xl font-bold tracking-tight text-dark sm:text-3xl">
                {COMPANY.name}
              </h2>
              <p className="mt-1 text-[11px] leading-relaxed text-dark/70 sm:text-xs">
                {COMPANY.address}
                <span className="hidden sm:inline"> • </span>
                <br className="sm:hidden" />
                Hotline: {COMPANY.hotline}
                <span className="hidden sm:inline"> • </span>
                <br className="sm:hidden" />
                Email: {COMPANY.email}
              </p>
              <div className="mt-2 inline-block rounded-md bg-dark px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white sm:text-xs">
                WHOLESALE CASH MEMO / COUNTER INVOICE
              </div>
            </div>

            {/* Invoice Meta Grid */}
            <div className="mt-4 grid grid-cols-1 gap-4 text-xs sm:grid-cols-2 print:grid-cols-2">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-dark/60">
                  Shop & Customer Info:
                </p>
                <h4 className="font-heading text-sm font-bold text-dark">
                  {order.shopName || shop?.shopName || 'Counter Sale'}
                </h4>
                <p className="text-dark/80">
                  Owner / Representative:{' '}
                  {order.representative || shop?.representative || 'Owner'}
                </p>
                <p className="break-words text-dark/80">
                  Address: {order.address || shop?.address || 'Banglabazar, Dhaka'}
                </p>
                <p className="text-dark/80">
                  Phone: {toEnDigits(order.phone || shop?.phone || COMPANY.hotline)}
                </p>
              </div>

              <div className="min-w-0 sm:text-right print:text-right">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-dark/60">
                  Invoice Details:
                </p>
                <p className="font-bold text-dark">
                  Invoice No: <span className="font-mono">{order.id}</span>
                </p>
                <p className="text-dark/80">Date: {formatDate(order.date)}</p>
                <p className="text-dark/80">
                  Payment Method: {paymentLabel(order.paymentMethod)}
                </p>
                <p className="text-dark/80">
                  Salesperson: {order.servedBy || 'Counter Sales Desk'}
                </p>
              </div>
            </div>

            {/* Items Table (scrolls horizontally on small screens) */}
            <div className="mt-5 overflow-x-auto rounded-lg border border-dark/20">
              <table className="w-full min-w-[460px] text-left text-xs print:min-w-0">
                <thead className="border-b border-dark/20 bg-dark/5 font-bold text-dark">
                  <tr>
                    <th className="w-10 px-3 py-2.5 text-center">#</th>
                    <th className="px-3 py-2.5">Book Title & Author</th>
                    <th className="px-3 py-2.5 text-center">Qty</th>
                    <th className="px-3 py-2.5 text-right">Cover Price</th>
                    <th className="px-3 py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark/10">
                  {resolvedItems.map((item, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 text-center text-dark/60">
                        {index + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-semibold text-dark">
                          {item.title}
                        </span>
                        <span className="block text-[11px] text-dark/60">
                          {item.author}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center font-bold">
                        {item.quantity}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right font-mono">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right font-mono font-bold">
                        {formatCurrency(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations Summary */}
            <div className="mt-4 flex flex-col gap-4 text-xs sm:flex-row sm:justify-between sm:gap-6 print:flex-row print:justify-between">
              <div className="space-y-1 text-dark/70 sm:max-w-xs">
                <p className="font-semibold text-dark">Terms & Conditions:</p>
                <p>
                  • Sold books are exchangeable within 3 days in undamaged condition.
                </p>
                <p>
                  • Computer-generated invoice, no seal or signature required.
                </p>
              </div>

              <div className="w-full space-y-1.5 border-t border-dark/10 pt-2 sm:w-64 print:w-64">
                <div className="flex justify-between gap-3 text-dark/70">
                  <span>Total Cover Price:</span>
                  <span className="font-mono">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between gap-3 text-emerald-700">
                  <span>Wholesale Commission ({commission}%):</span>
                  <span className="font-mono">
                    -{formatCurrency(commissionDeduction)}
                  </span>
                </div>
                <div className="flex justify-between gap-3 border-t border-dark/20 pt-1 font-heading text-sm font-bold text-dark">
                  <span>Net Payable:</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>
                <div className="flex justify-between gap-3 font-medium text-dark/80">
                  <span>Paid:</span>
                  <span className="font-mono">{formatCurrency(paidAmount)}</span>
                </div>
                {dueAmount > 0 ? (
                  <div className="flex justify-between gap-3 font-bold text-amber-800">
                    <span>Due:</span>
                    <span className="font-mono">{formatCurrency(dueAmount)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between gap-3 font-bold text-emerald-700">
                    <span>Due:</span>
                    <span>Fully Paid</span>
                  </div>
                )}
              </div>
            </div>

            {/* Signatures */}
            <div className="mt-10 flex flex-wrap justify-between gap-6 text-center text-xs text-dark/70 sm:mt-12">
              <div className="w-full border-t border-dark/30 pt-1 sm:w-44 print:w-44">
                Customer / Shop Representative
              </div>
              <div className="w-full border-t border-dark/30 pt-1 font-semibold text-dark sm:w-44 print:w-44">
                Hosonta Prokashon Authority
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: Printable Due Payment Cash Memo                              */
/* ------------------------------------------------------------------ */

function DuePaymentMemoModal({ receipt, onClose }) {
  if (!receipt) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/60 p-4 print:static print:bg-white print:p-0"
    >
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #wholesale-due-memo, #wholesale-due-memo * { visibility: visible !important; }
          #wholesale-due-memo {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            padding: 12mm !important;
            background: white !important;
          }
          @page { margin: 10mm; size: A4 portrait; }
        }
      `}</style>
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl bg-white shadow-xl print:rounded-none print:shadow-none"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 print:hidden">
          <span className="text-sm font-bold text-slate-800">Due Payment Cash Memo</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              title="Print Memo"
              aria-label="Print Memo"
              className="p-1.5 text-slate-700 hover:text-dark transition"
            >
              <FiPrinter size={18} />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close"
              aria-label="Close"
              className="p-1.5 text-slate-400 hover:text-dark transition"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        <div id="wholesale-due-memo" className="p-6 text-xs text-slate-800 space-y-4">
          <div className="border-b border-slate-300 pb-3 text-center">
            <h2 className="font-heading text-xl font-bold text-slate-900">
              {COMPANY.name}
            </h2>
            <p className="text-[11px] text-slate-500">
              {COMPANY.address} • Hotline: {COMPANY.hotline}
            </p>
            <p className="mt-1.5 font-bold uppercase tracking-wider text-slate-800">
              Wholesale Due Payment Cash Memo
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p><strong>Wholesale:</strong> {receipt.shopName}</p>
              {receipt.representative && (
                <p><strong>Representative:</strong> {receipt.representative}</p>
              )}
              <p><strong>Phone:</strong> {receipt.phone || '—'}</p>
              {receipt.address && <p><strong>Address:</strong> {receipt.address}</p>}
            </div>
            <div className="space-y-1 text-right">
              <p><strong>Memo No:</strong> {receipt.id}</p>
              <p><strong>Date:</strong> {formatDate(receipt.date)}</p>
              <p><strong>Method:</strong> {paymentLabel(receipt.method, true)}</p>
            </div>
          </div>

          <table className="w-full border border-slate-200 text-left">
            <thead className="border-b border-slate-200 bg-white">
              <tr className="whitespace-nowrap">
                <th className="px-3 py-2 font-semibold">Particulars</th>
                <th className="px-3 py-2 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="px-3 py-2">Previous Due Balance</td>
                <td className="px-3 py-2 text-right font-medium">
                  {formatCurrency(receipt.previousDue)}
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-semibold">Paid Now</td>
                <td className="px-3 py-2 text-right font-bold text-emerald-700">
                  {formatCurrency(receipt.amountPaid)}
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-semibold">Remaining Due</td>
                <td className="px-3 py-2 text-right font-bold text-rose-600">
                  {formatCurrency(receipt.remainingDue)}
                </td>
              </tr>
            </tbody>
          </table>

          {receipt.note && (
            <p className="text-[11px] text-slate-500">
              <strong>Note:</strong> {receipt.note}
            </p>
          )}

          <div className="grid grid-cols-2 gap-6 pt-8 text-center text-[11px] text-slate-500">
            <div className="border-t border-dashed border-slate-300 pt-1">
              Customer Signature
            </div>
            <div className="border-t border-dashed border-slate-300 pt-1">
              Authorized Signature
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: Record Due Payment Modal                                     */
/* ------------------------------------------------------------------ */

function RecordPaymentModal({ isOpen, shop, onClose, onPaymentRecorded }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [note, setNote] = useState('');

  if (!isOpen || !shop) return null;

  const currentDue = Number(shop.dueAmount || 0);

  const handleSubmit = e => {
    e.preventDefault();
    const payNum = Number(amount);
    if (!payNum || payNum <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    onPaymentRecorded(shop, payNum, method, note);
    setAmount('');
    setNote('');
    onClose();
  };

  return (
    <ModalShell maxW="max-w-md">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex min-w-0 items-center gap-2">
          <FiDollarSign className="text-lg text-emerald-700" />
          <div className="min-w-0">
            <h3 className="font-heading text-base font-bold text-dark">
              Collect Due Payment
            </h3>
            <p className="truncate text-xs text-slate-500">{shop.shopName}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 p-1 text-slate-400 hover:text-dark"
          aria-label="Close"
        >
          <FiX size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3.5">
            <span className="text-xs font-semibold text-slate-600">
              Total Due Balance:
            </span>
            <span className="font-heading text-base font-bold text-rose-600">
              {formatCurrency(currentDue)}
            </span>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-dark">
              Payment Amount (৳) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min="1"
              max={currentDue > 0 ? currentDue * 2 : 100000}
              placeholder={`e.g. ${currentDue}`}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-dark">
              Payment Method
            </label>
            <select
              value={method}
              onChange={e => setMethod(e.target.value)}
              className={inputCls}
            >
              <option value="cash">Cash</option>
              <option value="bkash">bKash</option>
              <option value="bank">Bank Deposit</option>
              <option value="nagad">Nagad</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-dark">
              Note / Receipt No.
            </label>
            <input
              type="text"
              placeholder="Bank slip or transaction ID..."
              value={note}
              onChange={e => setNote(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-dark/10 bg-white p-4 sm:flex-row sm:justify-end sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2.5 text-xs font-semibold text-dark/70 hover:bg-dark/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-primary px-5 py-2.5 text-xs font-bold text-dark shadow-2xs hover:bg-primary-hover"
          >
            Confirm Payment
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

/* ------------------------------------------------------------------ */
/* Shop Details View: Profile & Full Order History                     */
/* ------------------------------------------------------------------ */

function ShopDetailsView({
  shop,
  onBack,
  allOrders = [],
  allBooks = [],
  dueReceipts = [],
  onOpenOrderModal,
  onOpenPaymentModal,
  onOpenDueMemo,
}) {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'books' | 'ledger'
  const [searchOrder, setSearchOrder] = useState('');

  // Orders matching this shop
  const shopOrders = useMemo(() => {
    return allOrders
      .filter(order => {
        if (order.shopId && String(order.shopId) === String(shop.id))
          return true;
        if (
          order.shopName &&
          shop.shopName &&
          order.shopName.trim().toLowerCase() ===
            shop.shopName.trim().toLowerCase()
        )
          return true;
        if (
          order.customerName &&
          shop.shopName &&
          order.customerName.includes(shop.shopName)
        )
          return true;
        if (
          order.phone &&
          shop.phone &&
          toEnDigits(order.phone).replace(/\D/g, '') ===
            toEnDigits(shop.phone).replace(/\D/g, '')
        )
          return true;
        return false;
      })
      .sort(
        (a, b) =>
          new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
      );
  }, [allOrders, shop]);

  // Aggregate Top Ordered Books by this shop
  const topBooks = useMemo(() => {
    const bookMap = new Map();
    shopOrders.forEach(order => {
      (order.items || []).forEach(item => {
        const bookId = String(item.bookId || item.id);
        const resolved = resolveOrderItem(item, allBooks);
        const qty = Number(item.quantity ?? 1);
        const price = Number(item.price ?? resolved.price ?? 0);

        if (!bookMap.has(bookId)) {
          bookMap.set(bookId, {
            ...resolved,
            totalQuantity: 0,
            totalSales: 0,
            orderCount: 0,
          });
        }
        const existing = bookMap.get(bookId);
        existing.totalQuantity += qty;
        existing.totalSales += qty * price;
        existing.orderCount += 1;
      });
    });

    return Array.from(bookMap.values()).sort(
      (a, b) => b.totalQuantity - a.totalQuantity,
    );
  }, [shopOrders, allBooks]);

  // Filter orders by search
  const visibleOrders = useMemo(() => {
    if (!searchOrder.trim()) return shopOrders;
    const q = searchOrder.trim().toLowerCase();
    return shopOrders.filter(
      o =>
        o.id.toLowerCase().includes(q) ||
        (o.notes && o.notes.toLowerCase().includes(q)) ||
        (o.paymentMethod && o.paymentMethod.toLowerCase().includes(q)),
    );
  }, [shopOrders, searchOrder]);

  const shopDue = Number(shop.dueAmount || 0);

  const tabCls = key =>
    `flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-xs font-bold transition sm:px-5 sm:text-sm ${
      activeTab === key
        ? 'border-primary text-dark'
        : 'border-transparent text-dark/60 hover:text-dark'
    }`;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Top Bar with Back Button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          title="Back to Wholesale"
          aria-label="Back to Wholesale"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-dark"
        >
          <FiArrowLeft className="text-base" />
        </button>

        <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:flex sm:items-center">
          <Link
            to="/dashboard/counter-orders"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-dark hover:bg-primary-hover"
          >
            <FiPlus className="text-sm" /> New Counter Invoice
          </Link>
          {shopDue > 0 && (
            <button
              type="button"
              onClick={() => onOpenPaymentModal(shop)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-800 hover:border-primary"
            >
              <FiDollarSign className="text-sm text-emerald-700" /> Collect Due
            </button>
          )}
        </div>
      </div>

      {/* Wholesale Profile Header Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <FiShoppingBag className="mt-1 shrink-0 text-2xl text-slate-700" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="break-words font-heading text-xl font-bold text-dark sm:text-2xl">
                  {shop.shopName}
                </h2>
                <span className="text-xs font-semibold text-slate-500">
                  Wholesale
                </span>
                {shop.tradeLicense && (
                  <span className="font-mono text-xs text-slate-400">
                    License: {shop.tradeLicense}
                  </span>
                )}
              </div>

              <div className="mt-2 flex flex-col gap-y-2 text-xs text-dark/70 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
                <span className="flex items-center gap-1.5">
                  <FiUserCheck className="shrink-0 text-sm text-primary" />
                  <strong>Owner/Representative:</strong>{' '}
                  {shop.representative || shop.ownerName || '—'}
                </span>
                <span className="flex items-center gap-1.5">
                  <FiPhone className="shrink-0 text-sm text-primary" />
                  <a
                    href={`tel:${toEnDigits(shop.phone)}`}
                    className="font-mono hover:underline"
                  >
                    {toEnDigits(shop.phone)}
                  </a>
                  <a
                    href={`https://wa.me/88${toEnDigits(shop.phone).replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-1 text-emerald-600 hover:text-emerald-700"
                    title="Send WhatsApp message"
                  >
                    <FaWhatsapp size={14} />
                  </a>
                </span>
                {shop.email && (
                  <span className="flex min-w-0 items-center gap-1.5">
                    <FiMail className="shrink-0 text-sm text-primary" />
                    <a
                      href={`mailto:${shop.email}`}
                      className="break-all hover:underline"
                    >
                      {shop.email}
                    </a>
                  </span>
                )}
                <span className="flex items-start gap-1.5 sm:items-center">
                  <FiMapPin className="mt-0.5 shrink-0 text-sm text-primary sm:mt-0" />
                  {shop.address}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Balance Alert in Header */}
          <div className="w-full rounded-xl border border-slate-200 bg-white p-4 lg:w-auto lg:min-w-[200px] lg:text-right">
            <span className="block text-xs font-semibold text-slate-500">
              Due Balance
            </span>
            <span
              className={`mt-0.5 block font-heading text-xl font-bold ${
                shopDue > 0 ? 'text-rose-600' : 'text-emerald-700'
              }`}
            >
              {formatCurrency(shop.dueAmount || 0)}
            </span>
            <span className="text-[11px] text-slate-400">
              {shopDue > 0 ? 'Pending due' : 'Settled'}
            </span>
          </div>
        </div>

        {/* 4 Financial KPI Summary Cards */}
        <div className="mt-5 grid grid-cols-2 gap-2.5 border-t border-slate-200 pt-5 sm:mt-6 sm:grid-cols-4 sm:gap-4 sm:pt-6">
          <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
            <span className="text-xs font-semibold text-slate-500">
              Total Orders
            </span>
            <p className="mt-1 font-heading text-lg font-bold text-slate-900 sm:text-xl">
              {shop.orderCount || shopOrders.length}
            </p>
          </div>

          <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
            <span className="text-xs font-semibold text-slate-500">
              Order Value
            </span>
            <p className="mt-1 break-words font-heading text-lg font-bold text-emerald-700 sm:text-xl">
              {formatCurrency(shop.totalOrderValue || 0)}
            </p>
          </div>

          <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
            <span className="text-xs font-semibold text-slate-500">
              Paid
            </span>
            <p className="mt-1 break-words font-heading text-lg font-bold text-slate-900 sm:text-xl">
              {formatCurrency(shop.totalPaid || 0)}
            </p>
          </div>

          <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
            <span className="text-xs font-semibold text-slate-500">
              Due Amount
            </span>
            <p
              className={`mt-1 break-words font-heading text-lg font-bold sm:text-xl ${
                shopDue > 0 ? 'text-rose-600' : 'text-emerald-700'
              }`}
            >
              {formatCurrency(shop.dueAmount || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation (scrollable on small screens) */}
      <div className="flex overflow-x-auto rounded-xl border-b border-dark/10 bg-white px-2 shadow-2xs [scrollbar-width:none] sm:px-4 [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={tabCls('orders')}
        >
          <FiShoppingBag /> Order History ({shopOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('books')}
          className={tabCls('books')}
        >
          <FiBookOpen /> Top Ordered Books ({topBooks.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ledger')}
          className={tabCls('ledger')}
        >
          <FiCreditCard /> Account Ledger & Dues
        </button>
      </div>

      {/* Tab 1: Orders History */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <h3 className="break-words font-heading text-base font-bold text-dark sm:text-lg">
              Counter Invoices — {shop.shopName}
            </h3>
            <div className="relative w-full sm:max-w-xs">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark/40" />
              <input
                type="text"
                placeholder="Search by invoice no. or note..."
                value={searchOrder}
                onChange={e => setSearchOrder(e.target.value)}
                className="w-full rounded-xl border border-dark/15 bg-white py-2.5 pl-9 pr-3 text-xs text-dark focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Mobile / tablet: cards */}
          <div className="space-y-3 lg:hidden">
            {visibleOrders.length === 0 ? (
              <div className="rounded-2xl border border-dark/10 bg-white py-8 text-center text-xs text-dark/50">
                No invoices found.
              </div>
            ) : (
              visibleOrders.map(order => {
                const f = getOrderFigures(order);
                return (
                  <div
                    key={order.id}
                    onClick={() => onOpenOrderModal(order, shop)}
                    className="cursor-pointer rounded-2xl border border-dark/10 bg-white p-4 shadow-2xs transition hover:bg-cream/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="block break-all font-mono text-sm font-bold text-dark">
                          {order.id}
                        </span>
                        <span className="text-[11px] text-dark/60">
                          {formatDate(order.date)}
                        </span>
                      </div>
                      {f.due > 0 ? (
                        <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                          Due {formatCurrency(f.due)}
                        </span>
                      ) : (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                          <FiCheckCircle size={12} /> Paid
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-xs font-semibold text-dark">
                      {f.copies} {f.copies === 1 ? 'copy' : 'copies'} ({f.items.length}{' '}
                      {f.items.length === 1 ? 'title' : 'titles'})
                    </p>

                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-dark/10 pt-3 text-xs">
                      <div>
                        <span className="block text-[11px] text-dark/50">
                          Invoice Total
                        </span>
                        <span className="font-heading font-bold text-dark">
                          {formatCurrency(f.total)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] text-dark/50">
                          Commission
                        </span>
                        <span className="font-bold text-emerald-800">
                          {f.commission}%
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="rounded-md bg-dark/5 px-2 py-1 text-[11px] font-semibold text-dark/70">
                        {paymentLabel(order.paymentMethod)}
                      </span>
                      <span className="text-[11px] font-medium text-dark/50">
                        Tap row to view invoice
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop: table */}
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead className="border-b border-slate-200 bg-white text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                  <tr className="whitespace-nowrap">
                    <th className="px-4 py-3">Invoice No. & Date</th>
                    <th className="px-4 py-3">Book Details</th>
                    <th className="px-4 py-3 text-center">Commission</th>
                    <th className="px-4 py-3 text-right">Invoice Total</th>
                    <th className="px-4 py-3 text-right">Due</th>
                    <th className="px-4 py-3 text-center">Payment Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark/5">
                  {visibleOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-dark/50">
                        No invoices found.
                      </td>
                    </tr>
                  ) : (
                    visibleOrders.map(order => {
                      const f = getOrderFigures(order);
                      return (
                        <tr
                          key={order.id}
                          className="cursor-pointer transition hover:bg-cream/40"
                          onClick={() => onOpenOrderModal(order, shop)}
                        >
                          <td className="px-4 py-3">
                            <span className="block font-mono font-bold text-dark">
                              {order.id}
                            </span>
                            <span className="text-[11px] text-dark/60">
                              {formatDate(order.date)}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <span className="font-semibold text-dark">
                              {f.copies} {f.copies === 1 ? 'copy' : 'copies'} ({f.items.length}{' '}
                              {f.items.length === 1 ? 'title' : 'titles'})
                            </span>
                          </td>

                          <td className="px-4 py-3 text-center">
                            <span className="inline-block rounded bg-emerald-50 px-2 py-0.5 font-bold text-emerald-800">
                              {f.commission}%
                            </span>
                          </td>

                          <td className="px-4 py-3 text-right font-heading text-sm font-bold text-dark">
                            {formatCurrency(f.total)}
                          </td>

                          <td className="px-4 py-3 text-right">
                            {f.due > 0 ? (
                              <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 font-bold text-amber-800">
                                {formatCurrency(f.due)}
                              </span>
                            ) : (
                              <span className="font-mono text-dark/40">0</span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-center">
                            <span className="rounded-md bg-dark/5 px-2 py-1 font-semibold capitalize text-dark/70">
                              {paymentLabel(order.paymentMethod)}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Top Ordered Books */}
      {activeTab === 'books' && (
        <div className="space-y-4">
          <h3 className="break-words font-heading text-base font-bold text-dark sm:text-lg">
            Top Supplied Books — {shop.shopName}
          </h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
            {topBooks.length === 0 ? (
              <div className="col-span-full py-12 text-center text-dark/50">
                No book records found for this shop.
              </div>
            ) : (
              topBooks.map((book, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3.5 rounded-2xl border border-dark/10 bg-white p-3.5 shadow-2xs transition hover:shadow-xs sm:p-4"
                >
                  <img
                    src={book.cover}
                    alt={book.title}
                    className="h-20 w-14 shrink-0 rounded-lg border border-dark/10 object-cover shadow-2xs"
                    onError={e => {
                      e.currentTarget.src = FALLBACK_COVER;
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="mb-1 inline-block rounded bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-dark">
                      {book.category}
                    </span>
                    <h4 className="truncate font-heading text-sm font-bold text-dark">
                      {book.title}
                    </h4>
                    <p className="truncate text-xs text-dark/60">
                      {book.author}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-t border-dark/10 pt-2 text-xs">
                      <span className="text-dark/70">
                        Total Taken:{' '}
                        <strong className="text-dark">
                          {book.totalQuantity} copies
                        </strong>
                      </span>
                      <span className="font-heading font-bold text-emerald-700">
                        {formatCurrency(book.totalSales)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Ledger & Due Statements */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-heading text-base font-bold text-dark sm:text-lg">
              Wholesale Account Ledger & Dues
            </h3>
            <button
              type="button"
              onClick={() => window.print()}
              title="Print Statement"
              aria-label="Print Statement"
              className="p-1.5 text-slate-600 hover:text-dark sm:self-auto"
            >
              <FiPrinter size={18} />
            </button>
          </div>

          {dueReceipts.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-600">
                Collected Due Payment Memos
              </h4>
              <div className="divide-y divide-slate-100">
                {dueReceipts.map(r => (
                  <div
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-900">{r.id}</span>
                      <span className="ml-2 text-slate-500">{formatDate(r.date)}</span>
                      {r.note && <span className="ml-2 text-slate-500">• {r.note}</span>}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-emerald-700">
                        Paid {formatCurrency(r.amountPaid)}
                      </span>
                      <span className="text-slate-500">
                        Due Left: {formatCurrency(r.remainingDue)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onOpenDueMemo(r)}
                        title="Print Cash Memo"
                        aria-label="Print Cash Memo"
                        className="p-1 text-slate-600 hover:text-dark"
                      >
                        <FiPrinter size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-5">
            <div className="divide-y divide-dark/10">
              {shopOrders.length === 0 && (
                <p className="py-6 text-center text-xs text-dark/50">
                  No transactions found.
                </p>
              )}
              {shopOrders.map((order, i) => {
                const total = Number(order.total || 0);
                const paid = Number(order.amountPaid ?? total);
                const due = Number(
                  order.dueAmount ?? Math.max(0, total - paid),
                );

                return (
                  <div
                    key={i}
                    className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2">
                        <span className="break-all font-mono text-sm font-bold text-dark">
                          {order.id}
                        </span>
                        <span className="text-xs text-dark/60">
                          ({formatDate(order.date)})
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-dark/70">
                        Payment Method: {paymentLabel(order.paymentMethod)} •{' '}
                        {order.notes || 'Regular counter sale'}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-xs sm:flex sm:items-center sm:gap-6 sm:text-right">
                      <div>
                        <span className="block text-dark/50">Invoice Total</span>
                        <span className="font-heading font-bold text-dark">
                          {formatCurrency(total)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-dark/50">Paid</span>
                        <span className="font-mono font-bold text-emerald-700">
                          {formatCurrency(paid)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-dark/50">Due</span>
                        <span
                          className={`font-mono font-bold ${
                            due > 0 ? 'text-amber-800' : 'text-dark/40'
                          }`}
                        >
                          {formatCurrency(due)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Component: ShopManagement                                      */
/* ------------------------------------------------------------------ */

export default function ShopManagement({ embedded = false }) {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === ROLES.ADMIN;
  const { orders = [], books = [] } = useData();
  const { shopName: routeShopName, id: routeShopId } = useParams();
  const navigate = useNavigate();

  // Stored shops & due payment memos from localStorage
  const [shopsList, setShopsList] = useState(getStoredShops);
  const [duePayments, setDuePayments] = useState(getStoredDuePayments);
  const [selectedShopId, setSelectedShopId] = useState(null);

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [dueFilter, setDueFilter] = useState('all'); // 'all' | 'due' | 'paid' | 'dhaka' | 'ctg'
  const [sortBy, setSortBy] = useState('value'); // 'value' | 'due' | 'orders' | 'name'

  // Modals state
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState(null);
  const [activeInvoiceShop, setActiveInvoiceShop] = useState(null);
  const [isAddShopOpen, setIsAddShopOpen] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [paymentModalShop, setPaymentModalShop] = useState(null);
  const [dueMemoReceipt, setDueMemoReceipt] = useState(null);

  // Merge context orders with dummy counter orders
  const allCounterOrders = useMemo(() => {
    const fromContext = orders.filter(
      o => o.orderType === 'counter' || Boolean(o.shopName),
    );
    const existingIds = new Set(fromContext.map(o => String(o.id)));
    const merged = [
      ...fromContext,
      ...initialCounterOrders.filter(d => !existingIds.has(String(d.id))),
    ];
    return merged.sort(
      (a, b) =>
        new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
    );
  }, [orders]);

  // Aggregate financial metrics for each shop
  const processedShops = useMemo(() => {
    return shopsList.map(shop => {
      const shopOrders = allCounterOrders.filter(order => {
        if (order.shopId && String(order.shopId) === String(shop.id))
          return true;
        if (
          order.shopName &&
          shop.shopName &&
          order.shopName.trim().toLowerCase() ===
            shop.shopName.trim().toLowerCase()
        )
          return true;
        if (
          order.customerName &&
          shop.shopName &&
          order.customerName.includes(shop.shopName)
        )
          return true;
        if (
          order.phone &&
          shop.phone &&
          toEnDigits(order.phone).replace(/\D/g, '') ===
            toEnDigits(shop.phone).replace(/\D/g, '')
        )
          return true;
        return false;
      });

      const shopDueCollected = duePayments
        .filter(p => String(p.shopId) === String(shop.id))
        .reduce((sum, p) => sum + Number(p.amountPaid || 0), 0);

      const orderCount = shopOrders.length;
      const totalOrderValue = shopOrders.reduce(
        (sum, o) => sum + Number(o.total || 0),
        0,
      );
      const totalPaid =
        shopOrders.reduce(
          (sum, o) =>
            sum +
            Number(
              o.amountPaid !== undefined
                ? o.amountPaid
                : o.paymentStatus === 'paid'
                  ? o.total || 0
                  : 0,
            ),
          0,
        ) + shopDueCollected;

      const calculatedDue = shopOrders.reduce((sum, o) => {
        const orderDue =
          o.dueAmount !== undefined
            ? Number(o.dueAmount)
            : Math.max(0, Number(o.total || 0) - Number(o.amountPaid || 0));
        return sum + orderDue;
      }, 0);

      // Total due accounts for due payments already collected
      const dueAmount = Math.max(
        0,
        calculatedDue + Number(shop.initialDue || 0) - shopDueCollected,
      );

      const totalItems = shopOrders.reduce((sum, o) => {
        return (
          sum +
          (o.items || []).reduce((isum, i) => isum + Number(i.quantity || 1), 0)
        );
      }, 0);

      return {
        ...shop,
        phone: toEnDigits(shop.phone),
        orderCount,
        totalOrderValue,
        totalPaid,
        dueAmount,
        totalItems,
      };
    });
  }, [shopsList, allCounterOrders, duePayments]);

  // Active Selected Shop (matched by shop name in route, with fallback to selectedShopId or legacy ID)
  const activeShop = useMemo(() => {
    const rawParam = routeShopName ?? routeShopId;
    if (!rawParam) {
      return selectedShopId
        ? processedShops.find(s => String(s.id) === String(selectedShopId)) || null
        : null;
    }

    const decodedParam = decodeURIComponent(rawParam).trim();
    const normalizedParam = decodedParam.toLowerCase();

    if (selectedShopId) {
      const selectedMatch = processedShops.find(
        s =>
          String(s.id) === String(selectedShopId) &&
          (s.shopName?.trim().toLowerCase() === normalizedParam ||
            s.shopName?.trim().replace(/\s+/g, '-').toLowerCase() === normalizedParam),
      );
      if (selectedMatch) return selectedMatch;
    }

    return (
      processedShops.find(
        s =>
          s.shopName?.trim().toLowerCase() === normalizedParam ||
          s.shopName?.trim().replace(/\s+/g, '-').toLowerCase() === normalizedParam ||
          String(s.id) === String(decodedParam),
      ) || null
    );
  }, [routeShopName, routeShopId, selectedShopId, processedShops]);

  // Filtered and Sorted Shops
  const visibleShops = useMemo(() => {
    const q = search.trim().toLowerCase();
    return processedShops
      .filter(shop => {
        if (dueFilter === 'due' && shop.dueAmount <= 0) return false;
        if (dueFilter === 'paid' && shop.dueAmount > 0) return false;
        if (
          dueFilter === 'dhaka' &&
          !(
            shop.district?.includes('ঢাকা') ||
            shop.district?.toLowerCase().includes('dhaka')
          )
        )
          return false;
        if (
          dueFilter === 'ctg' &&
          !(
            shop.district?.includes('চট্টগ্রাম') ||
            shop.district?.toLowerCase().includes('chattogram') ||
            shop.district?.toLowerCase().includes('chittagong')
          )
        )
          return false;

        if (!q) return true;
        return [
          shop.shopName,
          shop.ownerName,
          shop.representative,
          shop.phone,
          shop.address,
        ]
          .filter(Boolean)
          .some(val => String(val).toLowerCase().includes(q));
      })
      .sort((a, b) => {
        if (sortBy === 'value') return b.totalOrderValue - a.totalOrderValue;
        if (sortBy === 'due') return b.dueAmount - a.dueAmount;
        if (sortBy === 'orders') return b.orderCount - a.orderCount;
        return a.shopName.localeCompare(b.shopName);
      });
  }, [processedShops, search, dueFilter, sortBy]);

  // Overall totals for Summary Cards
  const totalShopsCount = processedShops.length;
  const totalSalesAll = processedShops.reduce(
    (s, sh) => s + sh.totalOrderValue,
    0,
  );
  const totalPaidAll = processedShops.reduce((s, sh) => s + sh.totalPaid, 0);
  const totalDueAll = processedShops.reduce((s, sh) => s + sh.dueAmount, 0);

  // Handlers
  const handleSelectShop = shop => {
    setSelectedShopId(shop.id);
    if (!embedded) {
      navigate(`/dashboard/all-users/shops/${toShopRouteParam(shop.shopName)}`);
    }
  };

  const handleBackToList = () => {
    setSelectedShopId(null);
    if (!embedded) {
      navigate('/dashboard/all-users/shops');
    }
  };

  const handlePaymentRecorded = (shop, amountPaid, method, note) => {
    const previousDue = Number(shop.dueAmount || 0);
    const remainingDue = Math.max(0, previousDue - amountPaid);
    const receipt = {
      id: `DUE-${Date.now().toString().slice(-5)}`,
      shopId: shop.id,
      shopName: shop.shopName,
      representative: shop.representative || shop.ownerName || '',
      phone: shop.phone || '',
      address: shop.address || '',
      previousDue,
      amountPaid,
      remainingDue,
      method,
      note,
      date: new Date().toISOString().slice(0, 10),
    };
    const nextReceipts = saveDuePaymentReceipt(receipt);
    setDuePayments(nextReceipts);
    toast.success(`${formatCurrency(amountPaid)} payment recorded.`);
    setDueMemoReceipt(receipt);
  };

  // If a wholesale profile is active, show the detailed profile & order history view
  if (activeShop) {
    const activeDueReceipts = duePayments.filter(
      p => String(p.shopId) === String(activeShop.id),
    );
    return (
      <div className="space-y-5 sm:space-y-6">
        <ShopDetailsView
          shop={activeShop}
          onBack={handleBackToList}
          allOrders={allCounterOrders}
          allBooks={books}
          dueReceipts={activeDueReceipts}
          onOpenOrderModal={(order, shop) => {
            setActiveInvoiceOrder(order);
            setActiveInvoiceShop(shop);
          }}
          onOpenPaymentModal={shop => setPaymentModalShop(shop)}
          onOpenDueMemo={receipt => setDueMemoReceipt(receipt)}
        />

        {/* Invoice Modal */}
        {activeInvoiceOrder && (
          <CounterOrderInvoiceModal
            order={activeInvoiceOrder}
            shop={activeInvoiceShop}
            allBooks={books}
            onClose={() => {
              setActiveInvoiceOrder(null);
              setActiveInvoiceShop(null);
            }}
          />
        )}

        {/* Payment Modal */}
        <RecordPaymentModal
          isOpen={Boolean(paymentModalShop)}
          shop={paymentModalShop}
          onClose={() => setPaymentModalShop(null)}
          onPaymentRecorded={handlePaymentRecorded}
        />

        {/* Printable Due Payment Memo */}
        <DuePaymentMemoModal
          receipt={dueMemoReceipt}
          onClose={() => setDueMemoReceipt(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Page Header (Hidden when embedded in Counter Sales) */}
      {!embedded && (
        <PageHeader
          title="Wholesale"
        />
      )}

      {/* Top 4 KPI Metrics Cards (Plain white, no colored icon backgrounds) */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Wholesale</span>
            <FiShoppingBag className="text-base text-slate-600" />
          </div>
          <p className="mt-1.5 font-heading text-xl font-bold text-slate-900">
            {totalShopsCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Total Sales</span>
            <FiTrendingUp className="text-base text-emerald-600" />
          </div>
          <p className="mt-1.5 font-heading text-xl font-bold text-emerald-700">
            {formatCurrency(totalSalesAll)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Paid</span>
            <FiDollarSign className="text-base text-blue-600" />
          </div>
          <p className="mt-1.5 font-heading text-xl font-bold text-slate-900">
            {formatCurrency(totalPaidAll)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Total Due</span>
            <FiAlertTriangle className={`text-base ${totalDueAll > 0 ? 'text-rose-600' : 'text-emerald-600'}`} />
          </div>
          <p className={`mt-1.5 font-heading text-xl font-bold ${totalDueAll > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
            {formatCurrency(totalDueAll)}
          </p>
        </div>
      </div>

      {/* Filter, Search & Add Wholesale Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search wholesale..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <select
              value={dueFilter}
              onChange={e => setDueFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-primary focus:outline-none sm:w-auto"
            >
              <option value="all">All Wholesale ({totalShopsCount})</option>
              <option value="due">Has Due Balance</option>
              <option value="paid">Paid (Zero Due)</option>
              <option value="dhaka">Dhaka Region</option>
              <option value="ctg">Chattogram Region</option>
            </select>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-primary focus:outline-none sm:w-auto"
            >
              <option value="value">Highest Order Value</option>
              <option value="due">Highest Due</option>
              <option value="orders">Most Orders</option>
              <option value="name">Name (A-Z)</option>
            </select>

            <button
              type="button"
              onClick={() => setIsAddShopOpen(true)}
              className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-dark hover:bg-primary-hover sm:col-auto"
            >
              <FiPlus className="text-sm" /> Add Wholesale
            </button>
          </div>
        </div>
      </div>

      {/* Mobile / tablet: minimal wholesale cards */}
      <div className="space-y-3 lg:hidden">
        {visibleShops.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white py-10 text-center text-xs text-slate-500">
            No wholesale records found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {visibleShops.map(shop => (
              <div
                key={shop.id}
                onClick={() => handleSelectShop(shop)}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 transition hover:border-primary"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FiShoppingBag className="shrink-0 text-base text-slate-600" />
                    <span className="truncate text-sm font-bold text-slate-900">
                      {shop.shopName}
                    </span>
                  </div>
                  <span className={`shrink-0 text-xs font-bold ${shop.dueAmount > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {shop.dueAmount > 0 ? `${formatCurrency(shop.dueAmount)} Due` : 'Paid'}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500">
                  <span>{shop.phone}</span>
                  <div className="flex items-center gap-2">
                    <span>{shop.orderCount} orders · {formatCurrency(shop.totalOrderValue)}</span>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingShop(shop);
                        }}
                        title="Edit Wholesale"
                        aria-label="Edit Wholesale"
                        className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-dark transition"
                      >
                        <FiEdit2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: clean single-line header wholesale table */}
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white lg:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-white text-xs font-semibold text-slate-500">
              <tr className="whitespace-nowrap">
                <th className="px-4 py-3">Wholesale Name</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3 text-center">Orders</th>
                <th className="px-4 py-3 text-right">Order Value</th>
                <th className="px-4 py-3 text-right">Due</th>
                <th className="px-4 py-3 text-center">Commission</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleShops.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    No wholesale records found.
                  </td>
                </tr>
              ) : (
                visibleShops.map(shop => (
                  <tr
                    key={shop.id}
                    onClick={() => handleSelectShop(shop)}
                    className="cursor-pointer transition hover:bg-slate-50/70"
                  >
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <FiShoppingBag className="shrink-0 text-base text-slate-600" />
                        <span className="text-sm font-semibold text-slate-900">
                          {shop.shopName}
                        </span>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">{shop.phone}</span>
                        <a
                          href={`https://wa.me/88${shop.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="text-emerald-600 hover:text-emerald-700"
                          title="WhatsApp"
                          aria-label="WhatsApp"
                        >
                          <FaWhatsapp size={14} />
                        </a>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5 text-center font-semibold text-slate-700">
                      {shop.orderCount}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold text-emerald-700">
                      {formatCurrency(shop.totalOrderValue)}
                    </td>

                    <td className={`whitespace-nowrap px-4 py-3.5 text-right font-semibold ${shop.dueAmount > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                      {shop.dueAmount > 0 ? formatCurrency(shop.dueAmount) : '0'}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5 text-center font-medium text-slate-700">
                      {shop.defaultCommission || 35}%
                    </td>

                    <td
                      className="whitespace-nowrap px-4 py-3.5 text-right"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleSelectShop(shop)}
                          title="View Wholesale Profile"
                          aria-label="View Wholesale Profile"
                          className="p-1 text-slate-500 hover:text-dark transition"
                        >
                          <FiEye size={16} />
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => setEditingShop(shop)}
                            title="Edit Wholesale"
                            aria-label="Edit Wholesale"
                            className="p-1 text-slate-500 hover:text-primary-hover transition"
                          >
                            <FiEdit2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Shop Modal */}
      <AddShopModal
        key={editingShop?.id || (isAddShopOpen ? 'new' : 'closed')}
        isOpen={isAddShopOpen || Boolean(editingShop)}
        shop={editingShop}
        onClose={() => {
          setIsAddShopOpen(false);
          setEditingShop(null);
        }}
        onCreated={() => {
          setShopsList(getStoredShops());
        }}
      />
    </div>
  );
}
