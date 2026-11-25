import { useState, useMemo } from 'react';
import {
  FiArrowLeft,
  FiBookOpen,
  FiCheckCircle,
  FiCreditCard,
  FiDollarSign,
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
import { useData } from '../../../context/useData';
import {
  getStoredShops,
  updateStoredShop,
} from '../../../data/shops';
import { initialCounterOrders } from '../employee/counterOrders/dummyData';
import AddShopModal from '../../../components/dashboard/AddShopModal';

/* ------------------------------------------------------------------ */
/* Constants & Helpers                                                 */
/* ------------------------------------------------------------------ */

const COMPANY = {
  name: 'হসন্ত প্রকাশন',
  legalName: 'Hosonta Prokashon',
  address: '৩৮/২ মান্নান বাজার (২য় তলা), বাংলাবাজার, ঢাকা-১১০০',
  hotline: '০১৬২৮-০৩৭৫৯১',
  email: 'support@hosontoprokashon.com',
  website: 'www.hosontoprokashon.com',
};

const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80';

const toBnNum = value => {
  const bnDigits = '০১২৩৪৫৬৭৮৯';
  return String(value ?? '').replace(/\d/g, d => bnDigits[Number(d)]);
};

const formatDate = isoString => {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
};

const paymentLabel = (m, long = false) => {
  if (m === 'cash') return long ? 'নগদ ক্যাশ (Cash)' : 'ক্যাশ';
  if (m === 'bkash') return long ? 'বিকাশ (bKash)' : 'বিকাশ';
  if (m === 'bank') return long ? 'ব্যাংক ট্রান্সফার' : 'ব্যাংক';
  if (m === 'nagad') return long ? 'নগদ ডিজিটাল' : 'নগদ (ডিজিটাল)';
  return m || 'ক্যাশ';
};

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
    title: item.title || matchedBook?.title || 'বইয়ের নাম',
    author: item.author || matchedBook?.author || 'লেখক',
    category: item.category || matchedBook?.category || 'সাহিত্য',
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
                    কাউন্টার চালান: {order.id}
                  </h3>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      dueAmount > 0
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {dueAmount > 0
                      ? `বকেয়া: ৳${toBnNum(dueAmount)}`
                      : 'সম্পূর্ণ পরিশোধিত'}
                  </span>
                </div>
                <p className="truncate text-xs text-dark/60">
                  দোকান: {order.shopName || shop?.shopName || 'কাউন্টার সেল'} •
                  তারিখ: {formatDate(order.date)}
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
              {tabBtn('details', 'চালান বিবরণ')}
              {tabBtn(
                'invoice',
                'ক্যাশ মেমো',
                <FiPrinter className="text-xs" />,
              )}
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-dark shadow-2xs transition hover:bg-primary-hover sm:flex-none"
            >
              <FiPrinter className="text-sm" /> প্রিন্ট চালান
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
                    দোকানের নাম
                  </span>
                  <p className="mt-1 break-words font-heading text-base font-bold text-dark">
                    {order.shopName || shop?.shopName || '—'}
                  </p>
                  <p className="text-xs text-dark/60">
                    {order.representative || shop?.representative || 'মালিক'}
                  </p>
                </div>

                <div className="min-w-0 rounded-xl border border-dark/10 bg-cream/50 p-3.5">
                  <span className="text-xs font-semibold text-dark/60">
                    যোগাযোগ নম্বর
                  </span>
                  <p className="mt-1 break-words font-mono text-sm font-bold text-dark">
                    {order.phone || shop?.phone || '—'}
                  </p>
                  <p className="break-words text-xs text-dark/60">
                    {order.address || shop?.address || 'বাংলাবাজার'}
                  </p>
                </div>

                <div className="min-w-0 rounded-xl border border-dark/10 bg-cream/50 p-3.5">
                  <span className="text-xs font-semibold text-dark/60">
                    পেমেন্ট মেথড
                  </span>
                  <p className="mt-1 font-heading text-sm font-bold capitalize text-dark">
                    {paymentLabel(order.paymentMethod, true)}
                  </p>
                  <p className="text-xs text-dark/60">
                    সার্ভড বাই: {order.servedBy || 'কাউন্টার সেলস'}
                  </p>
                </div>

                <div className="min-w-0 rounded-xl border border-dark/10 bg-cream/50 p-3.5">
                  <span className="text-xs font-semibold text-dark/60">
                    মোট চালান মূল্য
                  </span>
                  <p className="mt-1 font-heading text-base font-bold text-emerald-700">
                    ৳{toBnNum(grandTotal)}
                  </p>
                  <p className="text-xs font-semibold text-dark/60">
                    কমিশন: {toBnNum(commission)}% (৳
                    {toBnNum(commissionDeduction)})
                  </p>
                </div>
              </div>

              {/* Purchased Books */}
              <div className="rounded-xl border border-dark/10 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dark/10 bg-dark/2 px-3 py-3 sm:px-4">
                  <h4 className="flex items-center gap-2 font-heading text-sm font-bold text-dark">
                    <FiBookOpen className="text-base text-primary" />
                    অর্ডারের বইসমূহ ({toBnNum(resolvedItems.length)}টি পদবী)
                  </h4>
                  <span className="text-xs font-medium text-dark/60">
                    মোট কপি:{' '}
                    <strong className="text-dark">
                      {toBnNum(
                        resolvedItems.reduce((s, i) => s + i.quantity, 0),
                      )}
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
                              লেখক: {item.author} • ক্যাটাগরি: {item.category}
                            </p>
                            <span className="text-xs text-dark/70">
                              গায়ের দাম: ৳{toBnNum(item.price)} ×{' '}
                              <strong className="text-dark">
                                {toBnNum(item.quantity)} কপি
                              </strong>
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <span className="font-heading text-sm font-bold text-dark">
                            ৳{toBnNum(itemTotal)}
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
                      <span>বইয়ের মোট মূল্য (Subtotal):</span>
                      <span className="font-mono">৳{toBnNum(subtotal)}</span>
                    </div>
                    <div className="flex justify-between gap-3 text-emerald-700">
                      <span>পাইকারি কমিশন ({toBnNum(commission)}%):</span>
                      <span className="font-mono">
                        -৳{toBnNum(commissionDeduction)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3 border-t border-dark/10 pt-1.5 font-heading text-sm font-bold text-dark">
                      <span>মোট চালান বিল (Grand Total):</span>
                      <span className="text-emerald-700">
                        ৳{toBnNum(grandTotal)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3 text-dark/70">
                      <span>পরিশোধিত (Paid):</span>
                      <span className="font-mono font-bold text-dark">
                        ৳{toBnNum(paidAmount)}
                      </span>
                    </div>
                    {dueAmount > 0 ? (
                      <div className="flex justify-between gap-3 border-t border-amber-200 pt-1 font-bold text-amber-800">
                        <span>বকেয়া (Due Amount):</span>
                        <span className="font-mono">৳{toBnNum(dueAmount)}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between gap-3 font-bold text-emerald-700">
                        <span>বকেয়া (Due):</span>
                        <span>পরিশোধিত</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {order.notes && (
                <div className="rounded-xl border border-dark/10 bg-amber-50/50 p-3.5 text-xs text-dark/80">
                  <span className="font-bold text-dark">চালান নোট:</span>{' '}
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
                হটলাইন: {COMPANY.hotline}
                <span className="hidden sm:inline"> • </span>
                <br className="sm:hidden" />
                ইমেইল: {COMPANY.email}
              </p>
              <div className="mt-2 inline-block rounded-md bg-dark px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white sm:text-xs">
                পাইকারি ক্যাশ মেমো / কাউন্টার চালান
              </div>
            </div>

            {/* Invoice Meta Grid */}
            <div className="mt-4 grid grid-cols-1 gap-4 text-xs sm:grid-cols-2 print:grid-cols-2">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-dark/60">
                  দোকান ও গ্রাহক তথ্য:
                </p>
                <h4 className="font-heading text-sm font-bold text-dark">
                  {order.shopName || shop?.shopName || 'কাউন্টার বিক্রয়'}
                </h4>
                <p className="text-dark/80">
                  স্বত্বাধিকারী / প্রতিনিধি:{' '}
                  {order.representative || shop?.representative || 'মালিক'}
                </p>
                <p className="break-words text-dark/80">
                  ঠিকানা: {order.address || shop?.address || 'বাংলাবাজার, ঢাকা'}
                </p>
                <p className="text-dark/80">
                  মোবাইল: {order.phone || shop?.phone || COMPANY.hotline}
                </p>
              </div>

              <div className="min-w-0 sm:text-right print:text-right">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-dark/60">
                  চালান বিবরণ:
                </p>
                <p className="font-bold text-dark">
                  চালান নং: <span className="font-mono">{order.id}</span>
                </p>
                <p className="text-dark/80">তারিখ: {formatDate(order.date)}</p>
                <p className="text-dark/80">
                  পেমেন্ট মাধ্যম: {paymentLabel(order.paymentMethod)}
                </p>
                <p className="text-dark/80">
                  বিক্রয়কর্মী: {order.servedBy || 'কাউন্টার সেলস ডেস্ক'}
                </p>
              </div>
            </div>

            {/* Items Table (scrolls horizontally on small screens) */}
            <div className="mt-5 overflow-x-auto rounded-lg border border-dark/20">
              <table className="w-full min-w-[460px] text-left text-xs print:min-w-0">
                <thead className="border-b border-dark/20 bg-dark/5 font-bold text-dark">
                  <tr>
                    <th className="w-10 px-3 py-2.5 text-center">নং</th>
                    <th className="px-3 py-2.5">বইয়ের নাম ও লেখক</th>
                    <th className="px-3 py-2.5 text-center">পরিমাণ</th>
                    <th className="px-3 py-2.5 text-right">গায়ের দাম</th>
                    <th className="px-3 py-2.5 text-right">মোট মূল্য</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark/10">
                  {resolvedItems.map((item, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 text-center text-dark/60">
                        {toBnNum(index + 1)}
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
                        {toBnNum(item.quantity)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right font-mono">
                        ৳{toBnNum(item.price)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right font-mono font-bold">
                        ৳{toBnNum(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations Summary */}
            <div className="mt-4 flex flex-col gap-4 text-xs sm:flex-row sm:justify-between sm:gap-6 print:flex-row print:justify-between">
              <div className="space-y-1 text-dark/70 sm:max-w-xs">
                <p className="font-semibold text-dark">শর্তাবলী:</p>
                <p>
                  • বিক্রয়কৃত বই অক্ষত অবস্থায় ৩ দিনের মধ্যে পরিবর্তনযোগ্য।
                </p>
                <p>
                  • কম্পিউটার জেনারেটেড চালান, কোনো সিল বা স্বাক্ষরের প্রয়োজন
                  নেই।
                </p>
              </div>

              <div className="w-full space-y-1.5 border-t border-dark/10 pt-2 sm:w-64 print:w-64">
                <div className="flex justify-between gap-3 text-dark/70">
                  <span>সর্বমোট গায়ের দাম:</span>
                  <span className="font-mono">৳{toBnNum(subtotal)}</span>
                </div>
                <div className="flex justify-between gap-3 text-emerald-700">
                  <span>পাইকারি কমিশন ({toBnNum(commission)}%):</span>
                  <span className="font-mono">
                    -৳{toBnNum(commissionDeduction)}
                  </span>
                </div>
                <div className="flex justify-between gap-3 border-t border-dark/20 pt-1 font-heading text-sm font-bold text-dark">
                  <span>সর্বমোট প্রদেয়:</span>
                  <span>৳{toBnNum(grandTotal)}</span>
                </div>
                <div className="flex justify-between gap-3 font-medium text-dark/80">
                  <span>জমা / পরিশোধিত:</span>
                  <span className="font-mono">৳{toBnNum(paidAmount)}</span>
                </div>
                {dueAmount > 0 ? (
                  <div className="flex justify-between gap-3 font-bold text-amber-800">
                    <span>বকেয়া (Due):</span>
                    <span className="font-mono">৳{toBnNum(dueAmount)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between gap-3 font-bold text-emerald-700">
                    <span>বকেয়া:</span>
                    <span>সম্পূর্ণ পরিশোধিত</span>
                  </div>
                )}
              </div>
            </div>

            {/* Signatures */}
            <div className="mt-10 flex flex-wrap justify-between gap-6 text-center text-xs text-dark/70 sm:mt-12">
              <div className="w-full border-t border-dark/30 pt-1 sm:w-44 print:w-44">
                গ্রাহক / দোকান প্রতিনিধির স্বাক্ষর
              </div>
              <div className="w-full border-t border-dark/30 pt-1 font-semibold text-dark sm:w-44 print:w-44">
                হসন্ত প্রকাশন কর্তৃত্বপক্ষ
              </div>
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
      toast.error('সঠিক টাকার অঙ্ক লিখুন');
      return;
    }

    onPaymentRecorded(shop.id, payNum, method, note);
    toast.success(`৳${toBnNum(payNum)} জমা এন্ট্রি সফল হয়েছে!`);
    onClose();
  };

  return (
    <ModalShell maxW="max-w-md">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-dark/10 px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
            <FiDollarSign className="text-lg" />
          </div>
          <div className="min-w-0">
            <h3 className="font-heading text-base font-bold text-dark">
              বকেয়া পরিশোধ / পেমেন্ট গ্রহণ
            </h3>
            <p className="truncate text-xs text-dark/60">{shop.shopName}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg p-1.5 text-dark/50 hover:bg-dark/5"
          aria-label="Close"
        >
          <FiX size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
            <span className="text-xs font-semibold text-amber-900">
              বর্তমান বকেয়া (Total Due):
            </span>
            <span className="font-heading text-base font-bold text-amber-900">
              ৳{toBnNum(currentDue)}
            </span>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-dark">
              পরিশোধিত টাকার পরিমাণ (৳) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min="1"
              max={currentDue > 0 ? currentDue * 2 : 100000}
              placeholder={`উদাঃ ${currentDue}`}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-dark">
              পেমেন্ট মাধ্যম
            </label>
            <select
              value={method}
              onChange={e => setMethod(e.target.value)}
              className={inputCls}
            >
              <option value="cash">নগদ ক্যাশ (Cash)</option>
              <option value="bkash">বিকাশ (bKash)</option>
              <option value="bank">ব্যাংক ডিপোজিট</option>
              <option value="nagad">নগদ (Nagad)</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-dark">
              মন্তব্য / রসিদ নং
            </label>
            <input
              type="text"
              placeholder="ব্যাংক স্লিপ বা ট্রানজেকশন আইডি..."
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
            বাতিল
          </button>
          <button
            type="submit"
            className="rounded-lg bg-primary px-5 py-2.5 text-xs font-bold text-dark shadow-2xs hover:bg-primary-hover"
          >
            জমা নিশ্চিত করুন
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
  onOpenOrderModal,
  onOpenPaymentModal,
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
          order.phone.replace(/\D/g, '') === shop.phone.replace(/\D/g, '')
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
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-dark/10 bg-white px-4 py-2 text-sm font-semibold text-dark shadow-2xs transition hover:border-dark/20 hover:bg-cream sm:justify-start"
        >
          <FiArrowLeft className="text-base" /> সকল দোকানে ফিরে যান
        </button>

        <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:flex sm:items-center">
          <Link
            to="/dashboard/counter-orders"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-dark shadow-2xs transition hover:bg-primary-hover"
          >
            <FiPlus className="text-sm" /> নতুন কাউন্টার চালান
          </Link>
          {shopDue > 0 && (
            <button
              type="button"
              onClick={() => onOpenPaymentModal(shop)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-white shadow-2xs transition hover:bg-amber-600"
            >
              <FiDollarSign className="text-sm" /> বকেয়া জমা নিন
            </button>
          )}
        </div>
      </div>

      {/* Shop Profile Header Banner */}
      <div className="rounded-2xl border border-dark/10 bg-white p-4 shadow-xs sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-amber-200 text-dark shadow-inner sm:h-16 sm:w-16">
              <FiShoppingBag className="text-2xl text-dark sm:text-3xl" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="break-words font-heading text-xl font-bold text-dark sm:text-2xl">
                  {shop.shopName}
                </h2>
                <span className="inline-flex items-center rounded-md bg-dark/5 px-2.5 py-0.5 text-xs font-semibold text-dark/70">
                  {shop.category || 'বুকশপ'}
                </span>
                {shop.tradeLicense && (
                  <span className="font-mono text-xs text-dark/50">
                    লাইসেন্স: {shop.tradeLicense}
                  </span>
                )}
              </div>

              <div className="mt-2 flex flex-col gap-y-2 text-xs text-dark/70 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
                <span className="flex items-center gap-1.5">
                  <FiUserCheck className="shrink-0 text-sm text-primary" />
                  <strong>স্বত্বাধিকারী/প্রতিনিধি:</strong>{' '}
                  {shop.representative || shop.ownerName || '—'}
                </span>
                <span className="flex items-center gap-1.5">
                  <FiPhone className="shrink-0 text-sm text-primary" />
                  <a
                    href={`tel:${shop.phone}`}
                    className="font-mono hover:underline"
                  >
                    {shop.phone}
                  </a>
                  <a
                    href={`https://wa.me/88${shop.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-1 text-emerald-600 hover:text-emerald-700"
                    title="হোয়াটসঅ্যাপে মেসেজ পাঠান"
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
          <div className="w-full rounded-xl border border-dark/10 bg-cream/60 p-4 lg:w-auto lg:min-w-[200px] lg:text-right">
            <span className="block text-xs font-semibold text-dark/60">
              বর্তমান বকেয়া (Due Balance)
            </span>
            <span
              className={`mt-0.5 block font-heading text-xl font-bold ${
                shopDue > 0 ? 'text-amber-700' : 'text-emerald-700'
              }`}
            >
              ৳{toBnNum(shop.dueAmount || 0)}
            </span>
            <span className="text-[11px] text-dark/50">
              {shopDue > 0 ? 'অনতিবিলম্বে পরিশোধযোগ্য' : 'সব চালান ক্লিয়ার'}
            </span>
          </div>
        </div>

        {/* 4 Financial KPI Summary Cards */}
        <div className="mt-5 grid grid-cols-2 gap-2.5 border-t border-dark/10 pt-5 sm:mt-6 sm:grid-cols-4 sm:gap-4 sm:pt-6">
          <div className="min-w-0 rounded-xl border border-dark/10 bg-cream/40 p-3 sm:p-4">
            <span className="text-xs font-semibold text-dark/60">
              মোট চালান / অর্ডার
            </span>
            <p className="mt-1 font-heading text-lg font-bold text-dark sm:text-xl">
              {toBnNum(shop.orderCount || shopOrders.length)} টি
            </p>
            <p className="text-[11px] text-dark/50">কাউন্টার থেকে ক্রয়</p>
          </div>

          <div className="min-w-0 rounded-xl border border-dark/10 bg-cream/40 p-3 sm:p-4">
            <span className="text-xs font-semibold text-dark/60">
              মোট অর্ডার ভ্যালু (বিক্রি)
            </span>
            <p className="mt-1 break-words font-heading text-lg font-bold text-emerald-700 sm:text-xl">
              ৳{toBnNum(shop.totalOrderValue || 0)}
            </p>
            <p className="text-[11px] text-dark/50">
              সর্বমোট কমিশন সমন্বয় পরবর্তী
            </p>
          </div>

          <div className="min-w-0 rounded-xl border border-dark/10 bg-cream/40 p-3 sm:p-4">
            <span className="text-xs font-semibold text-dark/60">
              পরিশোধিত নগদ/ডিজিটাল
            </span>
            <p className="mt-1 break-words font-heading text-lg font-bold text-dark sm:text-xl">
              ৳{toBnNum(shop.totalPaid || 0)}
            </p>
            <p className="text-[11px] text-dark/50">গৃহীত পেমেন্ট</p>
          </div>

          <div
            className={`min-w-0 rounded-xl border p-3 sm:p-4 ${
              shopDue > 0
                ? 'border-amber-200 bg-amber-50/70'
                : 'border-emerald-200 bg-emerald-50/70'
            }`}
          >
            <span className="text-xs font-semibold text-dark/60">
              বকেয়া বিল (Due Amount)
            </span>
            <p
              className={`mt-1 break-words font-heading text-lg font-bold sm:text-xl ${
                shopDue > 0 ? 'text-amber-800' : 'text-emerald-800'
              }`}
            >
              ৳{toBnNum(shop.dueAmount || 0)}
            </p>
            <p className="text-[11px] text-dark/60">
              {shopDue > 0 ? 'সমন্বয় বাকি আছে' : 'কোনো বকেয়া নেই'}
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
          <FiShoppingBag /> অর্ডারের ইতিহাস ({toBnNum(shopOrders.length)})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('books')}
          className={tabCls('books')}
        >
          <FiBookOpen /> সর্বাধিক বিক্রিত বই ({toBnNum(topBooks.length)})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ledger')}
          className={tabCls('ledger')}
        >
          <FiCreditCard /> লেনদেন ও বকেয়া খাতা
        </button>
      </div>

      {/* Tab 1: Orders History */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <h3 className="break-words font-heading text-base font-bold text-dark sm:text-lg">
              {shop.shopName}-এর সকল কাউন্টার চালান
            </h3>
            <div className="relative w-full sm:max-w-xs">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark/40" />
              <input
                type="text"
                placeholder="চালান নং বা মন্তব্য দিয়ে খুঁজুন..."
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
                কোনো চালান পাওয়া যায়নি।
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
                          বকেয়া ৳{toBnNum(f.due)}
                        </span>
                      ) : (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                          <FiCheckCircle size={12} /> পরিশোধিত
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-xs font-semibold text-dark">
                      {toBnNum(f.copies)} কপি ({toBnNum(f.items.length)} পদবী)
                    </p>
                    <p className="line-clamp-1 text-[11px] text-dark/60">
                      {f.items.map(i => i.title).join(', ')}
                    </p>

                    <div className="mt-3 grid grid-cols-3 gap-2 border-t border-dark/10 pt-3 text-xs">
                      <div>
                        <span className="block text-[11px] text-dark/50">
                          চালান মূল্য
                        </span>
                        <span className="font-heading font-bold text-dark">
                          ৳{toBnNum(f.total)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] text-dark/50">
                          পরিশোধিত
                        </span>
                        <span className="font-mono font-bold text-emerald-700">
                          ৳{toBnNum(f.paid)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] text-dark/50">
                          কমিশন
                        </span>
                        <span className="font-bold text-emerald-800">
                          {toBnNum(f.commission)}%
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="rounded-md bg-dark/5 px-2 py-1 text-[11px] font-semibold text-dark/70">
                        {paymentLabel(order.paymentMethod)}
                      </span>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          onOpenOrderModal(order, shop);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-dark/15 bg-white px-3 py-1.5 text-xs font-semibold text-dark shadow-2xs transition hover:border-primary hover:bg-primary"
                      >
                        <FiEye /> চালান দেখুন
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop: table */}
          <div className="hidden overflow-hidden rounded-2xl border border-dark/10 bg-white shadow-2xs lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-xs">
                <thead className="border-b border-dark/10 bg-dark/5 text-[11px] font-bold uppercase tracking-wider text-dark">
                  <tr>
                    <th className="px-4 py-3">চালান নং ও তারিখ</th>
                    <th className="px-4 py-3">বইয়ের বিবরণ</th>
                    <th className="px-4 py-3 text-right">গায়ের দাম</th>
                    <th className="px-4 py-3 text-center">কমিশন</th>
                    <th className="px-4 py-3 text-right">চালান মূল্য</th>
                    <th className="px-4 py-3 text-right">পরিশোধিত</th>
                    <th className="px-4 py-3 text-right">বকেয়া</th>
                    <th className="px-4 py-3 text-center">পেমেন্ট মেথড</th>
                    <th className="px-4 py-3 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark/5">
                  {visibleOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-dark/50">
                        কোনো চালান পাওয়া যায়নি।
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
                            <span className="block font-semibold text-dark">
                              {toBnNum(f.copies)} কপি ({toBnNum(f.items.length)}{' '}
                              পদবী)
                            </span>
                            <span className="line-clamp-1 max-w-[200px] text-[11px] text-dark/60">
                              {f.items.map(i => i.title).join(', ')}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-right font-mono text-dark/70">
                            ৳{toBnNum(f.subtotal)}
                          </td>

                          <td className="px-4 py-3 text-center">
                            <span className="inline-block rounded bg-emerald-50 px-2 py-0.5 font-bold text-emerald-800">
                              {toBnNum(f.commission)}%
                            </span>
                          </td>

                          <td className="px-4 py-3 text-right font-heading text-sm font-bold text-dark">
                            ৳{toBnNum(f.total)}
                          </td>

                          <td className="px-4 py-3 text-right font-mono font-medium text-emerald-700">
                            ৳{toBnNum(f.paid)}
                          </td>

                          <td className="px-4 py-3 text-right">
                            {f.due > 0 ? (
                              <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 font-bold text-amber-800">
                                ৳{toBnNum(f.due)}
                              </span>
                            ) : (
                              <span className="font-mono text-dark/40">০</span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-center">
                            <span className="rounded-md bg-dark/5 px-2 py-1 font-semibold capitalize text-dark/70">
                              {paymentLabel(order.paymentMethod)}
                            </span>
                          </td>

                          <td
                            className="px-4 py-3 text-right"
                            onClick={e => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => onOpenOrderModal(order, shop)}
                              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-dark/15 bg-white px-3 py-1.5 text-xs font-semibold text-dark shadow-2xs transition hover:border-primary hover:bg-primary"
                            >
                              <FiEye /> চালান দেখুন
                            </button>
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
            {shop.shopName}-এ সর্বাধিক সরবরাহকৃত বই
          </h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
            {topBooks.length === 0 ? (
              <div className="col-span-full py-12 text-center text-dark/50">
                এই দোকানের কোনো বইয়ের তথ্য নেই।
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
                        মোট নিয়েছে:{' '}
                        <strong className="text-dark">
                          {toBnNum(book.totalQuantity)} কপি
                        </strong>
                      </span>
                      <span className="font-heading font-bold text-emerald-700">
                        ৳{toBnNum(book.totalSales)}
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
              দোকানের লেনদেন ও বকেয়া খাতা (Customer Account Ledger)
            </h3>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-dark/15 bg-white px-3 py-2 text-xs font-semibold text-dark hover:bg-cream sm:self-auto"
            >
              <FiPrinter /> স্টেটমেন্ট প্রিন্ট
            </button>
          </div>

          <div className="rounded-2xl border border-dark/10 bg-white p-3 shadow-2xs sm:p-5">
            <div className="divide-y divide-dark/10">
              {shopOrders.length === 0 && (
                <p className="py-6 text-center text-xs text-dark/50">
                  কোনো লেনদেন পাওয়া যায়নি।
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
                        পেমেন্ট পদ্ধতি: {order.paymentMethod || 'নগদ'} •{' '}
                        {order.notes || 'নিয়মিত কাউন্টার বিক্রয়'}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-xs sm:flex sm:items-center sm:gap-6 sm:text-right">
                      <div>
                        <span className="block text-dark/50">চালান মূল্য</span>
                        <span className="font-heading font-bold text-dark">
                          ৳{toBnNum(total)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-dark/50">জমা (Paid)</span>
                        <span className="font-mono font-bold text-emerald-700">
                          ৳{toBnNum(paid)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-dark/50">বকেয়া (Due)</span>
                        <span
                          className={`font-mono font-bold ${
                            due > 0 ? 'text-amber-800' : 'text-dark/40'
                          }`}
                        >
                          ৳{toBnNum(due)}
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
  const { orders = [], books = [] } = useData();
  const { id: routeShopId } = useParams();
  const navigate = useNavigate();

  // Stored shops from localStorage / seed
  const [shopsList, setShopsList] = useState(getStoredShops);
  const [selectedShopId, setSelectedShopId] = useState(routeShopId || null);

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [dueFilter, setDueFilter] = useState('all'); // 'all' | 'due' | 'paid' | 'dhaka' | 'ctg'
  const [sortBy, setSortBy] = useState('value'); // 'value' | 'due' | 'orders' | 'name'

  // Modals state
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState(null);
  const [activeInvoiceShop, setActiveInvoiceShop] = useState(null);
  const [isAddShopOpen, setIsAddShopOpen] = useState(false);
  const [paymentModalShop, setPaymentModalShop] = useState(null);

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
          order.phone.replace(/\D/g, '') === shop.phone.replace(/\D/g, '')
        )
          return true;
        return false;
      });

      const orderCount = shopOrders.length;
      const totalOrderValue = shopOrders.reduce(
        (sum, o) => sum + Number(o.total || 0),
        0,
      );
      const totalPaid = shopOrders.reduce(
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
      );

      const calculatedDue = shopOrders.reduce((sum, o) => {
        const orderDue =
          o.dueAmount !== undefined
            ? Number(o.dueAmount)
            : Math.max(0, Number(o.total || 0) - Number(o.amountPaid || 0));
        return sum + orderDue;
      }, 0);

      // Total due is calculated due plus any static initial due
      const dueAmount = Math.max(
        0,
        calculatedDue + Number(shop.initialDue || 0),
      );

      const totalItems = shopOrders.reduce((sum, o) => {
        return (
          sum +
          (o.items || []).reduce((isum, i) => isum + Number(i.quantity || 1), 0)
        );
      }, 0);

      return {
        ...shop,
        orderCount,
        totalOrderValue,
        totalPaid,
        dueAmount,
        totalItems,
      };
    });
  }, [shopsList, allCounterOrders]);

  // Active Selected Shop
  const activeShop = useMemo(() => {
    const targetId = routeShopId || selectedShopId;
    if (!targetId) return null;
    return processedShops.find(s => String(s.id) === String(targetId)) || null;
  }, [routeShopId, selectedShopId, processedShops]);

  // Filtered and Sorted Shops
  const visibleShops = useMemo(() => {
    const q = search.trim().toLowerCase();
    return processedShops
      .filter(shop => {
        if (dueFilter === 'due' && shop.dueAmount <= 0) return false;
        if (dueFilter === 'paid' && shop.dueAmount > 0) return false;
        if (dueFilter === 'dhaka' && !shop.district?.includes('ঢাকা'))
          return false;
        if (dueFilter === 'ctg' && !shop.district?.includes('চট্টগ্রাম'))
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
        return a.shopName.localeCompare(b.shopName, 'bn');
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
      navigate(`/dashboard/all-users/shops/${shop.id}`);
    }
  };

  const handleBackToList = () => {
    setSelectedShopId(null);
    if (!embedded) {
      navigate('/dashboard/all-users/shops');
    }
  };

  const handlePaymentRecorded = (shopId, amountPaid) => {
    const updated = shopsList.map(s => {
      if (String(s.id) === String(shopId)) {
        const currentInitial = Number(s.initialDue || 0);
        return {
          ...s,
          initialDue: Math.max(0, currentInitial - amountPaid),
        };
      }
      return s;
    });
    setShopsList(updated);
    updateStoredShop(shopId, {
      initialDue: Math.max(
        0,
        Number(
          updated.find(s => String(s.id) === String(shopId))?.initialDue || 0,
        ),
      ),
    });
  };

  // If a shop is active, show the detailed profile & order history view
  if (activeShop) {
    return (
      <div className="space-y-5 sm:space-y-6">
        {!embedded && (
          <PageHeader
            title={`${activeShop.shopName} — প্রোফাইল ও অর্ডার হিস্ট্রি`}
            subtitle="দোকানের বিস্তারিত তথ্য, ক্রয়কৃত চালান এবং বকেয়া লেজার হিসাব"
          />
        )}

        <ShopDetailsView
          shop={activeShop}
          onBack={handleBackToList}
          allOrders={allCounterOrders}
          allBooks={books}
          onOpenOrderModal={(order, shop) => {
            setActiveInvoiceOrder(order);
            setActiveInvoiceShop(shop);
          }}
          onOpenPaymentModal={shop => setPaymentModalShop(shop)}
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
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Page Header (Hidden when embedded in Counter Sales) */}
      {!embedded && (
        <PageHeader
          title="দোকান ও কাউন্টার গ্রাহক (Shop Management)"
          subtitle="কাউন্টার ও শোরুম থেকে সরাসরি বই নেওয়া বুকশপ, লাইব্রেরি ও পাইকারি গ্রাহকদের তালিকা ও প্রোফাইল"
        />
      )}

      {/* Top 4 KPI Metrics Cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
        <div className="min-w-0 rounded-2xl border border-dark/10 bg-white p-3 shadow-2xs sm:p-4">
          <div className="flex items-center justify-between gap-2 text-dark/60">
            <span className="text-xs font-semibold">নিবন্ধিত দোকান</span>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-dark">
              <FiShoppingBag className="text-base" />
            </div>
          </div>
          <p className="mt-2 font-heading text-xl font-bold text-dark sm:text-2xl">
            {toBnNum(totalShopsCount)} টি
          </p>
          <p className="mt-0.5 text-[11px] text-dark/50">
            বুকশপ ও লাইব্রেরি পার্টনার
          </p>
        </div>

        <div className="min-w-0 rounded-2xl border border-dark/10 bg-white p-3 shadow-2xs sm:p-4">
          <div className="flex items-center justify-between gap-2 text-dark/60">
            <span className="text-xs font-semibold">মোট কাউন্টার বিক্রি</span>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
              <FiTrendingUp className="text-base" />
            </div>
          </div>
          <p className="mt-2 break-words font-heading text-xl font-bold text-emerald-700 sm:text-2xl">
            ৳{toBnNum(totalSalesAll)}
          </p>
          <p className="mt-0.5 text-[11px] text-dark/50">
            সকল দোকানের সর্বমোট চালান
          </p>
        </div>

        <div className="min-w-0 rounded-2xl border border-dark/10 bg-white p-3 shadow-2xs sm:p-4">
          <div className="flex items-center justify-between gap-2 text-dark/60">
            <span className="text-xs font-semibold">আদায়কৃত পেমেন্ট</span>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-800">
              <FiDollarSign className="text-base" />
            </div>
          </div>
          <p className="mt-2 break-words font-heading text-xl font-bold text-dark sm:text-2xl">
            ৳{toBnNum(totalPaidAll)}
          </p>
          <p className="mt-0.5 text-[11px] text-dark/50">নগদ ও ডিজিটাল জমা</p>
        </div>

        <div
          className={`min-w-0 rounded-2xl border p-3 shadow-2xs sm:p-4 ${
            totalDueAll > 0
              ? 'border-amber-200 bg-amber-50/70'
              : 'border-emerald-200 bg-emerald-50/70'
          }`}
        >
          <div className="flex items-center justify-between gap-2 text-dark/60">
            <span className="text-xs font-semibold">সর্বমোট বকেয়া (Due)</span>
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                totalDueAll > 0
                  ? 'bg-amber-200 text-amber-900'
                  : 'bg-emerald-200 text-emerald-900'
              }`}
            >
              <FiAlertTriangle className="text-base" />
            </div>
          </div>
          <p
            className={`mt-2 break-words font-heading text-xl font-bold sm:text-2xl ${
              totalDueAll > 0 ? 'text-amber-800' : 'text-emerald-800'
            }`}
          >
            ৳{toBnNum(totalDueAll)}
          </p>
          <p className="mt-0.5 text-[11px] text-dark/60">
            {totalDueAll > 0
              ? 'দোকানদারদের কাছে প্রাপ্য'
              : 'সব বকেয়া পরিশোধিত'}
          </p>
        </div>
      </div>

      {/* Filter, Search & Add Shop Bar */}
      <div className="rounded-2xl border border-dark/10 bg-white p-3 shadow-2xs sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark/40" />
            <input
              type="text"
              placeholder="দোকানের নাম, স্বত্বাধিকারী, মোবাইল নম্বর বা এলাকা খুঁজুন..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-xl border border-dark/15 bg-cream/40 py-2.5 pl-10 pr-4 text-xs text-dark placeholder:text-dark/40 focus:border-primary focus:bg-white focus:outline-none sm:text-sm"
            />
          </div>

          {/* Filters & Actions */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <select
              value={dueFilter}
              onChange={e => setDueFilter(e.target.value)}
              className="w-full rounded-xl border border-dark/15 bg-white px-3 py-2.5 text-xs font-semibold text-dark focus:border-primary focus:outline-none sm:w-auto"
            >
              <option value="all">
                সকল দোকান ({toBnNum(totalShopsCount)})
              </option>
              <option value="due">বকেয়া রয়েছে এমন</option>
              <option value="paid">পরিশোধিত (Zero Due)</option>
              <option value="dhaka">ঢাকা অঞ্চল</option>
              <option value="ctg">চট্টগ্রাম অঞ্চল</option>
            </select>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="w-full rounded-xl border border-dark/15 bg-white px-3 py-2.5 text-xs font-semibold text-dark focus:border-primary focus:outline-none sm:w-auto"
            >
              <option value="value">সর্বোচ্চ অর্ডার ভ্যালু</option>
              <option value="due">সর্বোচ্চ বকেয়া</option>
              <option value="orders">সর্বোচ্চ অর্ডার সংখ্যা</option>
              <option value="name">দোকানের নাম (অ-আ)</option>
            </select>

            <button
              type="button"
              onClick={() => setIsAddShopOpen(true)}
              className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-dark shadow-2xs transition hover:bg-primary-hover sm:col-auto"
            >
              <FiPlus className="text-sm" /> নতুন দোকান যোগ করুন
            </button>
          </div>
        </div>
      </div>

      {/* Mobile / tablet: shop cards */}
      <div className="space-y-3 lg:hidden">
        {visibleShops.length === 0 ? (
          <div className="rounded-2xl border border-dark/10 bg-white py-12 text-center text-xs text-dark/50">
            কোনো দোকান খুঁজে পাওয়া যায়নি।
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {visibleShops.map(shop => (
              <div
                key={shop.id}
                onClick={() => handleSelectShop(shop)}
                className="cursor-pointer rounded-2xl border border-dark/10 bg-white p-4 shadow-2xs transition hover:bg-cream/40"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-amber-200 text-dark shadow-2xs">
                    <FiShoppingBag className="text-lg" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block break-words font-heading text-sm font-bold text-dark">
                      {shop.shopName}
                    </span>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="rounded bg-dark/5 px-1.5 py-0.5 text-[10px] font-semibold text-dark/70">
                        {shop.category}
                      </span>
                      {shop.district && (
                        <span className="text-[10px] font-medium text-dark/50">
                          • {shop.district}
                        </span>
                      )}
                    </div>
                  </div>
                  {shop.dueAmount > 0 ? (
                    <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                      ৳{toBnNum(shop.dueAmount)} বকেয়া
                    </span>
                  ) : (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                      <FiCheckCircle size={12} /> পরিশোধিত
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 text-xs text-dark/70">
                  <span className="min-w-0 truncate font-semibold text-dark">
                    {shop.representative || shop.ownerName || '—'}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="font-mono text-[11px]">{shop.phone}</span>
                    <a
                      href={`https://wa.me/88${shop.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-emerald-600 hover:text-emerald-700"
                      title="WhatsApp"
                    >
                      <FaWhatsapp size={15} />
                    </a>
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-dark/10 pt-3 text-xs">
                  <div>
                    <span className="block text-[11px] text-dark/50">
                      অর্ডার
                    </span>
                    <span className="font-heading font-bold text-dark">
                      {toBnNum(shop.orderCount)} টি
                    </span>
                    <span className="block text-[10px] text-dark/50">
                      {toBnNum(shop.totalItems)} কপি
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-dark/50">
                      অর্ডার ভ্যালু
                    </span>
                    <span className="font-heading font-bold text-emerald-700">
                      ৳{toBnNum(shop.totalOrderValue)}
                    </span>
                    <span className="block text-[10px] text-dark/50">
                      জমা: ৳{toBnNum(shop.totalPaid)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-dark/50">
                      কমিশন
                    </span>
                    <span className="font-bold text-dark/80">
                      {toBnNum(shop.defaultCommission || 35)}%
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    handleSelectShop(shop);
                  }}
                  className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-dark/15 bg-white px-3 py-2 text-xs font-semibold text-dark shadow-2xs transition hover:border-primary hover:bg-primary"
                >
                  <FiEye /> বিস্তারিত
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: shops table */}
      <div className="hidden overflow-hidden rounded-2xl border border-dark/10 bg-white shadow-2xs lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-xs">
            <thead className="border-b border-dark/10 bg-dark/5 text-[11px] font-bold uppercase tracking-wider text-dark">
              <tr>
                <th className="px-4 py-3.5">দোকানের নাম ও আইডি</th>
                <th className="px-4 py-3.5">স্বত্বাধিকারী ও যোগাযোগ</th>
                <th className="px-4 py-3.5 text-center">মোট অর্ডার</th>
                <th className="px-4 py-3.5 text-right">মোট অর্ডার ভ্যালু</th>
                <th className="px-4 py-3.5 text-right">ডিউ বিল (Due)</th>
                <th className="px-4 py-3.5 text-center">কমিশন রেট</th>
                <th className="px-4 py-3.5 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark/5">
              {visibleShops.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-dark/50">
                    কোনো দোকান খুঁজে পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                visibleShops.map(shop => (
                  <tr
                    key={shop.id}
                    onClick={() => handleSelectShop(shop)}
                    className="group cursor-pointer transition hover:bg-cream/40"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-amber-200 font-bold text-dark shadow-2xs">
                          <FiShoppingBag className="text-lg" />
                        </div>
                        <div>
                          <span className="font-heading text-sm font-bold text-dark transition group-hover:text-primary-hover">
                            {shop.shopName}
                          </span>
                          <div className="mt-0.5 flex items-center gap-2">
                            <span className="rounded bg-dark/5 px-1.5 py-0.5 text-[10px] font-semibold text-dark/70">
                              {shop.category}
                            </span>
                            {shop.district && (
                              <span className="text-[10px] font-medium text-dark/50">
                                • {shop.district}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="block font-semibold text-dark">
                        {shop.representative || shop.ownerName || '—'}
                      </span>
                      <div className="mt-0.5 flex items-center gap-2 text-dark/70">
                        <span className="font-mono text-[11px]">
                          {shop.phone}
                        </span>
                        <a
                          href={`https://wa.me/88${shop.phone.replace(
                            /\D/g,
                            '',
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="text-emerald-600 hover:text-emerald-700"
                          title="WhatsApp"
                        >
                          <FaWhatsapp size={13} />
                        </a>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span className="block font-heading text-sm font-bold text-dark">
                        {toBnNum(shop.orderCount)} টি
                      </span>
                      <span className="text-[11px] text-dark/50">
                        {toBnNum(shop.totalItems)} কপি বই
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <span className="block font-heading text-sm font-bold text-emerald-700">
                        ৳{toBnNum(shop.totalOrderValue)}
                      </span>
                      <span className="text-[11px] text-dark/50">
                        পরিশোধিত: ৳{toBnNum(shop.totalPaid)}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      {shop.dueAmount > 0 ? (
                        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-amber-100 px-2.5 py-0.5 font-bold text-amber-800">
                          ৳{toBnNum(shop.dueAmount)} বকেয়া
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 font-bold text-emerald-800">
                          <FiCheckCircle size={12} /> পরিশোধিত
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span className="rounded-md bg-dark/5 px-2 py-1 font-bold text-dark/80">
                        {toBnNum(shop.defaultCommission || 35)}%
                      </span>
                    </td>

                    <td
                      className="px-4 py-3.5 text-right"
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectShop(shop)}
                        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-dark/15 bg-white px-3 py-1.5 text-xs font-semibold text-dark shadow-2xs transition hover:border-primary hover:bg-primary"
                      >
                        <FiEye /> বিস্তারিত
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Shop Modal */}
      <AddShopModal
        isOpen={isAddShopOpen}
        onClose={() => setIsAddShopOpen(false)}
        onCreated={() => {
          setShopsList(getStoredShops());
        }}
      />
    </div>
  );
}
