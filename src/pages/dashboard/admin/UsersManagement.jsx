import { useState, useMemo } from 'react';
import {
  FiArrowLeft,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiCopy,
  FiExternalLink,
  FiEye,
  FiFileText,
  FiHeart,
  FiMail,
  FiMapPin,
  FiPackage,
  FiPhone,
  FiPrinter,
  FiSearch,
  FiShoppingBag,
  FiTrendingUp,
  FiTruck,
  FiUser,
  FiUserCheck,
  FiUsers,
  FiX,
  FiXCircle,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../../components/dashboard/PageHeader';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import { useAuth } from '../../../context/useAuth';
import { useData } from '../../../context/useData';
import { formatCurrency } from '../../../utils/format';

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

const toBnNum = (value) => {
  const bnDigits = '০১২৩৪৫৬৭৮৯';
  return String(value ?? '').replace(/\d/g, (d) => bnDigits[Number(d)]);
};

const formatDate = (isoString) => {
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

function readWishlistIds(userId) {
  try {
    const stored = localStorage.getItem(`hosonta_wishlist_${userId}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Resolves book details (cover, title, author, price) from the books dataset
function resolveOrderItem(item, allBooks = []) {
  const matchedBook = allBooks.find(
    (b) => String(b.id) === String(item.bookId || item.id)
  );

  return {
    ...item,
    cover:
      item.cover ||
      item.image ||
      matchedBook?.cover ||
      matchedBook?.image ||
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80',
    title: item.title || matchedBook?.title || 'বইয়ের নাম',
    author: item.author || matchedBook?.author || 'লেখক',
    category: item.category || matchedBook?.category || 'সাহিত্য',
    price: Number(item.price ?? matchedBook?.price ?? 0),
    quantity: Number(item.quantity ?? item.qty ?? 1),
  };
}

// Generates courier details and status
function getCourierInfo(order) {
  const isCounter = order.orderType === 'counter';
  const courierName =
    order.courier ||
    (isCounter ? 'কাউন্টার ডেলিভারি / শোরুম' : 'Steadfast Courier');

  const consignmentId =
    order.consignmentId ||
    order.trackingCode ||
    (isCounter
      ? `CNT-${order.id.slice(-6)}`
      : `STD-${order.id.replace(/[^\d]/g, '').slice(-8) || '84930215'}`);

  let courierStatusText = 'প্রক্রিয়াকরণ চলছে';
  let badgeColor = 'bg-amber-50 text-amber-700 ring-amber-200/60';

  if (order.status === 'delivered') {
    courierStatusText = 'ডেলিভারি সম্পন্ন (Delivered)';
    badgeColor = 'bg-emerald-50 text-emerald-700 ring-emerald-200/60';
  } else if (order.status === 'shipped') {
    courierStatusText = 'ইন ট্রানজিট - ডেলিভারির জন্য প্রেরিত (Out for Delivery)';
    badgeColor = 'bg-blue-50 text-blue-700 ring-blue-200/60';
  } else if (order.status === 'processing') {
    courierStatusText = 'পার্সেল প্রস্তুত ও বুকিং সম্পন্ন (Booked)';
    badgeColor = 'bg-indigo-50 text-indigo-700 ring-indigo-200/60';
  } else if (order.status === 'cancelled') {
    courierStatusText = 'বাতিল / রিটার্ন করা হয়েছে (Cancelled/Returned)';
    badgeColor = 'bg-rose-50 text-rose-700 ring-rose-200/60';
  } else {
    courierStatusText = 'অর্ডার বুকিং অপেক্ষমান (Pending Pickup)';
  }

  return {
    courierName,
    consignmentId,
    courierStatusText,
    badgeColor,
    isCounter,
  };
}

/* ------------------------------------------------------------------ */
/* Order Details & Invoice Modal Component                            */
/* ------------------------------------------------------------------ */

function OrderDetailsInvoiceModal({ order, user, allBooks, onClose }) {
  const [modalTab, setModalTab] = useState('details'); // 'details' | 'invoice'

  if (!order) return null;

  const items = (order.items || []).map((item) =>
    resolveOrderItem(item, allBooks)
  );

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryCharge = Number(
    order.deliveryCharge ?? (order.orderType === 'counter' ? 0 : 60)
  );
  const discount = Number(order.discount ?? 0);
  const grandTotal = Number(order.total ?? subtotal + deliveryCharge - discount);
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const courier = getCourierInfo(order);

  const handleCopy = (text, label = 'আইডি') => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success(`${label} কপি করা হয়েছে!`);
    }
  };

  const handlePrint = () => {
    setModalTab('invoice');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-xs transition-opacity print:p-0 print:bg-white"
    >
      {/* Print Specific CSS */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #invoice-printable, #invoice-printable * { visibility: visible !important; }
          #invoice-printable {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 15mm !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
          }
          @page { margin: 10mm; size: A4 portrait; }
        }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200 print:max-h-none print:shadow-none print:rounded-none"
      >
        {/* Modal Top Header (Hidden when printing) */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 bg-slate-50/70 px-4 py-3 sm:px-6 print:hidden">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-heading text-sm sm:text-base font-bold text-slate-900">
              অর্ডার বিবরণ ও চালান
            </span>
            <span className="font-mono text-xs font-semibold text-primary-hover bg-primary/10 px-2 py-0.5 rounded">
              {order.id}
            </span>
            <button
              type="button"
              onClick={() => handleCopy(order.id, 'অর্ডার আইডি')}
              title="কপি করুন"
              className="rounded p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200"
            >
              <FiCopy className="text-xs" />
            </button>
            <StatusBadge status={order.status} />
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex rounded-lg bg-slate-200/80 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setModalTab('details')}
                className={`rounded-md px-3 py-1 transition ${
                  modalTab === 'details'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                অর্ডার ও কুরিয়ার তথ্য
              </button>
              <button
                type="button"
                onClick={() => setModalTab('invoice')}
                className={`rounded-md px-3 py-1 transition ${
                  modalTab === 'invoice'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ইনভয়েস / ক্যাশ মেমো
              </button>
            </div>

            {/* Print button */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-dark transition hover:bg-primary-hover shadow-xs"
            >
              <FiPrinter className="text-sm" />
              <span className="hidden sm:inline">প্রিন্ট ইনভয়েস</span>
            </button>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
            >
              <FiX className="text-lg" />
            </button>
          </div>
        </div>

        {/* Modal Body: Tab 1 - Order & Courier Details */}
        {modalTab === 'details' && (
          <div className="overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Courier & Delivery Status Card */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                    <FiTruck className="text-2xl" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        কুরিয়ার ও ডেলিভারি পার্টনার
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${courier.badgeColor}`}
                      >
                        {courier.courierStatusText}
                      </span>
                    </div>
                    <h3 className="font-heading text-base sm:text-lg font-bold text-slate-900">
                      {courier.courierName}
                    </h3>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 sm:text-right">
                  <p className="text-[11px] font-medium text-slate-400">
                    কনসাইনমেন্ট / ট্র্যাকিং নম্বর
                  </p>
                  <div className="mt-0.5 flex items-center gap-1.5 sm:justify-end">
                    <span className="font-mono text-sm font-bold text-slate-800">
                      {courier.consignmentId}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(courier.consignmentId, 'ট্র্যাকিং কোড')
                      }
                      title="কপি করুন"
                      className="text-slate-400 hover:text-primary-hover"
                    >
                      <FiCopy className="text-xs" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Delivery Step Progression */}
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 border-t border-slate-200/80 pt-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white text-xs">
                    <FiCheckCircle />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900">অর্ডার গ্রহণ</p>
                    <p className="text-[10px] text-slate-500">{formatDate(order.date)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                      order.status !== 'new'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    <FiCheckCircle />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900">প্যাকেজিং সম্পন্ন</p>
                    <p className="text-[10px] text-slate-500">স্টক বরাদ্দ</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                      order.status === 'shipped' || order.status === 'delivered'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    <FiTruck />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900">কুরিয়ারে হস্তান্তর</p>
                    <p className="text-[10px] text-slate-500">{courier.courierName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                      order.status === 'delivered'
                        ? 'bg-emerald-500 text-white'
                        : order.status === 'cancelled'
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {order.status === 'delivered' ? (
                      <FiCheckCircle />
                    ) : order.status === 'cancelled' ? (
                      <FiXCircle />
                    ) : (
                      <FiClock />
                    )}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      {order.status === 'delivered'
                        ? 'ডেলিভারি সম্পন্ন'
                        : order.status === 'cancelled'
                        ? 'অর্ডার বাতিল'
                        : 'ডেলিভারি অপেক্ষমান'}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {order.status === 'delivered' ? 'গ্রাহক গ্রহণ করেছেন' : 'প্রক্রিয়াধীন'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Books Ordered List Section (তিনি কোন বই গুলো নিয়েছেন) */}
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <h4 className="font-heading text-sm sm:text-base font-bold text-slate-900">
                  অর্ডারকৃত বইসমূহ ({toBnNum(totalItemCount)}টি বই)
                </h4>
                <span className="text-xs font-medium text-slate-500">
                  আইটেম সংখ্যা: {toBnNum(items.length)}টি
                </span>
              </div>

              <div className="mt-3 divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <div
                    key={`${item.bookId || item.id || idx}`}
                    className="flex items-center justify-between gap-3 py-3 hover:bg-slate-50/50 rounded-xl px-2 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={item.cover}
                        alt={item.title}
                        className="h-14 w-11 rounded-lg border border-slate-200 object-cover shadow-2xs shrink-0"
                      />
                      <div className="min-w-0">
                        <h5 className="font-heading text-sm font-bold text-slate-900 truncate">
                          {item.title}
                        </h5>
                        <p className="text-xs text-slate-500 truncate">
                          লেখক: {item.author}
                        </p>
                        <span className="inline-block mt-0.5 rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-medium text-slate-600">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-5 shrink-0 text-right">
                      <div>
                        <p className="text-xs text-slate-500">
                          একক মূল্য: {formatCurrency(item.price)}
                        </p>
                        <p className="text-xs font-semibold text-slate-800">
                          পরিমাণ: {toBnNum(item.quantity)} কপি
                        </p>
                      </div>
                      <div className="w-20 text-right font-heading text-sm font-bold text-slate-900">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Details & Summary Grid */}
            <div className="grid gap-5 md:grid-cols-2 pt-2">
              {/* Shipping & Customer Information */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5 text-xs sm:text-sm">
                <h5 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
                  গ্রাহক ও ডেলিভারি বিবরণ
                </h5>
                <div className="flex justify-between">
                  <span className="text-slate-500">গ্রাহকের নাম:</span>
                  <span className="font-semibold text-slate-900">
                    {order.customerName || user?.name || 'গ্রাহক'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">মোবাইল নাম্বার:</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {order.phone || user?.phone || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ডেলিভারি ঠিকানা:</span>
                  <span className="max-w-[200px] text-right font-medium text-slate-800">
                    {order.address || user?.address || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">অর্ডার তারিখ:</span>
                  <span className="font-medium text-slate-800">
                    {formatDate(order.date)}
                  </span>
                </div>
                {order.notes && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400 block">বিশেষ নোট:</span>
                    <p className="text-xs font-medium text-slate-700 mt-0.5">
                      {order.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Payment & Total Amount Calculation */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 text-xs sm:text-sm">
                <h5 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
                  পেমেন্ট ও হিসাব বিবরণী
                </h5>
                <div className="flex justify-between">
                  <span className="text-slate-500">পেমেন্ট মাধ্যম:</span>
                  <span className="font-semibold uppercase text-slate-800">
                    {order.paymentMethod || 'ক্যাশ অন ডেলিভারি (COD)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">পেমেন্ট স্ট্যাটাস:</span>
                  <span
                    className={`font-semibold rounded-full px-2 py-0.2 text-xs ${
                      order.paymentStatus === 'paid' || order.paymentStatus === 'verified'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {order.paymentStatus === 'paid' || order.paymentStatus === 'verified'
                      ? 'পরিশোধিত (Paid)'
                      : 'বকেয়া / COD'}
                  </span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">আইটেম সাবটোটাল:</span>
                  <span className="font-medium text-slate-800">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">কুরিয়ার ডেলিভারি চার্জ:</span>
                  <span className="font-medium text-slate-800">
                    {formatCurrency(deliveryCharge)}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>বিশেষ ছাড় / ডিসকাউন্ট:</span>
                    <span>- {formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-2 text-sm sm:text-base font-bold text-slate-900">
                  <span>সর্বমোট প্রদেয় মূল্য:</span>
                  <span className="text-primary-hover font-heading">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Body: Tab 2 - Official Printable Invoice */}
        {modalTab === 'invoice' && (
          <div className="overflow-y-auto p-4 sm:p-8 bg-slate-100/50 print:bg-white print:p-0">
            {/* The printable invoice element */}
            <article
              id="invoice-printable"
              className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm print:max-w-none print:border-none print:shadow-none print:p-0"
            >
              {/* Invoice Header */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-slate-200 pb-6">
                <div>
                  <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {COMPANY.name}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {COMPANY.legalName}
                    <br />
                    {COMPANY.address}
                    <br />
                    হটলাইন: {COMPANY.hotline} | {COMPANY.email}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="inline-block rounded-md bg-dark px-3 py-1 font-heading text-sm font-bold uppercase tracking-widest text-white">
                    INVOICE / ক্যাশ মেমো
                  </span>
                  <p className="mt-2 text-xs text-slate-500">
                    চালান নম্বর: <strong className="text-slate-900 font-mono">{order.id}</strong>
                  </p>
                  <p className="text-xs text-slate-500">
                    তারিখ: <strong className="text-slate-900">{formatDate(order.date)}</strong>
                  </p>
                  <p className="text-xs text-slate-500">
                    কুরিয়ার:{' '}
                    <strong className="text-slate-900">{courier.courierName}</strong>
                  </p>
                </div>
              </div>

              {/* Billed To / Shipping Address */}
              <div className="grid grid-cols-2 gap-4 py-5 border-b border-slate-200 text-xs sm:text-sm">
                <div>
                  <p className="font-heading text-xs font-bold uppercase tracking-wider text-slate-400">
                    বিলিং ও প্রাপকের বিবরণ
                  </p>
                  <p className="mt-1 font-bold text-slate-900 text-sm">
                    {order.customerName || user?.name || 'গ্রাহক'}
                  </p>
                  <p className="text-slate-600 font-mono mt-0.5">
                    ফোন: {order.phone || user?.phone || '—'}
                  </p>
                  <p className="text-slate-600 mt-0.5">
                    ইমেইল: {user?.email || '—'}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-heading text-xs font-bold uppercase tracking-wider text-slate-400">
                    ডেলিভারি ঠিকানা ও কুরিয়ার
                  </p>
                  <p className="mt-1 font-medium text-slate-800">
                    {order.address || user?.address || '—'}
                  </p>
                  <p className="text-slate-600 font-mono text-xs mt-0.5">
                    ট্র্যাকিং আইডি: <strong>{courier.consignmentId}</strong>
                  </p>
                  <p className="text-slate-600 text-xs mt-0.5">
                    পেমেন্ট:{' '}
                    <strong className="uppercase">
                      {order.paymentMethod || 'ক্যাশ অন ডেলিভারি'}
                    </strong>
                  </p>
                </div>
              </div>

              {/* Invoice Items Table */}
              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-300 bg-slate-50 text-xs font-bold text-slate-700">
                      <th className="py-2.5 px-3 w-10 text-center">নং</th>
                      <th className="py-2.5 px-3">পুস্তকের নাম ও বিবরণ</th>
                      <th className="py-2.5 px-3 w-20 text-center">পরিমাণ</th>
                      <th className="py-2.5 px-3 w-24 text-right">একক মূল্য</th>
                      <th className="py-2.5 px-3 w-28 text-right">মোট টাকা</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td className="py-3 px-3 text-center text-slate-500 font-mono">
                          {toBnNum(index + 1)}
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-900">{item.title}</p>
                          <p className="text-xs text-slate-500">লেখক: {item.author}</p>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-800 font-mono">
                          {toBnNum(item.quantity)}
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-slate-700">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900">
                          {formatCurrency(item.price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Invoice Calculations */}
              <div className="mt-6 flex flex-col sm:flex-row items-start justify-between gap-4 border-t border-slate-200 pt-4">
                <div className="text-xs text-slate-500 max-w-sm">
                  <p className="font-bold text-slate-700">শর্তাবলী ও নিয়মাবলী:</p>
                  <p className="mt-1 leading-relaxed">
                    ১. প্রাপ্ত বইয়ে কোনো মুদ্রণ বা বাঁধাই ত্রুটি থাকলে ৭ দিনের মধ্যে পরিবর্তনযোগ্য।
                    <br />
                    ২. এটি একটি স্বয়ংক্রিয় কম্পিউটার জেনারেটেড ইনভয়েস, কোনো স্বাক্ষরের প্রয়োজন নেই।
                  </p>
                </div>

                <div className="w-full sm:w-64 space-y-1.5 text-xs sm:text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>মোট পণ্যের মূল্য:</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>কুরিয়ার ডেলিভারি ফি:</span>
                    <span className="font-medium">{formatCurrency(deliveryCharge)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>ছাড় / ডিসকাউন্ট:</span>
                      <span>- {formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t-2 border-slate-900 pt-2 text-base font-bold text-slate-900">
                    <span>সর্বমোট টাকা:</span>
                    <span className="font-heading">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Invoice Footer / Signatures */}
              <div className="mt-12 flex items-center justify-between border-t border-dashed border-slate-200 pt-6 text-xs text-slate-400">
                <p>হসন্ত প্রকাশনের বই বেছে নেওয়ার জন্য ধন্যবাদ।</p>
                <div className="text-right">
                  <p className="font-heading font-semibold text-slate-700">অনুমোদিত স্বাক্ষর</p>
                  <p className="text-[10px]">হসন্ত প্রকাশন অথরিটি</p>
                </div>
              </div>
            </article>
          </div>
        )}

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-6 print:hidden">
          <p className="text-xs text-slate-500">
            অর্ডার স্ট্যাটাস:{' '}
            <strong className="text-slate-800">{courier.courierStatusText}</strong>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-dark px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
            >
              <FiPrinter />
              <span>ইনভয়েস প্রিন্ট / ডাউনলোড</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* User Profile Details View                                          */
/* ------------------------------------------------------------------ */

function UserDetailsView({ user, onBack, allOrders, allBooks }) {
  const [activeTab, setActiveTab] = useState('orders');
  const [selectedOrderForModal, setSelectedOrderForModal] = useState(null);

  // Filter orders of this user
  const userOrders = useMemo(() => {
    return allOrders.filter(
      (o) =>
        (o.userId && o.userId === user.id) ||
        (o.phone && user.phone && o.phone === user.phone) ||
        (o.customerName && user.name && o.customerName === user.name)
    );
  }, [allOrders, user]);

  // Wishlist books
  const userWishlistBooks = useMemo(() => {
    const ids = user.wishlistIds || [];
    return allBooks.filter((book) =>
      ids.some((id) => String(id) === String(book.id))
    );
  }, [allBooks, user]);

  return (
    <div className="space-y-6">
      {/* Top back button & title */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-xs ring-1 ring-slate-200/80 transition hover:bg-slate-50 hover:text-dark"
        >
          <FiArrowLeft className="text-base" />
          <span>সকল গ্রাহক তালিকায় ফিরুন</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">ইউজার আইডি:</span>
          <code className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono font-medium text-slate-700">
            {user.id}
          </code>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-18 w-18 shrink-0 sm:h-20 sm:w-20">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-full w-full rounded-2xl object-cover ring-2 ring-primary/30"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-2xl bg-primary/20 text-2xl font-bold text-dark">
                  {user.name.charAt(0)}
                </div>
              )}
              <span
                className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white ${
                  user.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
                title={user.status === 'active' ? 'সক্রিয়' : 'স্থগিত'}
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-xl font-bold text-slate-900 sm:text-2xl">
                  {user.name}
                </h1>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    user.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {user.status === 'active' ? 'সক্রিয় অ্যাকাউন্ট' : 'স্থগিত'}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  {user.role === 'admin'
                    ? 'অ্যাডমিন'
                    : user.role === 'author'
                    ? 'লেখক'
                    : 'সাধারণ গ্রাহক'}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 sm:text-sm">
                <span className="flex items-center gap-1.5">
                  <FiMail className="text-slate-400" />
                  <a
                    href={`mailto:${user.email}`}
                    className="hover:text-primary-hover hover:underline"
                  >
                    {user.email}
                  </a>
                </span>
                {user.phone && (
                  <span className="flex items-center gap-1.5">
                    <FiPhone className="text-slate-400" />
                    <a
                      href={`tel:${user.phone}`}
                      className="font-medium text-slate-700 hover:text-primary-hover"
                    >
                      {user.phone}
                    </a>
                  </span>
                )}
                {user.city && (
                  <span className="flex items-center gap-1.5">
                    <FiMapPin className="text-slate-400" />
                    <span>{user.city}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick contact buttons */}
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 md:border-0 md:pt-0">
            {user.phone && (
              <a
                href={`tel:${user.phone}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                <FiPhone /> কল করুন
              </a>
            )}
            {user.phone && (
              <a
                href={`https://wa.me/${user.phone.replace(/[^\d]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                <FaWhatsapp /> হোয়াটসঅ্যাপ
              </a>
            )}
            <a
              href={`mailto:${user.email}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-dark transition hover:bg-primary-hover"
            >
              <FiMail /> ইমেইল পাঠান
            </a>
          </div>
        </div>
      </div>

      {/* 4 Key Statistics Cards */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FiShoppingBag className="text-xl" />
            </span>
            <span className="text-[11px] font-medium text-slate-400">সর্বমোট অর্ডার</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {toBnNum(user.orderCount)} টি
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            সফল সম্পন্ন: {toBnNum(user.deliveredCount)} টি
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <FiTrendingUp className="text-xl" />
            </span>
            <span className="text-[11px] font-medium text-slate-400">মোট ক্রয়মূল্য</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {formatCurrency(user.totalSpent)}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">মোট লেনদেনের পরিমাণ</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                user.deliveryRate >= 90
                  ? 'bg-emerald-50 text-emerald-600'
                  : user.deliveryRate >= 80
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-rose-50 text-rose-600'
              }`}
            >
              <FiTruck className="text-xl" />
            </span>
            <span className="text-[11px] font-medium text-slate-400">ডেলিভারি সাকসেস</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {toBnNum(user.deliveryRate)}%
            </span>
            <span className="text-xs font-semibold text-emerald-600">
              {user.deliveryRate >= 90 ? 'খুব ভালো' : 'সাধারণ'}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">পার্সেল গ্রহণ করার হার</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <FiHeart className="text-xl" />
            </span>
            <span className="text-[11px] font-medium text-slate-400">উইশলিস্ট সংরক্ষিত</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {toBnNum(user.wishlistCount)} টি
          </p>
          <p className="mt-0.5 text-xs text-slate-500">পছন্দের তালিকায় রাখা বই</p>
        </div>
      </div>

      {/* Tabs: Orders / Wishlist / Contact Info */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-4 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`border-b-2 px-4 py-3 text-xs sm:text-sm font-semibold transition ${
              activeTab === 'orders'
                ? 'border-primary text-dark font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            অর্ডারের ইতিহাস ({toBnNum(userOrders.length)})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('wishlist')}
            className={`border-b-2 px-4 py-3 text-xs sm:text-sm font-semibold transition ${
              activeTab === 'wishlist'
                ? 'border-primary text-dark font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            উইশলিস্টে থাকা বই ({toBnNum(userWishlistBooks.length)})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`border-b-2 px-4 py-3 text-xs sm:text-sm font-semibold transition ${
              activeTab === 'info'
                ? 'border-primary text-dark font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            ঠিকানা ও বিবরণ
          </button>
        </div>

        {/* Tab 1: Orders Tab */}
        {activeTab === 'orders' && (
          <div className="p-4 sm:p-5">
            {userOrders.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <FiPackage className="mx-auto text-4xl text-slate-300" />
                <p className="mt-2 text-sm font-medium">এই ব্যবহারকারীর কোনো অর্ডার পাওয়া যায়নি।</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500">
                      <th className="pb-3 pr-4">অর্ডার আইডি</th>
                      <th className="pb-3 pr-4">তারিখ</th>
                      <th className="pb-3 pr-4">কুরিয়ার ও ট্র্যাকিং</th>
                      <th className="pb-3 pr-4">আইটেম বিবরণ</th>
                      <th className="pb-3 pr-4 text-right">মোট টাকা</th>
                      <th className="pb-3 pr-4 text-center">পেমেন্ট</th>
                      <th className="pb-3 pr-4 text-center">স্ট্যাটাস</th>
                      <th className="pb-3 text-right">পদক্ষেপ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {userOrders.map((order) => {
                      const itemCount = (order.items || []).reduce(
                        (sum, i) => sum + (i.quantity || i.qty || 1),
                        0
                      );
                      const courier = getCourierInfo(order);

                      return (
                        <tr
                          key={order.id}
                          onClick={() => setSelectedOrderForModal(order)}
                          className="transition hover:bg-slate-50/80 cursor-pointer group"
                        >
                          <td className="py-3.5 pr-4 font-mono font-bold text-slate-900 group-hover:text-primary-hover">
                            <span className="flex items-center gap-1.5">
                              <span>{order.id}</span>
                              <FiExternalLink className="text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </span>
                          </td>
                          <td className="whitespace-nowrap py-3.5 pr-4 text-xs text-slate-500">
                            {formatDate(order.date)}
                          </td>
                          <td className="whitespace-nowrap py-3.5 pr-4">
                            <p className="text-xs font-bold text-slate-800">
                              {courier.courierName}
                            </p>
                            <span className="font-mono text-[11px] text-slate-400">
                              {courier.consignmentId}
                            </span>
                          </td>
                          <td className="py-3.5 pr-4">
                            <p className="max-w-xs truncate text-xs font-medium text-slate-800">
                              {(order.items || []).map((i) => i.title).join(', ') || 'বই অর্ডার'}
                            </p>
                            <span className="text-[11px] text-slate-400">
                              মোট {toBnNum(itemCount)}টি বই
                            </span>
                          </td>
                          <td className="whitespace-nowrap py-3.5 pr-4 text-right font-bold text-slate-900">
                            {formatCurrency(order.total || 0)}
                          </td>
                          <td className="whitespace-nowrap py-3.5 pr-4 text-center">
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium uppercase text-slate-700">
                              {order.paymentMethod || 'COD'}
                            </span>
                          </td>
                          <td className="whitespace-nowrap py-3.5 pr-4 text-center">
                            <StatusBadge status={order.status} />
                          </td>
                          <td className="whitespace-nowrap py-3.5 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrderForModal(order);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-primary/15 px-2.5 py-1 text-xs font-bold text-dark transition hover:bg-primary hover:scale-105"
                            >
                              <FiEye />
                              <span>চালান ও বিবরণ</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Wishlist Tab */}
        {activeTab === 'wishlist' && (
          <div className="p-4 sm:p-5">
            {userWishlistBooks.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <FiHeart className="mx-auto text-4xl text-slate-300" />
                <p className="mt-2 text-sm font-medium">উইশলিস্টে কোনো বই সংরক্ষিত নেই।</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {userWishlistBooks.map((book) => (
                  <div
                    key={book.id}
                    className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-2.5 transition hover:shadow-md"
                  >
                    <div className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-slate-100">
                      <img
                        src={book.cover || book.image}
                        alt={book.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="mt-2 flex flex-1 flex-col">
                      <p className="font-heading text-xs font-bold text-slate-900 line-clamp-1">
                        {book.title}
                      </p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {book.author}
                      </p>
                      <p className="mt-auto pt-1 font-heading text-xs font-bold text-slate-900">
                        {formatCurrency(book.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Detailed Information Tab */}
        {activeTab === 'info' && (
          <div className="p-4 sm:p-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-500">
                  যোগাযোগ ও ডেলিভারি ঠিকানা
                </h4>
                <div className="mt-3 space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">পূর্ণ নাম:</span>
                    <span className="font-medium text-slate-900">{user.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ইমেইল:</span>
                    <span className="font-medium text-slate-900">{user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">মোবাইল নাম্বার:</span>
                    <span className="font-medium text-slate-900">{user.phone || 'দেওয়া হয়নি'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">শহর/জেলা:</span>
                    <span className="font-medium text-slate-900">{user.city || 'ঢাকা'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">বিস্তারিত ঠিকানা:</span>
                    <span className="max-w-xs text-right font-medium text-slate-900">
                      {user.address || 'তথ্য পাওয়া যায়নি'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-500">
                  অ্যাকাউন্ট ও মেম্বারশিপ বিবরণ
                </h4>
                <div className="mt-3 space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">অ্যাকাউন্ট রোল:</span>
                    <span className="font-semibold text-slate-800">
                      {user.role === 'admin'
                        ? 'অ্যাডমিন'
                        : user.role === 'author'
                        ? 'লেখক'
                        : 'সাধারণ ক্রেতা/পাঠক'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">অ্যাকাউন্ট স্ট্যাটাস:</span>
                    <span className="font-semibold text-emerald-600">
                      {user.status === 'active' ? 'সক্রিয় (Active)' : 'স্থগিত (Suspended)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">যোগদানের তারিখ:</span>
                    <span className="font-medium text-slate-900">
                      {formatDate(user.joinedDate || '2024-05-15')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ডেলিভারি রেট হিসেব:</span>
                    <span className="font-medium text-slate-900">
                      {toBnNum(user.deliveredCount)} / {toBnNum(user.orderCount)} সফল পার্সেল
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Order Details & Invoice Modal */}
      {selectedOrderForModal && (
        <OrderDetailsInvoiceModal
          order={selectedOrderForModal}
          user={user}
          allBooks={allBooks}
          onClose={() => setSelectedOrderForModal(null)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Users List View (Table & Metrics)                                  */
/* ------------------------------------------------------------------ */

function UsersManagement() {
  const { users: authUsers = [] } = useAuth();
  const { orders = [], books = [] } = useData();
  const { id: routeUserId } = useParams();
  const navigate = useNavigate();

  const [selectedUserId, setSelectedUserId] = useState(routeUserId || null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('orders');

  // Compute metrics for each user
  const processedUsers = useMemo(() => {
    return authUsers.map((user) => {
      // Find orders matching this user
      const userOrders = orders.filter(
        (o) =>
          (o.userId && o.userId === user.id) ||
          (o.phone && user.phone && o.phone === user.phone) ||
          (o.customerName && user.name && o.customerName === user.name)
      );

      const orderCount = userOrders.length;
      const totalSpent = userOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
      const deliveredCount = userOrders.filter((o) => o.status === 'delivered').length;

      // Delivery rate %
      const deliveryRate =
        orderCount > 0
          ? Math.round((deliveredCount / orderCount) * 100)
          : user.deliveryRate ?? 100;

      // Wishlist items
      const localWishlist = readWishlistIds(user.id);
      const wishlistIds = localWishlist.length > 0 ? localWishlist : user.wishlist || [];
      const wishlistCount = wishlistIds.length;

      return {
        ...user,
        phone: user.phone || '০১৭১২-৩৪৫৬৭৮',
        orderCount,
        totalSpent,
        deliveredCount,
        deliveryRate,
        wishlistIds,
        wishlistCount,
      };
    });
  }, [authUsers, orders]);

  // Active view: selected user if ID matched
  const activeUser = useMemo(() => {
    const targetId = routeUserId || selectedUserId;
    if (!targetId) return null;
    return processedUsers.find((u) => u.id === targetId) || null;
  }, [routeUserId, selectedUserId, processedUsers]);

  // Filtered & sorted list
  const visibleUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return processedUsers
      .filter((user) => {
        if (statusFilter !== 'all') {
          if (statusFilter === 'active' && user.status !== 'active') return false;
          if (statusFilter === 'user' && user.role !== 'user') return false;
          if (statusFilter === 'author' && user.role !== 'author') return false;
        }
        if (!q) return true;
        return [user.name, user.email, user.phone]
          .filter(Boolean)
          .some((val) => String(val).toLowerCase().includes(q));
      })
      .sort((a, b) => {
        if (sortBy === 'orders') return b.orderCount - a.orderCount;
        if (sortBy === 'spent') return b.totalSpent - a.totalSpent;
        if (sortBy === 'deliveryRate') return b.deliveryRate - a.deliveryRate;
        if (sortBy === 'wishlist') return b.wishlistCount - a.wishlistCount;
        return a.name.localeCompare(b.name, 'bn');
      });
  }, [processedUsers, search, statusFilter, sortBy]);

  // Overall summary metrics
  const totalUsersCount = processedUsers.length;
  const totalOrdersCount = processedUsers.reduce((s, u) => s + u.orderCount, 0);
  const totalSpentAll = processedUsers.reduce((s, u) => s + u.totalSpent, 0);
  const avgDeliveryRate =
    totalUsersCount > 0
      ? Math.round(
          processedUsers.reduce((s, u) => s + u.deliveryRate, 0) / totalUsersCount
        )
      : 100;

  // Handle open user details
  const handleSelectUser = (user) => {
    setSelectedUserId(user.id);
    navigate(`/dashboard/all-users/users/${user.id}`);
  };

  // Handle back to list
  const handleBackToList = () => {
    setSelectedUserId(null);
    navigate('/dashboard/all-users/users');
  };

  // If a user is selected, render the rich detail view
  if (activeUser) {
    return (
      <UserDetailsView
        user={activeUser}
        onBack={handleBackToList}
        allOrders={orders}
        allBooks={books}
      />
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="ব্যবহারকারী ব্যবস্থাপনা"
        description="নিবন্ধিত সকল গ্রাহকদের তালিকা, ফোন নাম্বার, ইমেইল, ডেলিভারি রেট, মোট অর্ডার ও উইশলিস্ট তথ্য।"
      />

      {/* Navigation Tab to Counter Sales */}
      <div className="flex flex-wrap items-center gap-2 border-b border-dark/10 pb-3">
        <span className="rounded-xl border border-primary bg-primary px-4 py-2 text-xs font-bold text-dark shadow-2xs flex items-center gap-1.5">
          <FiUsers /> গ্রাহক তালিকা (Users)
        </span>
        <Link
          to="/dashboard/counter-orders"
          className="rounded-xl border border-dark/10 bg-white px-4 py-2 text-xs font-bold text-dark/70 hover:bg-cream hover:text-dark transition shadow-2xs flex items-center gap-1.5"
        >
          <FiShoppingBag className="text-sm" /> Counter Sales
        </Link>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FiUsers className="text-xl" />
            </span>
            <span className="text-xs font-semibold text-slate-500">সর্বমোট ইউজার</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {toBnNum(totalUsersCount)} জন
          </p>
          <p className="mt-0.5 text-xs text-slate-500">নিবন্ধিত ক্রেতা ও ব্যবহারকারী</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <FiPackage className="text-xl" />
            </span>
            <span className="text-xs font-semibold text-slate-500">মোট অর্ডার</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {toBnNum(totalOrdersCount)} টি
          </p>
          <p className="mt-0.5 text-xs text-slate-500">গ্রাহকদের দেওয়া মোট অর্ডার</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <FiTrendingUp className="text-xl" />
            </span>
            <span className="text-xs font-semibold text-slate-500">মোট বিক্রি</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {formatCurrency(totalSpentAll)}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">গ্রাহকদের অর্ডারের সমষ্টি</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <FiTruck className="text-xl" />
            </span>
            <span className="text-xs font-semibold text-slate-500">গড় ডেলিভারি রেট</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {toBnNum(avgDeliveryRate)}%
          </p>
          <p className="mt-0.5 text-xs text-slate-500">সফলভাবে পার্সেল গ্রহণের হার</p>
        </div>
      </div>

      {/* Main Table Card */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {/* Controls: Search, Filter, Sort */}
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 border-b border-slate-100">
          <div className="relative w-full sm:w-72">
            <FiSearch
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="নাম, ইমেইল বা ফোন নাম্বার খুঁজুন..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-primary focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status & Role filters */}
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
              {[
                ['all', 'সকল ইউজার'],
                ['user', 'সাধারণ গ্রাহক'],
                ['author', 'লেখক'],
                ['active', 'সক্রিয়'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                    statusFilter === key
                      ? 'bg-white text-dark shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Sort by */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-primary cursor-pointer"
            >
              <option value="orders">অর্ডার সংখ্যা (বেশি থেকে কম)</option>
              <option value="spent">মোট খরচ (বেশি থেকে কম)</option>
              <option value="deliveryRate">ডেলিভারি রেট (বেশি থেকে কম)</option>
              <option value="wishlist">উইশলিস্ট বই (বেশি থেকে কম)</option>
              <option value="name">নামানুসারে</option>
            </select>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold text-slate-500">
                <th className="px-5 py-3.5">ব্যবহারকারী (নাম ও রোল)</th>
                <th className="px-5 py-3.5">যোগাযোগের তথ্য</th>
                <th className="px-5 py-3.5 text-center">ডেলিভারি রেট</th>
                <th className="px-5 py-3.5 text-center">অর্ডার সংখ্যা</th>
                <th className="px-5 py-3.5 text-right">মোট ক্রয়মূল্য</th>
                <th className="px-5 py-3.5 text-center">উইশলিস্ট</th>
                <th className="px-5 py-3.5 text-center">স্ট্যাটাস</th>
                <th className="px-5 py-3.5 text-right">পদক্ষেপ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleUsers.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className="group transition-colors hover:bg-slate-50/80 cursor-pointer"
                >
                  {/* User name & avatar */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-200"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-dark">
                            {user.name.charAt(0)}
                          </div>
                        )}
                        <span
                          className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-white ${
                            user.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900 group-hover:text-primary-hover transition-colors">
                          {user.name}
                        </p>
                        <span className="inline-block rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-medium text-slate-600">
                          {user.role === 'admin'
                            ? 'অ্যাডমিন'
                            : user.role === 'author'
                            ? 'লেখক'
                            : 'গ্রাহক'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Email & Phone */}
                  <td className="px-5 py-3.5">
                    <p className="truncate text-xs font-medium text-slate-700">
                      {user.email}
                    </p>
                    <p className="truncate text-xs text-slate-500 font-mono">
                      {user.phone}
                    </p>
                  </td>

                  {/* Delivery Rate */}
                  <td className="whitespace-nowrap px-5 py-3.5 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          user.deliveryRate >= 90
                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60'
                            : user.deliveryRate >= 80
                            ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60'
                            : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/60'
                        }`}
                      >
                        {toBnNum(user.deliveryRate)}%
                      </span>
                      <div className="mt-1 h-1 w-14 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full ${
                            user.deliveryRate >= 90
                              ? 'bg-emerald-500'
                              : user.deliveryRate >= 80
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${user.deliveryRate}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Total Orders */}
                  <td className="whitespace-nowrap px-5 py-3.5 text-center">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50/70 px-2.5 py-1 text-xs font-bold text-blue-700">
                      <FiShoppingBag className="text-[11px]" />
                      <span>{toBnNum(user.orderCount)} বার</span>
                    </span>
                  </td>

                  {/* Total Spent */}
                  <td className="whitespace-nowrap px-5 py-3.5 text-right">
                    <p className="font-heading text-sm font-bold text-slate-900">
                      {formatCurrency(user.totalSpent)}
                    </p>
                  </td>

                  {/* Wishlist count */}
                  <td className="whitespace-nowrap px-5 py-3.5 text-center">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600">
                      <FiHeart className="text-rose-500 fill-rose-500/20" />
                      <span>{toBnNum(user.wishlistCount)} টি</span>
                    </span>
                  </td>

                  {/* Status */}
                  <td className="whitespace-nowrap px-5 py-3.5 text-center">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        user.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          user.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                      {user.status === 'active' ? 'সক্রিয়' : 'স্থগিত'}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="whitespace-nowrap px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectUser(user);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-primary hover:text-dark"
                    >
                      <FiEye className="text-xs" />
                      <span>বিস্তারিত</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {visibleUsers.length === 0 && (
            <div className="py-14 text-center">
              <FiUsers className="mx-auto text-4xl text-slate-300" />
              <p className="mt-2 text-sm font-semibold text-slate-700">কোনো ইউজার পাওয়া যায়নি</p>
              <p className="text-xs text-slate-400">অন্য কোনো নাম বা নাম্বার দিয়ে সার্চ করুন।</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 p-4 text-xs font-medium text-slate-500 sm:px-5">
          <span>
            সর্বমোট {toBnNum(totalUsersCount)} জনের মধ্যে {toBnNum(visibleUsers.length)} জন প্রদর্শিত হচ্ছে
          </span>
          <span className="text-[11px] text-slate-400">
            যে কোনো ইউজারের উপর ক্লিক করে তার সম্পূর্ণ প্রোফাইল ও অর্ডার বিবরণ দেখুন
          </span>
        </div>
      </section>
    </div>
  );
}

export default UsersManagement;
