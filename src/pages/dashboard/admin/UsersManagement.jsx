import { useState, useMemo } from 'react';
import {
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiCopy,
  FiExternalLink,
  FiEye,
  FiHeart,
  FiMail,
  FiMapPin,
  FiPackage,
  FiPhone,
  FiPhoneCall,
  FiPlus,
  FiPrinter,
  FiSearch,
  FiShoppingBag,
  FiShoppingCart,
  FiTrendingUp,
  FiTruck,
  FiUsers,
  FiX,
  FiXCircle,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import FollowUpModal from '../../../components/dashboard/FollowUpModal';
import PageHeader from '../../../components/dashboard/PageHeader';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import { useAuth } from '../../../context/useAuth';
import { useData } from '../../../context/useData';
import {
  assignDailyFollowUpBatch,
  assignUserFollowUp,
  getFollowUpAssignments,
  getFollowUpLogs,
  getFollowUpSettings,
  getTodayFollowUpStats,
  saveFollowUpSettings,
} from '../../../utils/followUpStorage';

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

const toEnDigits = (value) => {
  const bnDigits = '০১২৩৪৫৬৭৮৯';
  return String(value ?? '').replace(/[০-৯]/g, (d) =>
    String(bnDigits.indexOf(d))
  );
};

const formatCurrency = (value) => {
  const num = Number(value || 0);
  return `৳${num.toLocaleString('en-US', {
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (isoString) => {
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

const getRoleLabel = (role) => {
  if (role === 'admin') return 'Admin';
  if (role === 'author') return 'Author';
  if (role === 'moderator') return 'Moderator';
  if (role === 'employee') return 'Employee';
  return 'Customer';
};

const toUserRouteParam = (name = '') =>
  encodeURIComponent(String(name).trim().replace(/\s+/g, '-'));

function readWishlistIds(userId) {
  try {
    const stored = localStorage.getItem(`hosonta_wishlist_${userId}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

const DEFAULT_CART_SEEDS = {
  'user-reader-1': [
    { bookId: 2, quantity: 1 },
    { bookId: 5, quantity: 2 },
  ],
  'user-reader-2': [
    { bookId: 3, quantity: 1 },
    { bookId: 6, quantity: 1 },
  ],
  'user-reader-3': [{ bookId: 1, quantity: 1 }],
  'user-reader-4': [
    { bookId: 4, quantity: 1 },
    { bookId: 7, quantity: 1 },
  ],
  'user-reader-5': [{ bookId: 8, quantity: 2 }],
  'user-reader-7': [{ bookId: 3, quantity: 1 }],
};

function readCartItems(user) {
  try {
    const stored = localStorage.getItem(`hosonta_cart_${user.id}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore invalid cart json
  }
  return user.cart || DEFAULT_CART_SEEDS[user.id] || [];
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
    title: item.title || matchedBook?.title || 'Book Title',
    author: item.author || matchedBook?.author || 'Author',
    category: item.category || matchedBook?.category || 'Literature',
    price: Number(item.price ?? matchedBook?.price ?? 0),
    quantity: Number(item.quantity ?? item.qty ?? 1),
  };
}

// Generates courier details and status
function getCourierInfo(order) {
  const isCounter = order.orderType === 'counter';
  const courierName =
    order.courier ||
    (isCounter ? 'Counter Delivery / Showroom' : 'Steadfast Courier');

  const consignmentId =
    order.consignmentId ||
    order.trackingCode ||
    (isCounter
      ? `CNT-${order.id.slice(-6)}`
      : `STD-${order.id.replace(/[^\d]/g, '').slice(-8) || '84930215'}`);

  let courierStatusText = 'Processing';
  let badgeColor = 'bg-amber-50 text-amber-700 ring-amber-200/60';

  if (order.status === 'delivered') {
    courierStatusText = 'Delivered';
    badgeColor = 'bg-emerald-50 text-emerald-700 ring-emerald-200/60';
  } else if (order.status === 'shipped') {
    courierStatusText = 'In Transit - Out for Delivery';
    badgeColor = 'bg-blue-50 text-blue-700 ring-blue-200/60';
  } else if (order.status === 'processing') {
    courierStatusText = 'Parcel Packed & Booked';
    badgeColor = 'bg-indigo-50 text-indigo-700 ring-indigo-200/60';
  } else if (order.status === 'cancelled') {
    courierStatusText = 'Cancelled / Returned';
    badgeColor = 'bg-rose-50 text-rose-700 ring-rose-200/60';
  } else {
    courierStatusText = 'Pending Pickup';
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

  const handleCopy = (text, label = 'ID') => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success(`${label} copied!`);
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
              Order Details & Invoice
            </span>
            <span className="font-mono text-xs font-semibold text-primary-hover bg-primary/10 px-2 py-0.5 rounded">
              {order.id}
            </span>
            <button
              type="button"
              onClick={() => handleCopy(order.id, 'Order ID')}
              title="Copy"
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
                Order & Courier Info
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
                Invoice / Cash Memo
              </button>
            </div>

            {/* Print button */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-dark transition hover:bg-primary-hover shadow-xs"
            >
              <FiPrinter className="text-sm" />
              <span className="hidden sm:inline">Print Invoice</span>
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
                        Courier & Delivery Partner
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
                    Consignment / Tracking Number
                  </p>
                  <div className="mt-0.5 flex items-center gap-1.5 sm:justify-end">
                    <span className="font-mono text-sm font-bold text-slate-800">
                      {courier.consignmentId}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(courier.consignmentId, 'Tracking Code')
                      }
                      title="Copy"
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
                    <p className="text-xs font-bold text-slate-900">Order Placed</p>
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
                    <p className="text-xs font-bold text-slate-900">Packaging Complete</p>
                    <p className="text-[10px] text-slate-500">Stock Allocated</p>
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
                    <p className="text-xs font-bold text-slate-900">Handed to Courier</p>
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
                        ? 'Delivered'
                        : order.status === 'cancelled'
                        ? 'Order Cancelled'
                        : 'Pending Delivery'}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {order.status === 'delivered' ? 'Received by customer' : 'In progress'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Books Ordered List Section */}
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <h4 className="font-heading text-sm sm:text-base font-bold text-slate-900">
                  Ordered Books ({totalItemCount} {totalItemCount === 1 ? 'Book' : 'Books'})
                </h4>
                <span className="text-xs font-medium text-slate-500">
                  Total Items: {items.length}
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
                          Author: {item.author}
                        </p>
                        <span className="inline-block mt-0.5 rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-medium text-slate-600">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-5 shrink-0 text-right">
                      <div>
                        <p className="text-xs text-slate-500">
                          Unit Price: {formatCurrency(item.price)}
                        </p>
                        <p className="text-xs font-semibold text-slate-800">
                          Qty: {item.quantity} {item.quantity === 1 ? 'copy' : 'copies'}
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
                  Customer & Delivery Details
                </h5>
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer Name:</span>
                  <span className="font-semibold text-slate-900">
                    {order.customerName || user?.name || 'Customer'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone Number:</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {toEnDigits(order.phone || user?.phone || '—')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Delivery Address:</span>
                  <span className="max-w-[200px] text-right font-medium text-slate-800">
                    {order.address || user?.address || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Order Date:</span>
                  <span className="font-medium text-slate-800">
                    {formatDate(order.date)}
                  </span>
                </div>
                {order.notes && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400 block">Special Note:</span>
                    <p className="text-xs font-medium text-slate-700 mt-0.5">
                      {order.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Payment & Total Amount Calculation */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 text-xs sm:text-sm">
                <h5 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
                  Payment & Summary
                </h5>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Method:</span>
                  <span className="font-semibold uppercase text-slate-800">
                    {order.paymentMethod || 'Cash on Delivery (COD)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Status:</span>
                  <span
                    className={`font-semibold rounded-full px-2 py-0.2 text-xs ${
                      order.paymentStatus === 'paid' || order.paymentStatus === 'verified'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {order.paymentStatus === 'paid' || order.paymentStatus === 'verified'
                      ? 'Paid'
                      : 'Due / COD'}
                  </span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Items Subtotal:</span>
                  <span className="font-medium text-slate-800">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Delivery Charge:</span>
                  <span className="font-medium text-slate-800">
                    {formatCurrency(deliveryCharge)}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span>- {formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-2 text-sm sm:text-base font-bold text-slate-900">
                  <span>Grand Total:</span>
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
                    {COMPANY.address}
                    <br />
                    Hotline: {COMPANY.hotline} | {COMPANY.email}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="inline-block rounded-md bg-dark px-3 py-1 font-heading text-sm font-bold uppercase tracking-widest text-white">
                    INVOICE / CASH MEMO
                  </span>
                  <p className="mt-2 text-xs text-slate-500">
                    Invoice No: <strong className="text-slate-900 font-mono">{order.id}</strong>
                  </p>
                  <p className="text-xs text-slate-500">
                    Date: <strong className="text-slate-900">{formatDate(order.date)}</strong>
                  </p>
                  <p className="text-xs text-slate-500">
                    Courier:{' '}
                    <strong className="text-slate-900">{courier.courierName}</strong>
                  </p>
                </div>
              </div>

              {/* Billed To / Shipping Address */}
              <div className="grid grid-cols-2 gap-4 py-5 border-b border-slate-200 text-xs sm:text-sm">
                <div>
                  <p className="font-heading text-xs font-bold uppercase tracking-wider text-slate-400">
                    Billed To / Recipient
                  </p>
                  <p className="mt-1 font-bold text-slate-900 text-sm">
                    {order.customerName || user?.name || 'Customer'}
                  </p>
                  <p className="text-slate-600 font-mono mt-0.5">
                    Phone: {toEnDigits(order.phone || user?.phone || '—')}
                  </p>
                  <p className="text-slate-600 mt-0.5">
                    Email: {user?.email || '—'}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-heading text-xs font-bold uppercase tracking-wider text-slate-400">
                    Delivery Address & Courier
                  </p>
                  <p className="mt-1 font-medium text-slate-800">
                    {order.address || user?.address || '—'}
                  </p>
                  <p className="text-slate-600 font-mono text-xs mt-0.5">
                    Tracking ID: <strong>{courier.consignmentId}</strong>
                  </p>
                  <p className="text-slate-600 text-xs mt-0.5">
                    Payment:{' '}
                    <strong className="uppercase">
                      {order.paymentMethod || 'Cash on Delivery'}
                    </strong>
                  </p>
                </div>
              </div>

              {/* Invoice Items Table */}
              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-300 bg-slate-50 text-xs font-bold text-slate-700">
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3">Book Title & Author</th>
                      <th className="py-2.5 px-3 w-20 text-center">Qty</th>
                      <th className="py-2.5 px-3 w-24 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 w-28 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td className="py-3 px-3 text-center text-slate-500 font-mono">
                          {index + 1}
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-900">{item.title}</p>
                          <p className="text-xs text-slate-500">Author: {item.author}</p>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-800 font-mono">
                          {item.quantity}
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
                  <p className="font-bold text-slate-700">Terms & Conditions:</p>
                  <p className="mt-1 leading-relaxed">
                    1. Books with printing or binding defects can be exchanged within 7 days.
                    <br />
                    2. This is a computer-generated invoice and requires no signature.
                  </p>
                </div>

                <div className="w-full sm:w-64 space-y-1.5 text-xs sm:text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Delivery Fee:</span>
                    <span className="font-medium">{formatCurrency(deliveryCharge)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Discount:</span>
                      <span>- {formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t-2 border-slate-900 pt-2 text-base font-bold text-slate-900">
                    <span>Grand Total:</span>
                    <span className="font-heading">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Invoice Footer / Signatures */}
              <div className="mt-12 flex items-center justify-between border-t border-dashed border-slate-200 pt-6 text-xs text-slate-400">
                <p>Thank you for choosing Hosonta Prokashon.</p>
                <div className="text-right">
                  <p className="font-heading font-semibold text-slate-700">Authorized Signature</p>
                  <p className="text-[10px]">Hosonta Prokashon Authority</p>
                </div>
              </div>
            </article>
          </div>
        )}

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-6 print:hidden">
          <p className="text-xs text-slate-500">
            Order Status:{' '}
            <strong className="text-slate-800">{courier.courierStatusText}</strong>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-dark px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
            >
              <FiPrinter />
              <span>Print / Download Invoice</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Close
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

export function UserDetailsView({
  user,
  onBack,
  allOrders,
  allBooks,
  staffUsers = [],
  currentUser,
  onRefresh,
}) {
  const [activeTab, setActiveTab] = useState('orders');
  const [selectedOrderForModal, setSelectedOrderForModal] = useState(null);
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);

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

  // Add to Cart books (with quantity)
  const userCartBooks = useMemo(() => {
    const items = user.cartItems || [];
    return items
      .map((item) => {
        const matched = allBooks.find((b) => String(b.id) === String(item.bookId));
        if (!matched) return null;
        return {
          ...matched,
          cartQuantity: Number(item.quantity || 1),
        };
      })
      .filter(Boolean);
  }, [allBooks, user]);

  const retargetHint = useMemo(() => {
    const titles = [
      ...userCartBooks.map((b) => b.title),
      ...userWishlistBooks.map((b) => b.title),
    ];
    return Array.from(new Set(titles)).slice(0, 3).join(', ');
  }, [userCartBooks, userWishlistBooks]);

  const userFollowUpLogs = user.followUpLogs || [];
  const assignment = user.followUpAssignment || null;

  return (
    <div className="space-y-6">
      {/* Top back button & User Name */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <FiArrowLeft className="text-base" />
          <span>Back to Users</span>
        </button>

        <div className="flex items-center justify-center gap-2">
          <span className="text-xs text-slate-500">User Name:</span>
          <span className="rounded bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
            {user.name}
          </span>
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
                title={user.status === 'active' ? 'Active' : 'Suspended'}
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
                  {user.status === 'active' ? 'Active Account' : 'Suspended'}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  {getRoleLabel(user.role)}
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
                      {toEnDigits(user.phone)}
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

          {/* Quick contact & follow-up actions */}
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 md:border-0 md:pt-0">
            <button
              type="button"
              onClick={() => setFollowUpModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-dark transition hover:bg-primary-hover"
            >
              <FiPhoneCall /> Follow Up
            </button>
            {user.phone && (
              <a
                href={`tel:${user.phone}`}
                title="Call"
                aria-label="Call"
                className="p-2 text-slate-600 hover:text-dark transition"
              >
                <FiPhone size={16} />
              </a>
            )}
            {user.phone && (
              <a
                href={`https://wa.me/${toEnDigits(user.phone).replace(/[^\d]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                title="WhatsApp"
                aria-label="WhatsApp"
                className="p-2 text-emerald-600 hover:text-emerald-800 transition"
              >
                <FaWhatsapp size={17} />
              </a>
            )}
            <a
              href={`mailto:${user.email}`}
              title="Send Email"
              aria-label="Send Email"
              className="p-2 text-slate-600 hover:text-dark transition"
            >
              <FiMail size={16} />
            </a>
          </div>
        </div>
      </div>

      {/* 4 Key Statistics Cards */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Orders</span>
            <FiShoppingBag className="text-base text-blue-600" />
          </div>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {user.orderCount}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Delivered: {user.deliveredCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Spent</span>
            <FiTrendingUp className="text-base text-emerald-600" />
          </div>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {formatCurrency(user.totalSpent)}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Delivery: {user.deliveryRate}%</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Add to Cart</span>
            <FiShoppingCart className="text-base text-amber-600" />
          </div>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {userCartBooks.length}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Books ready to retarget</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Wishlist Saved</span>
            <FiHeart className="text-base text-rose-600" />
          </div>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {userWishlistBooks.length}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Follow-ups: {userFollowUpLogs.length}</p>
        </div>
      </div>

      {/* Tabs: Orders / Cart / Wishlist / Follow-Up History / Contact Info */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex overflow-x-auto border-b border-slate-200 bg-white px-4 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-xs sm:text-sm font-semibold transition ${
              activeTab === 'orders'
                ? 'border-primary text-dark font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Order History ({userOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cart')}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-xs sm:text-sm font-semibold transition ${
              activeTab === 'cart'
                ? 'border-primary text-dark font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Cart Books ({userCartBooks.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('wishlist')}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-xs sm:text-sm font-semibold transition ${
              activeTab === 'wishlist'
                ? 'border-primary text-dark font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Wishlist Books ({userWishlistBooks.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('followup')}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-xs sm:text-sm font-semibold transition ${
              activeTab === 'followup'
                ? 'border-primary text-dark font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Follow-Up History ({userFollowUpLogs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-xs sm:text-sm font-semibold transition ${
              activeTab === 'info'
                ? 'border-primary text-dark font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Address & Details
          </button>
        </div>

        {/* Tab 1: Orders Tab */}
        {activeTab === 'orders' && (
          <div className="p-4 sm:p-5">
            {userOrders.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <FiPackage className="mx-auto text-4xl text-slate-300" />
                <p className="mt-2 text-sm font-medium">No orders found for this user.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500">
                      <th className="pb-3 pr-4">Order ID</th>
                      <th className="pb-3 pr-4">Date</th>
                      <th className="pb-3 pr-4">Courier & Tracking</th>
                      <th className="pb-3 pr-4">Items</th>
                      <th className="pb-3 pr-4 text-right">Total</th>
                      <th className="pb-3 pr-4 text-center">Payment</th>
                      <th className="pb-3 pr-4 text-center">Status</th>
                      <th className="pb-3 text-right">Action</th>
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
                              {(order.items || []).map((i) => i.title).join(', ') || 'Book Order'}
                            </p>
                            <span className="text-[11px] text-slate-400">
                              {itemCount} {itemCount === 1 ? 'Book' : 'Books'}
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
                              <span>View Invoice</span>
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

        {/* Tab 1.5: Add to Cart Books (Same Card Design as Wishlist Books) */}
        {activeTab === 'cart' && (
          <div className="p-4 sm:p-5">
            {userCartBooks.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <FiShoppingCart className="mx-auto text-4xl text-slate-300" />
                <p className="mt-2 text-sm font-medium">No books currently in cart.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {userCartBooks.map((book) => (
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
                      <div className="mt-auto flex items-center justify-between pt-1">
                        <span className="font-heading text-xs font-bold text-slate-900">
                          {formatCurrency(book.price)}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          Qty: {book.cartQuantity}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
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
                <p className="mt-2 text-sm font-medium">No books saved in wishlist.</p>
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

        {/* Tab 2.5: Follow-Up & Retargeting Call History */}
        {activeTab === 'followup' && (
          <div className="space-y-4 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="text-slate-500">
                  Assigned To:{' '}
                  <strong className="text-slate-900">
                    {assignment?.assignedToName || 'Unassigned'}
                  </strong>
                </span>
                {assignment?.status && (
                  <span className="font-semibold text-emerald-700">
                    Status: {assignment.status}
                  </span>
                )}
                {staffUsers.length > 0 && currentUser?.role === 'admin' && (
                  <select
                    value={assignment?.assignedToId || ''}
                    onChange={(e) => {
                      const targetStaff = staffUsers.find((s) => s.id === e.target.value);
                      if (!targetStaff) return;
                      assignUserFollowUp({
                        userId: user.id,
                        assignedToId: targetStaff.id,
                        assignedToName: targetStaff.name,
                        assignedToRole: targetStaff.role,
                      });
                      toast.success(`Assigned ${user.name} to ${targetStaff.name}.`);
                      onRefresh?.();
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 outline-none focus:border-primary"
                  >
                    <option value="">Assign Moderator / Staff...</option>
                    {staffUsers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.role})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <button
                type="button"
                onClick={() => setFollowUpModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-dark hover:bg-primary-hover"
              >
                <FiPlus size={13} />
                <span>Log Call / Note</span>
              </button>
            </div>

            {userFollowUpLogs.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                No follow-up calls recorded yet. Click &ldquo;Log Call / Note&rdquo; to add the first update.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {userFollowUpLogs.map((log) => (
                  <div key={log.id} className="space-y-1.5 py-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-slate-700">
                          {log.id}
                        </span>
                        <span className="font-semibold text-emerald-700">
                          {log.outcome}
                        </span>
                        <span className="text-slate-500">via {log.channel}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {formatDate(log.createdAt)} ·{' '}
                        <strong className="text-slate-700">{log.followedByName}</strong> (
                        {log.followedByRole})
                      </span>
                    </div>
                    {log.retargetBooks && (
                      <p className="text-[11px] font-semibold text-slate-700">
                        Books: {log.retargetBooks}
                      </p>
                    )}
                    <p className="text-slate-600">{log.note}</p>
                    {log.nextFollowUpDate && (
                      <p className="text-[11px] text-amber-700">
                        Next Follow-Up: {formatDate(log.nextFollowUpDate)}
                      </p>
                    )}
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
                  Contact & Delivery Address
                </h4>
                <div className="mt-3 space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Full Name:</span>
                    <span className="font-medium text-slate-900">{user.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email:</span>
                    <span className="font-medium text-slate-900">{user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phone Number:</span>
                    <span className="font-medium text-slate-900">
                      {user.phone ? toEnDigits(user.phone) : 'Not provided'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">City / District:</span>
                    <span className="font-medium text-slate-900">{user.city || 'Dhaka'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Full Address:</span>
                    <span className="max-w-xs text-right font-medium text-slate-900">
                      {user.address || 'Not available'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-500">
                  Account & Membership Details
                </h4>
                <div className="mt-3 space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account Role:</span>
                    <span className="font-semibold text-slate-800">
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account Status:</span>
                    <span
                      className={`font-semibold ${
                        user.status === 'active' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {user.status === 'active' ? 'Active' : 'Suspended'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Joined Date:</span>
                    <span className="font-medium text-slate-900">
                      {formatDate(user.joinedDate || '2024-05-15')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Delivery Success Ratio:</span>
                    <span className="font-medium text-slate-900">
                      {user.deliveredCount} / {user.orderCount} parcels delivered
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

      {/* Log Follow-Up / Retargeting Modal */}
      <FollowUpModal
        isOpen={followUpModalOpen}
        user={user}
        retargetBooksHint={retargetHint}
        currentUser={currentUser}
        onClose={() => setFollowUpModalOpen(false)}
        onSaved={() => onRefresh?.()}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Users List View (Table & Metrics)                                  */
/* ------------------------------------------------------------------ */

function UsersManagement() {
  const { currentUser, users: authUsers = [] } = useAuth();
  const { orders = [], books = [] } = useData();
  const { userName: routeUserName, id: routeUserId } = useParams();
  const navigate = useNavigate();

  const [refreshTick, setRefreshTick] = useState(0);
  const triggerRefresh = () => setRefreshTick((t) => t + 1);

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('orders');

  // Follow-up assignment modal & quick call modal
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [quickFollowUpUser, setQuickFollowUpUser] = useState(null);

  const staffUsers = useMemo(
    () =>
      authUsers.filter((u) =>
        ['moderator', 'employee', 'admin'].includes(u.role)
      ),
    [authUsers]
  );

  const moderatorUsers = useMemo(
    () => authUsers.filter((u) => u.role === 'moderator' || u.role === 'admin'),
    [authUsers]
  );

  const [followUpSettings, setFollowUpSettings] = useState(getFollowUpSettings);
  const [planForm, setPlanForm] = useState(() => ({
    dailyTarget: String(getFollowUpSettings().dailyTarget || 10),
    assignedModeratorId:
      getFollowUpSettings().assignedModeratorId ||
      moderatorUsers[0]?.id ||
      'user-moderator-1',
  }));

  // Compute metrics for each user
  const processedUsers = useMemo(() => {
    void refreshTick;
    const assignments = getFollowUpAssignments();
    const allLogs = getFollowUpLogs();

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

      // Cart items
      const cartItems = readCartItems(user);
      const cartCount = cartItems.reduce((sum, item) => sum + Number(item.quantity || 1), 0);

      // Follow-up assignment & logs
      const followUpAssignment = assignments[user.id] || null;
      const followUpLogs = allLogs.filter((l) => String(l.userId) === String(user.id));

      return {
        ...user,
        phone: toEnDigits(user.phone || '01712-345678'),
        orderCount,
        totalSpent,
        deliveredCount,
        deliveryRate,
        wishlistIds,
        wishlistCount,
        cartItems,
        cartCount,
        followUpAssignment,
        followUpLogs,
      };
    });
  }, [authUsers, orders, refreshTick]);

  const todayStats = useMemo(() => {
    void refreshTick;
    return getTodayFollowUpStats(followUpSettings.assignedModeratorId);
  }, [followUpSettings.assignedModeratorId, refreshTick]);

  // Active view: match by route user name (with fallback to selectedUserId or legacy ID)
  const activeUser = useMemo(() => {
    const rawParam = routeUserName ?? routeUserId;
    if (!rawParam) {
      return selectedUserId
        ? processedUsers.find((u) => u.id === selectedUserId) || null
        : null;
    }

    const decodedParam = decodeURIComponent(rawParam).trim();
    const normalizedParam = decodedParam.toLowerCase();

    if (selectedUserId) {
      const selectedMatch = processedUsers.find(
        (u) =>
          u.id === selectedUserId &&
          (u.name.trim().toLowerCase() === normalizedParam ||
            u.name.trim().replace(/\s+/g, '-').toLowerCase() === normalizedParam)
      );
      if (selectedMatch) return selectedMatch;
    }

    return (
      processedUsers.find(
        (u) =>
          u.name.trim().toLowerCase() === normalizedParam ||
          u.name.trim().replace(/\s+/g, '-').toLowerCase() === normalizedParam ||
          u.id === decodedParam
      ) || null
    );
  }, [routeUserName, routeUserId, selectedUserId, processedUsers]);

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
        return a.name.localeCompare(b.name);
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

  // Handle open user details using user's name in route
  const handleSelectUser = (user) => {
    setSelectedUserId(user.id);
    navigate(`/dashboard/all-users/users/${toUserRouteParam(user.name)}`);
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
        staffUsers={staffUsers}
        currentUser={currentUser}
        onRefresh={triggerRefresh}
      />
    );
  }

  const handleSaveFollowUpPlan = (e) => {
    e.preventDefault();
    const targetMod =
      staffUsers.find((u) => u.id === planForm.assignedModeratorId) || staffUsers[0];
    const targetCount = Math.max(1, Number(planForm.dailyTarget) || 10);
    if (!targetMod) {
      toast.error('Please select a moderator.');
      return;
    }
    const nextSettings = saveFollowUpSettings({
      dailyTarget: targetCount,
      assignedModeratorId: targetMod.id,
      assignedModeratorName: targetMod.name,
    });
    const assignedCount = assignDailyFollowUpBatch({
      users: processedUsers,
      assignedToId: targetMod.id,
      assignedToName: targetMod.name,
      assignedToRole: targetMod.role,
      dailyTarget: targetCount,
    });
    setFollowUpSettings(nextSettings);
    setPlanModalOpen(false);
    triggerRefresh();
    toast.success(
      `Assigned ${assignedCount} users (Target: ${targetCount}/day) to ${targetMod.name}.`
    );
  };

  const quickHintBooks = quickFollowUpUser
    ? Array.from(
        new Set(
          [
            ...(quickFollowUpUser.cartItems || []).map((c) => {
              const found = books.find((b) => String(b.id) === String(c.bookId));
              return found?.title;
            }),
            ...(quickFollowUpUser.wishlistIds || []).map((id) => {
              const found = books.find((b) => String(b.id) === String(id));
              return found?.title;
            }),
          ].filter(Boolean)
        )
      )
        .slice(0, 3)
        .join(', ')
    : '';

  return (
    <div className="space-y-5">
      <PageHeader
        title="Users Management"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500">
              Daily Plan: <strong className="text-slate-900">{todayStats.uniqueUsersToday}/{followUpSettings.dailyTarget}</strong> · {followUpSettings.assignedModeratorName}
            </span>
            <button
              type="button"
              onClick={() => {
                setPlanForm({
                  dailyTarget: String(followUpSettings.dailyTarget || 10),
                  assignedModeratorId:
                    followUpSettings.assignedModeratorId || moderatorUsers[0]?.id || '',
                });
                setPlanModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-dark hover:bg-primary-hover"
            >
              <FiPhoneCall size={14} />
              <span>Follow-Up Plan</span>
            </button>
          </div>
        }
      />

      {/* 4 Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Users</span>
            <FiUsers className="text-base text-blue-600" />
          </div>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {totalUsersCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Orders</span>
            <FiPackage className="text-base text-amber-600" />
          </div>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {totalOrdersCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Sales</span>
            <FiTrendingUp className="text-base text-emerald-600" />
          </div>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {formatCurrency(totalSpentAll)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Delivery Rate</span>
            <FiTruck className="text-base text-indigo-600" />
          </div>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {avgDeliveryRate}%
          </p>
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
              placeholder="Search by name, email or phone..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-primary focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status & Role filters */}
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
              {[
                ['all', 'All Users'],
                ['user', 'Customers'],
                ['author', 'Authors'],
                ['active', 'Active'],
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
              <option value="orders">Orders (High to Low)</option>
              <option value="spent">Total Spent (High to Low)</option>
              <option value="deliveryRate">Delivery Rate (High to Low)</option>
              <option value="wishlist">Wishlist (High to Low)</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead>
              <tr className="whitespace-nowrap border-b border-slate-200 bg-white text-xs font-semibold text-slate-500">
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Contact</th>
                <th className="px-5 py-3.5 text-center">Delivery Rate</th>
                <th className="px-5 py-3.5 text-center">Orders</th>
                <th className="px-5 py-3.5 text-right">Total Spent</th>
                <th className="px-5 py-3.5 text-center">Cart / Wish</th>
                <th className="px-5 py-3.5">Follow-Up</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
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
                          {getRoleLabel(user.role)}
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
                        {user.deliveryRate}%
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
                      <span>{user.orderCount} {user.orderCount === 1 ? 'order' : 'orders'}</span>
                    </span>
                  </td>

                  {/* Total Spent */}
                  <td className="whitespace-nowrap px-5 py-3.5 text-right">
                    <p className="font-heading text-sm font-bold text-slate-900">
                      {formatCurrency(user.totalSpent)}
                    </p>
                  </td>

                  {/* Cart & Wishlist count */}
                  <td className="whitespace-nowrap px-5 py-3.5 text-center">
                    <div className="inline-flex items-center gap-3 text-xs font-semibold">
                      <span className="inline-flex items-center gap-1 text-amber-700" title="Cart Books">
                        <FiShoppingCart size={13} />
                        <span>{user.cartCount}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-rose-600" title="Wishlist Books">
                        <FiHeart size={13} />
                        <span>{user.wishlistCount}</span>
                      </span>
                    </div>
                  </td>

                  {/* Assigned Moderator & Follow-Up Status */}
                  <td className="whitespace-nowrap px-5 py-3.5 text-xs">
                    {user.followUpAssignment ? (
                      <div>
                        <p className="font-semibold text-slate-800">
                          {user.followUpAssignment.assignedToName}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {user.followUpAssignment.status}
                        </p>
                      </div>
                    ) : (
                      <span className="text-slate-400">Unassigned</span>
                    )}
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
                      {user.status === 'active' ? 'Active' : 'Suspended'}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="whitespace-nowrap px-5 py-3.5 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuickFollowUpUser(user);
                        }}
                        title="Follow Up / Log Call"
                        aria-label="Follow Up / Log Call"
                        className="p-1 text-emerald-600 hover:text-emerald-800 transition"
                      >
                        <FiPhoneCall size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectUser(user);
                        }}
                        title="View User Profile"
                        aria-label="View User Profile"
                        className="p-1 text-slate-500 hover:text-dark transition"
                      >
                        <FiEye size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {visibleUsers.length === 0 && (
            <div className="py-14 text-center">
              <FiUsers className="mx-auto text-4xl text-slate-300" />
              <p className="mt-2 text-sm font-semibold text-slate-700">No users found</p>
              <p className="text-xs text-slate-400">Try searching with another name or phone number.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 p-4 text-xs font-medium text-slate-500 sm:px-5">
          <span>
            Showing {visibleUsers.length} of {totalUsersCount} users
          </span>
          <span className="text-[11px] text-slate-400">
            Click any user row to view their full profile and order details
          </span>
        </div>
      </section>

      {/* Daily Follow-Up Plan & Moderator Assignment Modal */}
      {planModalOpen && (
        <div
          onClick={() => setPlanModalOpen(false)}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl bg-white p-5 sm:p-6 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Daily Follow-Up Settings
              </h3>
              <button
                type="button"
                onClick={() => setPlanModalOpen(false)}
                aria-label="Close"
                className="p-1 text-slate-400 hover:text-dark"
              >
                <FiX size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveFollowUpPlan} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  Assign Moderator / Staff *
                </label>
                <select
                  required
                  value={planForm.assignedModeratorId}
                  onChange={(e) =>
                    setPlanForm((p) => ({ ...p, assignedModeratorId: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary"
                >
                  {staffUsers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  Daily Follow-Up Target (Users per day) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  required
                  value={planForm.dailyTarget}
                  onChange={(e) =>
                    setPlanForm((p) => ({ ...p, dailyTarget: e.target.value }))
                  }
                  placeholder="e.g. 10"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Prioritizes users with Cart and Wishlist books for retargeting.
                </p>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setPlanModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-2 font-bold text-dark hover:bg-primary-hover"
                >
                  Save & Assign Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Follow-Up Modal from Table */}
      <FollowUpModal
        isOpen={Boolean(quickFollowUpUser)}
        user={quickFollowUpUser}
        retargetBooksHint={quickHintBooks}
        currentUser={currentUser}
        onClose={() => setQuickFollowUpUser(null)}
        onSaved={() => {
          toast.success('Follow-up note saved.');
          triggerRefresh();
        }}
      />
    </div>
  );
}

export default UsersManagement;
