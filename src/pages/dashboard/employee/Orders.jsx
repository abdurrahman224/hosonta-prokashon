import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  FiAlertTriangle,
  FiBookmark,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiDollarSign,
  FiDownload,
  FiEye,
  FiInbox,
  FiPackage,
  FiPrinter,
  FiRotateCcw,
  FiSearch,
  FiSend,
  FiShoppingBag,
  FiSliders,
  FiTag,
  FiTruck,
  FiX,
  FiXCircle,
} from 'react-icons/fi';
import Pagination from '../../../components/common/Pagination';
import PageHeader from '../../../components/dashboard/PageHeader';
import { useAuth } from '../../../context/useAuth';
import { useData } from '../../../context/useData';
import { formatCurrency, toEnglishDigits } from '../../../utils/format';
import { ROLES } from '../../../utils/roles';

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

/* Printed on invoices, shipping labels and reports. Change if needed. */
const PUBLISHER_NAME = 'Hoshonto Publication';

const STAFF_ROLES = [ROLES.ADMIN, ROLES.MODERATOR, ROLES.EMPLOYEE];
const STORE_KEY = 'orderFulfillmentStore';
const PAGE_SIZES = [10, 20, 50, 100];

const TONES = {
  slate: 'bg-slate-100 text-slate-600',
  indigo: 'bg-indigo-50 text-indigo-700',
  blue: 'bg-blue-50 text-blue-700',
  amber: 'bg-amber-50 text-amber-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  rose: 'bg-rose-50 text-rose-700',
  violet: 'bg-violet-50 text-violet-700',
  orange: 'bg-orange-50 text-orange-700',
};

const CHANNELS = [
  { value: 'website', label: 'Website' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'phone', label: 'Phone' },
  { value: 'counter', label: 'Counter' },
  { value: 'other', label: 'Other' },
];

const PAYMENT_METHODS = [
  { value: 'bkash', label: 'bKash', tone: 'rose' },
  { value: 'nagad', label: 'Nagad', tone: 'orange' },
  { value: 'cod', label: 'COD', tone: 'amber' },
  { value: 'bank', label: 'Bank', tone: 'blue' },
  { value: 'cash', label: 'Cash', tone: 'emerald' },
];

const PAYMENT_STATUSES = [
  { value: 'unpaid', label: 'Unpaid', tone: 'rose' },
  { value: 'paid', label: 'Paid', tone: 'emerald' },
  { value: 'partial', label: 'Partially Paid', tone: 'amber' },
  { value: 'refunded', label: 'Refunded', tone: 'violet' },
  { value: 'partially_refunded', label: 'Partially Refunded', tone: 'orange' },
];

const ORDER_STATUSES = [
  { value: 'new', label: 'New', tone: 'indigo' },
  { value: 'approved', label: 'Approved', tone: 'blue' },
  { value: 'shipping', label: 'Shipping', tone: 'amber' },
  { value: 'delivered', label: 'Delivered', tone: 'emerald' },
  { value: 'cancelled', label: 'Cancelled', tone: 'slate' },
];

const DELIVERY_STATUSES = [
  { value: 'not_dispatched', label: 'Not Dispatched', tone: 'slate' },
  { value: 'ready_to_ship', label: 'Ready to Ship', tone: 'indigo' },
  { value: 'shipped', label: 'Shipped', tone: 'blue' },
  { value: 'in_transit', label: 'In Transit', tone: 'blue' },
  { value: 'out_for_delivery', label: 'Out for Delivery', tone: 'amber' },
  { value: 'delivered', label: 'Delivered', tone: 'emerald' },
  { value: 'delivery_failed', label: 'Delivery Failed', tone: 'rose' },
  { value: 'returned', label: 'Returned', tone: 'violet' },
];

const COURIERS = ['Pathao', 'Steadfast', 'RedX', 'Other (manual)'];

/* Valid status transitions. */
const ORDER_FLOW = {
  new: ['approved', 'cancelled'],
  approved: ['shipping', 'cancelled'],
  shipping: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

const DELIVERY_FLOW = {
  not_dispatched: ['ready_to_ship'],
  ready_to_ship: ['shipped'],
  shipped: ['in_transit', 'delivered', 'delivery_failed'],
  in_transit: ['out_for_delivery', 'delivered', 'delivery_failed'],
  out_for_delivery: ['delivered', 'delivery_failed'],
  delivery_failed: ['out_for_delivery', 'returned'],
  delivered: ['returned'],
  returned: [],
};

const ORDER_EVENT = {
  approved: 'Order approved',
  shipping: 'Handed over for shipping',
  delivered: 'Order delivered',
  cancelled: 'Order cancelled',
};

const DELIVERY_EVENT = {
  ready_to_ship: 'Ready to ship',
  shipped: 'Shipped',
  in_transit: 'In transit',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  delivery_failed: 'Delivery failed',
  returned: 'Returned',
};

const COLUMNS = [
  { id: 'id', label: 'Order ID', sort: 'id', show: true },
  { id: 'customer', label: 'Name', sort: 'customer', show: true },
  { id: 'phone', label: 'Phone', show: true },
  { id: 'items', label: 'Items', sort: 'items', show: true },
  {
    id: 'amount',
    label: 'Order Amount',
    sort: 'amount',
    align: 'center',
    show: true,
  },
  {
    id: 'charge',
    label: 'Delivery Charge',
    align: 'center',
    show: true,
  },
  {
    id: 'netProfit',
    label: 'Net Profit',
    sort: 'netProfit',
    align: 'center',
    show: true,
  },
  { id: 'payment', label: 'Payment', show: true },
  { id: 'orderStatus', label: 'Order Status', show: true },
  { id: 'date', label: 'Order Date', sort: 'date', show: true },
];

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

const labelOf = (list, value) =>
  list.find(item => item.value === value)?.label ?? value ?? '—';
const toneOf = (list, value) =>
  TONES[list.find(item => item.value === value)?.tone] ?? TONES.slate;

const toDay = value => {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? String(value || '').slice(0, 10)
    : d.toLocaleDateString('en-CA');
};
const todayLocal = () => new Date().toLocaleDateString('en-CA');
const shiftDay = (day, delta) => {
  const d = new Date(`${day}T12:00:00`);
  d.setDate(d.getDate() + delta);
  return d.toLocaleDateString('en-CA');
};
const fmtDate = value => {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? String(value || '—')
    : d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
};
const fmtDateTime = value => {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? String(value || '—')
    : d.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
};
const num = v => (Number.isFinite(Number(v)) ? Number(v) : 0);
const esc = v =>
  String(v ?? '').replace(
    /[&<>"']/g,
    c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ],
  );

const loadStore = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    return { meta: saved?.meta || {}, audit: saved?.audit || [] };
  } catch {
    return { meta: {}, audit: [] };
  }
};

const normalizeOrderStatus = raw => {
  if (raw === 'confirmed' || raw === 'processing') return 'approved';
  if (raw === 'shipped' || raw === 'in_transit' || raw === 'out_for_delivery')
    return 'shipping';
  if (raw === 'completed' || raw === 'delivered') return 'delivered';
  if (raw === 'cancelled') return 'cancelled';
  if (['new', 'approved', 'shipping', 'delivered', 'cancelled'].includes(raw))
    return raw;
  return 'new';
};

/* Combines the order from useData() with the extra fulfillment details kept locally. */
function buildRow(order, m = {}, books = []) {
  const ctx = String(order.status || 'new').toLowerCase();
  const isCounter = order.orderType === 'counter' || Boolean(order.shopName);
  const pay = String(order.paymentStatus || '').toLowerCase();
  const paymentMethod = String(order.paymentMethod || 'cod').toLowerCase();
  const items = order.items || [];

  const orderStatus = normalizeOrderStatus(
    ctx === 'cancelled'
      ? 'cancelled'
      : (m.orderStatus ??
        (ctx === 'delivered'
          ? 'delivered'
          : ctx === 'shipped'
            ? 'shipping'
            : ctx === 'processing'
              ? 'approved'
              : 'new')),
  );

  const deliveryStatus = isCounter
    ? null
    : ctx === 'delivered' && m.deliveryStatus !== 'returned'
      ? 'delivered'
      : (m.deliveryStatus ??
        (ctx === 'shipped' ? 'in_transit' : 'not_dispatched'));

  const paymentStatus =
    m.paymentStatus ??
    (['paid', 'verified'].includes(pay)
      ? 'paid'
      : pay === 'partial'
        ? 'partial'
        : pay === 'refunded'
          ? 'refunded'
          : 'unpaid');

  const subtotal = items.reduce(
    (s, i) => s + num(i.price) * num(i.quantity),
    0,
  );
  const included = num(order.deliveryCharge);
  const charge = num(m.deliveryCharge ?? order.deliveryCharge);
  const base = num(order.total);
  const payable = Math.max(0, base - included + charge);
  const discount = Math.max(0, subtotal - (base - included));
  const paid =
    m.paidAmount != null
      ? num(m.paidAmount)
      : ['paid', 'refunded', 'partially_refunded'].includes(paymentStatus)
        ? payable
        : paymentStatus === 'partial'
          ? num(order.amountPaid)
          : 0;
  const outstanding = ['unpaid', 'partial'].includes(paymentStatus)
    ? Math.max(0, payable - paid)
    : 0;
  const cod =
    order.paymentMethod === 'cod' && outstanding > 0 ? outstanding : 0;
  const refund =
    m.returnInfo?.status === 'approved' ? num(m.returnInfo.refund) : 0;
  const wholesaleCost = items.reduce((sum, item) => {
    const book = books.find(b => String(b.id) === String(item.bookId));
    const unitWholesale =
      book?.wholesalePrice != null
        ? num(book.wholesalePrice)
        : Math.round(num(item.price) * 0.7);
    return sum + unitWholesale * num(item.quantity);
  }, 0);
  const netProfit = Math.round(payable - charge - wholesaleCost);

  const addressParts = String(order.address || '')
    .split(',')
    .map(p => p.trim())
    .filter(Boolean);
  const district =
    m.district ??
    order.district ??
    (addressParts.length > 1 ? addressParts[addressParts.length - 1] : '');
  const channel = String(
    m.channel ?? order.channel ?? (isCounter ? 'counter' : 'website'),
  ).toLowerCase();

  const deliveredEvent = [...(m.timeline || [])]
    .reverse()
    .find(e => e.key === 'd:delivered');
  const day = toDay(order.date);

  const row = {
    id: order.id,
    order,
    m,
    pinned: Boolean(m.pinned),
    printed: Boolean(m.printed),
    printedAt: m.printedAt || null,
    isCounter,
    channel,
    orderStatus,
    deliveryStatus,
    paymentMethod,
    paymentStatus,
    courier: m.courier || order.courier || '',
    tracking: m.trackingId || order.trackingId || '',
    consignment: m.consignmentId || order.consignmentId || '',
    staff: m.assignedStaff || order.assignedStaff || '',
    district,
    charge,
    payable,
    netProfit,
    discount,
    subtotal,
    paid,
    outstanding,
    cod,
    refund,
    uniqueBooks: items.length,
    copies: items.reduce((s, i) => s + num(i.quantity), 0),
    day,
    ts: new Date(order.date).getTime() || 0,
    deliveredDay: deliveredEvent
      ? toDay(deliveredEvent.at)
      : deliveryStatus === 'delivered'
        ? day
        : '',
  };
  row.haystack = [
    order.id,
    order.customerName,
    order.shopName,
    order.phone,
    row.tracking,
    row.consignment,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return row;
}

/* Rules: returns a reason string when the move is NOT allowed, otherwise null. */
function canOrderMove(row, to) {
  if (row.isCounter) return 'Counter sales follow the counter workflow';
  if (!ORDER_FLOW[row.orderStatus]?.includes(to))
    return 'Not a valid next step from the current status';
  if (to === 'cancelled' && row.orderStatus === 'delivered')
    return 'Delivered orders should use return flow';
  return null;
}

function canDeliveryMove(row, to) {
  if (row.isCounter) return 'Counter sales have no delivery workflow';
  if (row.orderStatus === 'cancelled') return 'Order is cancelled';
  if (!DELIVERY_FLOW[row.deliveryStatus]?.includes(to))
    return 'Not a valid next step from the current status';
  if (to === 'shipped' && !row.courier) return 'Assign a courier first';
  return null;
}

/* Status kept in the existing useData() order record (new / processing / shipped / delivered / cancelled). */
const contextOrderTarget = to =>
  to === 'cancelled'
    ? 'cancelled'
    : to === 'approved'
      ? 'processing'
      : to === 'shipping'
        ? 'shipped'
        : to === 'delivered'
          ? 'delivered'
          : null;
const contextDeliveryTarget = to =>
  to === 'ready_to_ship'
    ? 'processing'
    : ['shipped', 'in_transit', 'out_for_delivery'].includes(to)
      ? 'shipped'
      : to === 'delivered'
        ? 'delivered'
        : null;

/* ------------------------------------------------------------------ */
/* Printing & export                                                   */
/* ------------------------------------------------------------------ */

const PRINT_CSS = `<style>
body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:0;padding:24px;font-size:13px}
h1,h2,h3{margin:0}
table{width:100%;border-collapse:collapse;margin-top:10px}
th,td{border-bottom:1px solid #ddd;padding:6px 8px;text-align:left}
th{background:#f5f5f5}
.r{text-align:right}.center{text-align:center}
.page{page-break-after:always;padding-bottom:20px}
.page:last-child{page-break-after:auto}
.box{border:2px solid #111;padding:14px;margin-bottom:16px;max-width:420px}
.muted{color:#666}
</style>`;

function openPrint(html, title) {
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) {
    toast.error('Popup blocked. Please allow popups');
    return;
  }
  w.document.write(
    `<html><head><meta charset="utf-8"><title>${esc(title)}</title>${PRINT_CSS}</head><body>${html}</body></html>`,
  );
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
}

function invoiceHtml(row) {
  const o = row.order;
  const lines = (o.items || [])
    .map(
      (i, idx) =>
        `<tr><td>${idx + 1}</td><td>${esc(i.title)}</td><td class="r">${num(i.quantity)}</td><td class="r">৳${num(i.price)}</td><td class="r">৳${num(i.price) * num(i.quantity)}</td></tr>`,
    )
    .join('');
  return `<div class="page">
<div class="center"><h2>${esc(PUBLISHER_NAME)}</h2><p class="muted">Invoice</p></div>
<p><b>Order:</b> ${esc(o.id)} &nbsp; <b>Date:</b> ${esc(fmtDate(o.date))} &nbsp; <b>Channel:</b> ${esc(labelOf(CHANNELS, row.channel))}</p>
<p><b>${row.isCounter ? 'Shop' : 'Customer'}:</b> ${esc(o.shopName || o.customerName)} &nbsp; <b>Phone:</b> ${esc(o.phone)}</p>
<p><b>Address:</b> ${esc(o.address || 'Showroom')}</p>
<table><thead><tr><th>Sl</th><th>Book</th><th class="r">Qty</th><th class="r">Unit price</th><th class="r">Subtotal</th></tr></thead><tbody>${lines}</tbody></table>
<table style="max-width:320px;margin-left:auto">
<tr><td>Subtotal</td><td class="r">৳${row.subtotal}</td></tr>
<tr><td>Discount</td><td class="r">− ৳${row.discount}</td></tr>
<tr><td>Delivery charge</td><td class="r">৳${row.charge}</td></tr>
<tr><th>Total payable</th><th class="r">৳${row.payable}</th></tr>
<tr><td>Paid</td><td class="r">৳${row.paid}</td></tr>
<tr><td>Outstanding</td><td class="r">৳${row.outstanding}</td></tr>
</table></div>`;
}

function labelHtml(row) {
  const o = row.order;
  const m = row.m;
  return `<div class="page"><div class="box">
<h3>${esc(PUBLISHER_NAME)}</h3>
<p class="muted">Order ${esc(o.id)} · ${esc(labelOf(CHANNELS, row.channel))}</p>
<hr/>
<p><b>To:</b> ${esc(m.recipientName || o.customerName || o.shopName)}</p>
<p><b>Phone:</b> ${esc(m.recipientPhone || o.phone)}</p>
<p><b>Address:</b> ${esc(m.shipAddress || o.address)}</p>
<p><b>District:</b> ${esc(row.district || '—')}</p>
<hr/>
<p><b>Courier:</b> ${esc(row.courier || '—')}</p>
<p><b>Consignment:</b> ${esc(row.consignment || '—')} &nbsp; <b>Tracking:</b> ${esc(row.tracking || '—')}</p>
<p><b>Books:</b> ${row.copies} copies</p>
<h3>${row.cod > 0 ? `COLLECT (COD): ৳${row.cod}` : 'PREPAID'}</h3>
</div></div>`;
}

const exportColumns = [
  ['Order ID', r => r.id],
  ['Channel', r => labelOf(CHANNELS, r.channel)],
  ['Customer / Shop', r => r.order.shopName || r.order.customerName],
  ['Phone', r => r.order.phone],
  ['Books', r => r.uniqueBooks],
  ['Copies', r => r.copies],
  ['Order Amount', r => r.payable],
  ['Delivery Charge', r => r.charge],
  ['Payment Status', r => labelOf(PAYMENT_STATUSES, r.paymentStatus)],
  ['Order Status', r => labelOf(ORDER_STATUSES, r.orderStatus)],
  [
    'Delivery Status',
    r => (r.isCounter ? '—' : labelOf(DELIVERY_STATUSES, r.deliveryStatus)),
  ],
  ['Order Date', r => fmtDate(r.order.date)],
  ['Courier', r => r.courier],
  ['Tracking ID', r => r.tracking],
  ['Consignment ID', r => r.consignment],
  ['District', r => r.district],
  ['Assigned Staff', r => r.staff],
];

function downloadCsv(list) {
  const cell = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [exportColumns.map(([h]) => cell(h)).join(',')];
  list.forEach(r =>
    lines.push(exportColumns.map(([, f]) => cell(f(r))).join(',')),
  );
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `orders-${todayLocal()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function reportHtml(list, subtitle) {
  const cols = exportColumns.filter(
    ([h]) =>
      ![
        'Phone',
        'Delivery Charge',
        'Tracking ID',
        'Consignment ID',
        'District',
        'Assigned Staff',
        'Copies',
      ].includes(h),
  );
  const head = cols.map(([h]) => `<th>${esc(h)}</th>`).join('');
  const body = list
    .map(
      r => `<tr>${cols.map(([, f]) => `<td>${esc(f(r))}</td>`).join('')}</tr>`,
    )
    .join('');
  const total = list.reduce((s, r) => s + r.payable, 0);
  return `<h2>${esc(PUBLISHER_NAME)} — Orders report</h2><p class="muted">${esc(subtitle)} · ${list.length} orders · Total ৳${total}</p><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

/* ------------------------------------------------------------------ */
/* Small UI pieces                                                     */
/* ------------------------------------------------------------------ */

const inputCls =
  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400';
const btnBase =
  'inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50';
const btnOutline = `${btnBase} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`;
const btnPrimary = `${btnBase} bg-primary text-dark hover:bg-primary-hover`;
const btnDanger = `${btnBase} border border-red-200 bg-white text-red-600 hover:bg-red-50`;

function Pill({ list, value }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${toneOf(list, value)}`}
    >
      {labelOf(list, value)}
    </span>
  );
}

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>
      )}
    </label>
  );
}

function TextInput({ label, value, onChange, type = 'text', hint, ...rest }) {
  return (
    <Field label={label} hint={hint}>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={inputCls}
        {...rest}
      />
    </Field>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      aria-label={label}
      className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
    >
      <option value="">{`All ${label}`}</option>
      {options.map(o => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Section({ title, children, right }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function InfoGrid({ items }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(([k, v]) => (
        <div key={k} className="min-w-0">
          <dt className="text-xs text-slate-500">{k}</dt>
          <dd className="mt-0.5 break-words text-sm font-medium text-slate-800">
            {v || '—'}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ConfirmDialog({
  title,
  children,
  confirmLabel = 'Confirm',
  danger,
  withNote,
  disabled,
  onConfirm,
  onCancel,
}) {
  const [note, setNote] = useState('');
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-dark/70 px-4 py-6 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl"
      >
        <h3 className="font-heading text-lg font-bold text-dark">{title}</h3>
        <div className="mt-2 space-y-3 text-sm text-slate-600">{children}</div>
        {withNote && (
          <div className="mt-3">
            <TextInput
              label="Note (optional)"
              value={note}
              onChange={setNote}
              placeholder="Reason or remarks"
            />
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className={btnOutline}>
            Back
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onConfirm(note)}
            className={
              danger
                ? `${btnBase} bg-red-600 text-white hover:bg-red-700`
                : btnPrimary
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Order details modal                                                 */
/* ------------------------------------------------------------------ */

function IssuesTab({ row, api }) {
  const m = row.m;
  const attempts = m.attempts || [];
  const info = m.returnInfo;
  const canFail = ['shipped', 'in_transit', 'out_for_delivery'].includes(
    row.deliveryStatus,
  );
  const canStartReturn =
    ['delivery_failed', 'delivered'].includes(row.deliveryStatus) && !info;

  const [fail, setFail] = useState({
    reason: '',
    courierNotes: '',
    customerNotes: '',
    nextAction: '',
    staff: row.staff || '',
  });
  const setF = key => value => setFail(prev => ({ ...prev, [key]: value }));

  const [retReason, setRetReason] = useState('');
  const [items, setItems] = useState(
    () =>
      info?.items ??
      (row.order.items || []).map(i => ({
        bookId: i.bookId,
        title: i.title,
        ordered: num(i.quantity),
        returnedQty: num(i.quantity),
        condition: 'good',
      })),
  );
  const [refund, setRefund] = useState(String(info?.refund ?? 0));
  const [decisionNote, setDecisionNote] = useState('');

  const patchItem = (idx, patch) =>
    setItems(list =>
      list.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    );
  const goodCopies = items
    .filter(i => i.condition === 'good')
    .reduce((s, i) => s + num(i.returnedQty), 0);
  const damagedCopies = items
    .filter(i => i.condition === 'damaged')
    .reduce((s, i) => s + num(i.returnedQty), 0);

  return (
    <div className="space-y-4">
      <Section title="Failed delivery">
        {canFail && (
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <TextInput
              label="Failure reason *"
              value={fail.reason}
              onChange={setF('reason')}
              list="fail-reasons"
              placeholder="e.g. Customer not reachable"
            />
            <datalist id="fail-reasons">
              {[
                'Customer not reachable',
                'Customer refused',
                'Wrong address',
                'Address not found',
                'Customer asked to reschedule',
              ].map(r => (
                <option key={r} value={r} />
              ))}
            </datalist>
            <TextInput
              label="Responsible staff"
              value={fail.staff}
              onChange={setF('staff')}
            />
            <TextInput
              label="Courier notes"
              value={fail.courierNotes}
              onChange={setF('courierNotes')}
            />
            <TextInput
              label="Customer contact notes"
              value={fail.customerNotes}
              onChange={setF('customerNotes')}
            />
            <div className="sm:col-span-2">
              <TextInput
                label="Next action"
                value={fail.nextAction}
                onChange={setF('nextAction')}
                placeholder="e.g. Re-attempt tomorrow"
              />
            </div>
            <div className="sm:col-span-2 flex items-center justify-between gap-2">
              <p className="text-xs text-slate-500">
                This will be attempt #{attempts.length + 1}.
              </p>
              <button
                type="button"
                onClick={() => api.saveFailed(row, fail)}
                className={btnDanger}
              >
                <FiXCircle size={14} /> Record failed delivery
              </button>
            </div>
          </div>
        )}
        {!canFail && attempts.length === 0 && (
          <p className="text-sm text-slate-400">
            A failed delivery can be recorded once the order is shipped.
          </p>
        )}
        {attempts.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="py-2 pr-3 font-medium">#</th>
                  <th className="py-2 pr-3 font-medium">Reason</th>
                  <th className="py-2 pr-3 font-medium">Notes</th>
                  <th className="py-2 pr-3 font-medium">Next action</th>
                  <th className="py-2 font-medium">By / when</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attempts.map(a => (
                  <tr key={a.n}>
                    <td className="py-2 pr-3 font-semibold">{a.n}</td>
                    <td className="py-2 pr-3">{a.reason}</td>
                    <td className="py-2 pr-3 text-slate-500">
                      {[a.courierNotes, a.customerNotes]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </td>
                    <td className="py-2 pr-3 text-slate-500">
                      {a.nextAction || '—'}
                    </td>
                    <td className="py-2 text-xs text-slate-500">
                      {a.staff || a.by} · {fmtDateTime(a.at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Return & refund">
        {!info && !canStartReturn && (
          <p className="text-sm text-slate-400">
            A return can be started after a failed delivery or after delivery.
          </p>
        )}

        {!info && canStartReturn && (
          <div className="grid gap-3 sm:grid-cols-2">
            <TextInput
              label="Return reason *"
              value={retReason}
              onChange={setRetReason}
              list="return-reasons"
              placeholder="e.g. Damaged in transit"
            />
            <datalist id="return-reasons">
              {[
                'Customer refused',
                'Damaged in transit',
                'Wrong book delivered',
                'Changed mind',
                'Undeliverable',
              ].map(r => (
                <option key={r} value={r} />
              ))}
            </datalist>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => api.startReturn(row, retReason, items)}
                className={btnPrimary}
              >
                <FiRotateCcw size={14} /> Start return
              </button>
            </div>
          </div>
        )}

        {info && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  info.status === 'approved'
                    ? TONES.emerald
                    : info.status === 'rejected'
                      ? TONES.rose
                      : TONES.amber
                }`}
              >
                {info.status === 'pending_inspection'
                  ? 'Pending inspection'
                  : info.status === 'approved'
                    ? 'Return approved'
                    : 'Return rejected'}
              </span>
              <span className="text-slate-600">Reason: {info.reason}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500">
                    <th className="py-2 pr-3 font-medium">Book</th>
                    <th className="py-2 pr-3 font-medium">Ordered</th>
                    <th className="py-2 pr-3 font-medium">Returned qty</th>
                    <th className="py-2 font-medium">Condition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((it, idx) => (
                    <tr key={it.bookId ?? idx}>
                      <td className="py-2 pr-3 font-medium text-slate-800">
                        {it.title}
                      </td>
                      <td className="py-2 pr-3">{it.ordered}</td>
                      <td className="py-2 pr-3">
                        <input
                          type="number"
                          min="0"
                          max={it.ordered}
                          disabled={info.status !== 'pending_inspection'}
                          value={it.returnedQty}
                          onChange={e =>
                            patchItem(idx, {
                              returnedQty: Math.min(
                                it.ordered,
                                Math.max(0, num(e.target.value)),
                              ),
                            })
                          }
                          className={`${inputCls} w-24`}
                        />
                      </td>
                      <td className="py-2">
                        <select
                          disabled={info.status !== 'pending_inspection'}
                          value={it.condition}
                          onChange={e =>
                            patchItem(idx, { condition: e.target.value })
                          }
                          className={`${inputCls} w-32`}
                        >
                          <option value="good">Good</option>
                          <option value="damaged">Damaged</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-slate-500">
              Good: <b>{goodCopies}</b> copies · Damaged: <b>{damagedCopies}</b>{' '}
              copies. Returned books are never added to sellable stock
              automatically.
            </p>

            {info.status === 'pending_inspection' ? (
              <div className="space-y-3 rounded-lg bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-slate-600">
                    {info.inspected
                      ? 'Inspection saved.'
                      : 'Save the inspection before approving.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => api.saveInspection(row, items)}
                    className={btnOutline}
                  >
                    Save inspection
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextInput
                    label={`Refund amount (৳) — paid ${formatCurrency(row.paid)}`}
                    type="number"
                    min="0"
                    max={row.paid}
                    value={refund}
                    onChange={setRefund}
                  />
                  <TextInput
                    label="Decision note"
                    value={decisionNote}
                    onChange={setDecisionNote}
                  />
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      api.decideReturn(row, 'rejected', {
                        refund: 0,
                        note: decisionNote,
                      })
                    }
                    className={btnDanger}
                  >
                    Reject return
                  </button>
                  <button
                    type="button"
                    disabled={!info.inspected}
                    onClick={() =>
                      api.decideReturn(row, 'approved', {
                        refund,
                        note: decisionNote,
                      })
                    }
                    className={`${btnBase} bg-emerald-600 text-white hover:bg-emerald-700`}
                  >
                    Approve return
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                <p>
                  Decision by {info.decidedBy} on {fmtDateTime(info.decidedAt)}
                  {info.decisionNote && ` — ${info.decisionNote}`}
                </p>
                {info.status === 'approved' && (
                  <p className="mt-1">
                    Refund: <b>{formatCurrency(info.refund)}</b>
                  </p>
                )}
                {info.status === 'approved' && (
                  <p className="mt-1 text-xs text-amber-700">
                    Inventory has not been changed by this screen. Restock the{' '}
                    {goodCopies} good copies from the stock page.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Section>
    </div>
  );
}

function OrderDetailsModal({ row, rows, books, staffOptions, api, onClose }) {
  const [showIssues, setShowIssues] = useState(false);
  const { order, m } = row;
  const [courierForm, setCourierForm] = useState({
    courier: row.courier || '',
    consignmentId: row.consignment || '',
    trackingId: row.tracking || '',
    courierStatus: m.courierStatus || '',
  });
  const [courierNote, setCourierNote] = useState('');

  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const previousOrders = rows.filter(
    r => r.id !== row.id && order.phone && r.order.phone === order.phone,
  ).length;
  const timeline = [
    {
      key: 'placed',
      label: 'Order Placed',
      at: order.date,
      by: order.customerName || 'Customer',
      note: order.notes || order.deliveryInstructions || '',
    },
    ...(m.timeline || []),
  ];

  const nextOrder = (ORDER_FLOW[row.orderStatus] || []).filter(
    s => s !== 'cancelled',
  );
  const cancelReason = canOrderMove(row, 'cancelled');
  const notePreview = order.deliveryInstructions || order.note || order.notes;
  const stageSteps = ['new', 'approved', 'shipping', 'delivered'];
  const stageIdx = stageSteps.indexOf(row.orderStatus);

  const askCancel = () =>
    api.askConfirm({
      title: `Cancel order ${row.id}?`,
      body: 'The order will be cancelled and recorded in the tracking timeline.',
      confirmLabel: 'Cancel order',
      danger: true,
      withNote: true,
      onConfirm: note => api.moveOrder(row, 'cancelled', note),
    });

  const handleSaveCourier = e => {
    e.preventDefault();
    api.saveShipment(row, {
      ...courierForm,
      shipDate: m.shipDate || todayLocal(),
      eta: m.eta || '',
      deliveryCharge: String(row.charge || ''),
      recipientName: m.recipientName || order.customerName || '',
      recipientPhone: toEnglishDigits(m.recipientPhone || order.phone || ''),
      shipAddress: m.shipAddress || order.address || '',
    });
  };

  const handleAddNote = e => {
    e.preventDefault();
    if (!courierNote.trim()) return;
    api.addTrackingNote(row, courierNote.trim());
    setCourierNote('');
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/45 px-3 py-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Order ${row.id}`}
        onClick={e => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-2xl"
      >
        {/* Clean Header: Order ID, Status, Printed/Unprinted, Note */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-lg font-bold text-slate-900">
                {row.id}
              </h2>
              <Pill list={ORDER_STATUSES} value={row.orderStatus} />
              <span
                className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  row.printed
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {row.printed ? 'Printed' : 'Unprinted'}
              </span>
              <Pill list={PAYMENT_METHODS} value={row.paymentMethod} />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {fmtDateTime(order.date)}
              {notePreview ? ` · Note: ${notePreview}` : ''}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => api.printInvoices([row])}
              className={btnOutline}
            >
              <FiPrinter size={14} /> {row.printed ? 'Reprint' : 'Print'}
            </button>
            <button
              type="button"
              onClick={() => api.printLabels([row])}
              className={btnOutline}
            >
              <FiTag size={14} /> Label
            </button>
            <button
              type="button"
              onClick={onClose}
              className={btnOutline}
            >
              Close
            </button>
          </div>
        </div>

        {/* Stacked Clean Body (Items -> Invoice -> Customer Info -> Courier/Order Timeline) */}
        <div className="space-y-4 overflow-y-auto p-5">
          {/* 1. Book Items & Invoice Totals */}
          <Section
            title={`Book Items (${row.uniqueBooks} ${row.uniqueBooks === 1 ? 'book' : 'books'}, ${row.copies} ${row.copies === 1 ? 'copy' : 'copies'})`}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[580px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500">
                    <th className="whitespace-nowrap py-2 pr-3 font-medium">
                      Book
                    </th>
                    <th className="whitespace-nowrap py-2 pr-3 font-medium">
                      SKU / ISBN
                    </th>
                    <th className="whitespace-nowrap py-2 pr-3 text-center font-medium">
                      Qty
                    </th>
                    <th className="whitespace-nowrap py-2 pr-3 text-right font-medium">
                      Unit Price
                    </th>
                    <th className="whitespace-nowrap py-2 pr-3 text-center font-medium">
                      Discount
                    </th>
                    <th className="whitespace-nowrap py-2 text-right font-medium">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(order.items || []).map((item, idx) => {
                    const book = books.find(
                      b => String(b.id) === String(item.bookId),
                    );
                    const cover =
                      book?.cover ?? book?.coverImage ?? book?.image;
                    const retail = num(
                      book?.retailPrice ?? book?.price ?? item.price,
                    );
                    const unitPrice = num(item.price);
                    const discountPct =
                      book?.offer != null
                        ? num(book.offer)
                        : retail > unitPrice && retail > 0
                          ? Math.round(((retail - unitPrice) / retail) * 100)
                          : 25;
                    return (
                      <tr key={item.bookId ?? idx}>
                        <td className="py-2.5 pr-3">
                          <div className="flex items-center gap-3">
                            {cover ? (
                              <img
                                src={cover}
                                alt=""
                                className="h-11 w-8 shrink-0 rounded border border-slate-200 object-cover"
                              />
                            ) : (
                              <span className="flex h-11 w-8 shrink-0 items-center justify-center rounded border border-slate-200 bg-slate-50 text-slate-300">
                                <FiPackage size={14} />
                              </span>
                            )}
                            <span className="font-medium text-slate-900">
                              {item.title}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap py-2.5 pr-3 text-xs text-slate-500">
                          {book?.sku || book?.isbn || item.sku || '—'}
                        </td>
                        <td className="whitespace-nowrap py-2.5 pr-3 text-center text-slate-700">
                          {item.quantity}
                        </td>
                        <td className="whitespace-nowrap py-2.5 pr-3 text-right text-slate-700">
                          {formatCurrency(unitPrice)}
                        </td>
                        <td className="whitespace-nowrap py-2.5 pr-3 text-center">
                          <span className="text-xs font-medium text-rose-600">
                            {discountPct}% OFF
                          </span>
                        </td>
                        <td className="whitespace-nowrap py-2.5 text-right font-semibold text-slate-900">
                          {formatCurrency(unitPrice * num(item.quantity))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Invoice Breakdown */}
            <div className="mt-4 border-t border-slate-100 pt-3">
              <div className="ml-auto max-w-xs space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(row.subtotal)}</span>
                </div>
                {row.discount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Discount</span>
                    <span>− {formatCurrency(row.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Charge</span>
                  <span>{formatCurrency(row.charge)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5 text-sm font-bold text-slate-900">
                  <span>Invoice Total</span>
                  <span>{formatCurrency(row.payable)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Payment ({labelOf(PAYMENT_METHODS, row.paymentMethod)})</span>
                  <span className="font-semibold">
                    {labelOf(PAYMENT_STATUSES, row.paymentStatus)}
                  </span>
                </div>
              </div>
            </div>
          </Section>

          {/* 2. Customer Information & Full Address */}
          <Section title="Customer Information">
            <InfoGrid
              items={[
                ['Name', order.customerName],
                ['Phone', toEnglishDigits(order.phone)],
                [
                  'Alternative Phone',
                  toEnglishDigits(order.altPhone || order.alternativePhone),
                ],
                ['Email', order.email],
                ['Full Address', order.address],
                ['District', row.district],
                ['Area / Thana', order.area || order.thana],
                ['Note', notePreview],
                ['Previous Orders', String(previousOrders)],
              ]}
            />
          </Section>

          {/* 3. Order Status & Courier Tracking (Top-to-Bottom Courier Style) */}
          <Section
            title="Order & Courier Tracking"
            right={
              <div className="flex flex-wrap items-center gap-1.5">
                {nextOrder.map(s => {
                  const why = canOrderMove(row, s);
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={Boolean(why)}
                      title={why || ''}
                      onClick={() => api.moveOrder(row, s)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                    >
                      → {labelOf(ORDER_STATUSES, s)}
                    </button>
                  );
                })}
                {ORDER_FLOW[row.orderStatus]?.includes('cancelled') && (
                  <button
                    type="button"
                    disabled={Boolean(cancelReason)}
                    title={cancelReason || ''}
                    onClick={askCancel}
                    className="rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    Cancel
                  </button>
                )}
                {order.paymentMethod !== 'cod' &&
                  row.paymentStatus === 'unpaid' && (
                    <button
                      type="button"
                      onClick={() => api.verifyPayment(row)}
                      className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      Verify Payment
                    </button>
                  )}
                {order.paymentMethod === 'cod' &&
                  row.orderStatus === 'delivered' &&
                  ['unpaid', 'partial'].includes(row.paymentStatus) && (
                    <button
                      type="button"
                      onClick={() => api.markCod(row)}
                      className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      COD Collected
                    </button>
                  )}
              </div>
            }
          >
            {/* Visual Top-to-Bottom Stage Pipeline + Courier Updates */}
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              {/* Left: Top-to-Bottom Courier Timeline & Notes */}
              <div>
                <div className="mb-4 flex flex-wrap items-center gap-1.5">
                  {stageSteps.map((stage, idx) => {
                    const isCancelled = row.orderStatus === 'cancelled';
                    const done = !isCancelled && idx <= stageIdx;
                    const current = !isCancelled && idx === stageIdx;
                    return (
                      <span
                        key={stage}
                        className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                          current
                            ? 'bg-blue-600 text-white'
                            : done
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-50 text-slate-400 border border-slate-200'
                        }`}
                      >
                        {labelOf(ORDER_STATUSES, stage)}
                      </span>
                    );
                  })}
                  {row.orderStatus === 'cancelled' && (
                    <span className="rounded-md bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
                      Cancelled
                    </span>
                  )}
                </div>

                {/* Vertical Courier-style feed from top down */}
                <ol className="relative space-y-4 border-l-2 border-slate-200 pl-5">
                  {timeline.map((event, idx) => {
                    const isLatest = idx === timeline.length - 1;
                    return (
                      <li key={idx} className="relative">
                        <span
                          className={`absolute -left-[25px] top-1 h-3 w-3 rounded-full border-2 border-white ${
                            isLatest ? 'bg-blue-600' : 'bg-emerald-500'
                          }`}
                        />
                        <div className="rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-900">
                              {event.label}
                            </p>
                            <span className="text-[11px] text-slate-400">
                              {fmtDateTime(event.at)}
                            </span>
                          </div>
                          {event.note && (
                            <p className="mt-1 text-xs text-slate-600">
                              {event.note}
                            </p>
                          )}
                          {event.by && (
                            <p className="mt-0.5 text-[11px] text-slate-400">
                              By: {event.by}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>

                {/* Add Note directly into courier timeline */}
                <form onSubmit={handleAddNote} className="mt-4 flex gap-2">
                  <input
                    type="text"
                    value={courierNote}
                    onChange={e => setCourierNote(e.target.value)}
                    placeholder="Add courier or order update note..."
                    className="h-9 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Add Note
                  </button>
                </form>
              </div>

              {/* Right: Courier & Staff Details */}
              <form
                onSubmit={handleSaveCourier}
                className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-xs"
              >
                <p className="font-semibold text-slate-800">Courier Details</p>
                <Field label="Courier">
                  <select
                    value={courierForm.courier}
                    onChange={e =>
                      setCourierForm(prev => ({
                        ...prev,
                        courier: e.target.value,
                      }))
                    }
                    className={inputCls}
                  >
                    <option value="">Select courier</option>
                    {COURIERS.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
                <TextInput
                  label="Consignment ID"
                  value={courierForm.consignmentId}
                  onChange={v =>
                    setCourierForm(prev => ({ ...prev, consignmentId: v }))
                  }
                  placeholder="Courier consignment ID"
                />
                <TextInput
                  label="Tracking / Courier Status"
                  value={courierForm.courierStatus}
                  onChange={v =>
                    setCourierForm(prev => ({ ...prev, courierStatus: v }))
                  }
                  placeholder="e.g. In transit at hub"
                />
                <Field label="Assigned Staff">
                  <select
                    value={row.staff}
                    onChange={e =>
                      api.setMeta(
                        row,
                        { assignedStaff: e.target.value },
                        `Assigned to ${e.target.value || 'nobody'}`,
                      )
                    }
                    className={inputCls}
                  >
                    <option value="">Unassigned</option>
                    {staffOptions.map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
                <button
                  type="submit"
                  className={`${btnPrimary} w-full`}
                >
                  <FiSend size={13} /> Save Courier Info
                </button>
              </form>
            </div>
          </Section>

          {/* Optional Failed Delivery / Return Section */}
          <div>
            <button
              type="button"
              onClick={() => setShowIssues(v => !v)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              {showIssues
                ? 'Hide failed delivery & returns'
                : 'Manage failed delivery or return'}
            </button>
            {showIssues && (
              <div className="mt-3">
                <IssuesTab
                  key={`${row.id}-${row.deliveryStatus}-${m.returnInfo?.status || 'none'}`}
                  row={row}
                  api={api}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bulk actions                                                        */
/* ------------------------------------------------------------------ */

function BulkDialog({ def, selected, staffOptions, onCancel, onDone }) {
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const checked = selected.map(r => ({
    row: r,
    reason: def.check ? def.check(r, value) : null,
  }));
  const eligible = checked.filter(c => !c.reason);
  const skipped = checked.filter(c => c.reason);
  const needsValue = def.value === 'staff' || def.value === 'courier';

  const run = () => {
    let ok = 0;
    const failed = [];
    eligible.forEach(({ row }) => {
      const res = def.apply(row, value, note);
      if (res.ok) ok += 1;
      else failed.push(`${row.id}: ${res.message}`);
    });
    if (ok)
      toast.success(`${def.label}: ${ok} order${ok > 1 ? 's' : ''} updated`);
    failed.forEach(f => toast.error(f));
    onDone();
  };

  return (
    <ConfirmDialog
      title={def.label}
      confirmLabel={`Apply to ${eligible.length}`}
      danger={def.danger}
      disabled={eligible.length === 0 || (needsValue && !value)}
      onConfirm={run}
      onCancel={onCancel}
    >
      {def.value === 'staff' && (
        <Field label="Staff member">
          <select
            value={value}
            onChange={e => setValue(e.target.value)}
            className={inputCls}
          >
            <option value="">Select staff</option>
            {staffOptions.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      )}
      {def.value === 'courier' && (
        <Field label="Courier company">
          <select
            value={value}
            onChange={e => setValue(e.target.value)}
            className={inputCls}
          >
            <option value="">Select courier</option>
            {COURIERS.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
      )}
      {def.danger && (
        <TextInput
          label="Note (optional)"
          value={note}
          onChange={setNote}
          placeholder="Reason or remarks"
        />
      )}
      <p>
        <b>{eligible.length}</b> of {selected.length} selected orders can be
        updated.
      </p>
      {skipped.length > 0 && (
        <div className="max-h-32 overflow-y-auto rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
          <p className="mb-1 font-semibold">Skipped:</p>
          {skipped.map(({ row, reason }) => (
            <p key={row.id}>
              {row.id} — {reason}
            </p>
          ))}
        </div>
      )}
    </ConfirmDialog>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const EMPTY_FILTERS = {
  channel: '',
  orderStatus: '',
  delivery: '',
  payment: '',
  courier: '',
  district: '',
  staff: '',
  from: '',
  to: '',
};

function Orders() {
  const {
    orders = [],
    books = [],
    updateOrderStatus,
    markPaymentVerified,
  } = useData();
  const { currentUser, users = [] } = useAuth();
  const actor = currentUser?.name || 'Staff';

  const [store, setStore] = useState(loadStore);
  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(store));
    } catch {
      /* storage unavailable */
    }
  }, [store]);

  const [search, setSearch] = useState('');
  const [quick, setQuick] = useState('all');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState({ key: 'date', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterMenu, setFilterMenu] = useState(false);
  const [bulkMenu, setBulkMenu] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [detailId, setDetailId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [bulkDef, setBulkDef] = useState(null);

  const today = todayLocal();
  const rows = useMemo(
    () =>
      orders
        .filter(o => o.orderType !== 'counter' && !o.shopName)
        .map(o => buildRow(o, store.meta[o.id] || {}, books)),
    [orders, store.meta, books],
  );

  const staffOptions = useMemo(() => {
    const names = users
      .filter(u => STAFF_ROLES.includes(u.role))
      .map(u => u.name);
    const fromData = rows.map(r => r.staff).filter(Boolean);
    return [...new Set([...names, ...fromData, actor])].filter(Boolean);
  }, [users, rows, actor]);

  /* ----- core mutations (return { ok, message }) ----- */
  const writeMeta = (id, patch, event, action) => {
    const at = new Date().toISOString();
    setStore(prev => {
      const cur = prev.meta[id] || {};
      const next = { ...cur, ...patch };
      if (event)
        next.timeline = [...(cur.timeline || []), { ...event, at, by: actor }];
      const audit = action
        ? [{ at, by: actor, orderId: id, action }, ...prev.audit].slice(0, 500)
        : prev.audit;
      return { meta: { ...prev.meta, [id]: next }, audit };
    });
  };

  const syncContext = (row, target) => {
    if (!target || row.order.status === target) return { ok: true };
    const res = updateOrderStatus?.(row.id, target);
    return res && res.success === false
      ? { ok: false, message: res.message || 'Could not update the order' }
      : { ok: true };
  };

  const coreMoveOrder = (row, to, note = '') => {
    const why = canOrderMove(row, to);
    if (why) return { ok: false, message: why };
    const sync = syncContext(row, contextOrderTarget(to));
    if (!sync.ok) return sync;
    const deliveryPatch =
      to === 'approved'
        ? { deliveryStatus: 'ready_to_ship' }
        : to === 'shipping'
          ? { deliveryStatus: 'shipped', shipDate: row.m.shipDate || today }
          : to === 'delivered'
            ? { deliveryStatus: 'delivered' }
            : {};
    writeMeta(
      row.id,
      { orderStatus: to, ...deliveryPatch },
      { key: `o:${to}`, label: ORDER_EVENT[to], note },
      `Order status → ${labelOf(ORDER_STATUSES, to)}`,
    );
    return { ok: true, message: `${ORDER_EVENT[to]}.` };
  };

  const coreMoveDelivery = (row, to, note = '', extra = {}) => {
    const why = canDeliveryMove(row, to);
    if (why) return { ok: false, message: why };
    const sync = syncContext(row, contextDeliveryTarget(to));
    if (!sync.ok) return sync;
    const patch = { deliveryStatus: to, ...extra };
    if (to === 'shipped' && !row.m.shipDate) patch.shipDate = today;
    writeMeta(
      row.id,
      patch,
      { key: `d:${to}`, label: DELIVERY_EVENT[to], note },
      `Delivery status → ${labelOf(DELIVERY_STATUSES, to)}`,
    );
    return { ok: true, message: `${DELIVERY_EVENT[to]}.` };
  };

  const report = res => {
    if (res.ok) toast.success(res.message || 'Updated');
    else toast.error(res.message || 'Something went wrong');
    return res;
  };

  const markPrinted = (list, label) => {
    const at = new Date().toISOString();
    setStore(prev => {
      const nextMeta = { ...prev.meta };
      const nextAudit = [...prev.audit];
      list.forEach(item => {
        const cur = nextMeta[item.id] || {};
        nextMeta[item.id] = {
          ...cur,
          printed: true,
          printedAt: at,
          timeline: [...(cur.timeline || []), { key: 'print', label, at, by: actor, note: '' }],
        };
        nextAudit.unshift({ at, by: actor, orderId: item.id, action: label });
      });
      return { meta: nextMeta, audit: nextAudit.slice(0, 500) };
    });
  };

  const api = {
    audit: store.audit,
    askConfirm: setConfirm,
    moveOrder: (row, to, note) => report(coreMoveOrder(row, to, note)),
    moveDelivery: (row, to, note) => report(coreMoveDelivery(row, to, note)),
    addTrackingNote: (row, note) => {
      writeMeta(
        row.id,
        {},
        { key: 'note', label: 'Courier / Order Update', note },
        `Note added: ${note}`,
      );
      toast.success('Update added');
    },
    printInvoices: list => {
      markPrinted(list, 'Invoice printed');
      openPrint(list.map(invoiceHtml).join(''), 'Invoices');
    },
    printLabels: list => {
      const online = list.filter(r => !r.isCounter);
      if (online.length === 0)
        return toast.error('Counter sales do not need shipping labels');
      markPrinted(online, 'Shipping label printed');
      openPrint(online.map(labelHtml).join(''), 'Shipping labels');
    },
    setMeta: (row, patch, action) => {
      writeMeta(row.id, patch, null, action);
      toast.success('Saved');
    },
    verifyPayment: row => {
      const res = markPaymentVerified?.(row.id);
      if (res && res.success === false)
        return toast.error(res.message || 'Could not verify payment');
      writeMeta(
        row.id,
        { paymentStatus: 'paid', paidAmount: row.payable },
        { key: 'p:paid', label: 'Payment verified', note: '' },
        'Payment verified',
      );
      toast.success('Payment verified.');
    },
    markCod: row => {
      writeMeta(
        row.id,
        { paymentStatus: 'paid', paidAmount: row.payable },
        { key: 'p:cod', label: 'COD collected', note: `৳${row.cod}` },
        'COD collected',
      );
      toast.success('COD marked as collected.');
    },
    saveShipment: (row, form) => {
      if (!form.courier) return toast.error('Select a courier company');
      const charge = form.deliveryCharge === '' ? 0 : num(form.deliveryCharge);
      if (charge < 0) return toast.error('Delivery charge cannot be negative');
      const clash = form.consignmentId
        ? rows.find(
            r =>
              r.id !== row.id &&
              r.consignment === form.consignmentId &&
              r.courier === form.courier,
          )
        : null;
      if (clash)
        return toast.error(
          `Consignment ID is already used by order ${clash.id}`,
        );
      const entry = {
        at: new Date().toISOString(),
        by: actor,
        courier: form.courier,
        consignmentId: form.consignmentId,
        trackingId: form.trackingId,
        courierStatus: form.courierStatus,
      };
      writeMeta(
        row.id,
        {
          courier: form.courier,
          consignmentId: form.consignmentId,
          trackingId: form.trackingId,
          shipDate: form.shipDate,
          eta: form.eta,
          deliveryCharge: charge,
          courierStatus: form.courierStatus,
          recipientName: form.recipientName,
          recipientPhone: form.recipientPhone,
          shipAddress: form.shipAddress,
          shipmentHistory: [...(row.m.shipmentHistory || []), entry],
        },
        {
          key: 'ship:save',
          label: 'Shipment details saved (manual)',
          note: `${form.courier}${form.consignmentId ? ` · ${form.consignmentId}` : ''}`,
        },
        `Shipment details saved — ${form.courier}`,
      );
      toast.success('Shipment details saved.');
    },
    saveFailed: (row, form) => {
      if (!form.reason.trim()) return toast.error('Enter the failure reason');
      const attempts = row.m.attempts || [];
      const attempt = {
        n: attempts.length + 1,
        ...form,
        reason: form.reason.trim(),
        by: actor,
        at: new Date().toISOString(),
      };
      report(
        coreMoveDelivery(
          row,
          'delivery_failed',
          `Attempt ${attempt.n}: ${attempt.reason}`,
          { attempts: [...attempts, attempt] },
        ),
      );
    },
    startReturn: (row, reason, items) => {
      if (!reason.trim()) return toast.error('Enter the return reason');
      const info = {
        reason: reason.trim(),
        items,
        status: 'pending_inspection',
        inspected: false,
        refund: 0,
        startedBy: actor,
        startedAt: new Date().toISOString(),
      };
      report(
        coreMoveDelivery(row, 'returned', reason.trim(), { returnInfo: info }),
      );
    },
    saveInspection: (row, items) => {
      const info = row.m.returnInfo;
      if (!info) return;
      writeMeta(
        row.id,
        { returnInfo: { ...info, items, inspected: true } },
        {
          key: 'r:inspected',
          label: 'Returned books inspected',
          note: `${items.reduce((s, i) => s + num(i.returnedQty), 0)} copies`,
        },
        'Return inspection saved',
      );
      toast.success('Inspection saved.');
    },
    decideReturn: (row, decision, { refund, note }) => {
      const info = row.m.returnInfo;
      if (!info || info.status !== 'pending_inspection')
        return toast.error('This return is already decided');
      if (decision === 'approved' && !info.inspected)
        return toast.error('Save the inspection first');
      const amount = decision === 'approved' ? Math.max(0, num(refund)) : 0;
      if (amount > row.paid)
        return toast.error('Refund cannot exceed the amount paid');
      const patch = {
        returnInfo: {
          ...info,
          status: decision,
          refund: amount,
          decisionNote: note,
          decidedBy: actor,
          decidedAt: new Date().toISOString(),
          stockUpdated: false,
        },
      };
      if (amount > 0) {
        patch.paymentStatus =
          amount >= row.paid ? 'refunded' : 'partially_refunded';
        patch.paidAmount = row.paid;
      }
      writeMeta(
        row.id,
        patch,
        {
          key: `r:${decision}`,
          label:
            decision === 'approved' ? 'Return approved' : 'Return rejected',
          note: [amount > 0 ? `Refund ৳${amount}` : '', note]
            .filter(Boolean)
            .join(' · '),
        },
        `Return ${decision}`,
      );
      toast.success(
        decision === 'approved' ? 'Return approved.' : 'Return rejected.',
      );
    },
  };

  /* ----- summary cards ----- */
  const QUICK = {
    all: () => true,
    new: r => r.orderStatus === 'new',
    pending: r => r.orderStatus === 'approved',
    processing: r => r.orderStatus === 'approved',
    ready: r => r.orderStatus === 'approved',
    transit: r => r.orderStatus === 'shipping',
    deliveredToday: r =>
      r.orderStatus === 'delivered' && r.deliveredDay === today,
    cancelled: r => r.orderStatus === 'cancelled',
    failed: r => r.deliveryStatus === 'delivery_failed',
    returned: r => r.deliveryStatus === 'returned',
    cod: r =>
      r.cod > 0 &&
      r.orderStatus !== 'cancelled' &&
      r.deliveryStatus !== 'returned',
  };

  const trend = id => {
    const test = QUICK[id];
    const curFrom = shiftDay(today, -6);
    const prevFrom = shiftDay(today, -13);
    const prevTo = shiftDay(today, -7);
    const cur = rows.filter(
      r => test(r) && r.day >= curFrom && r.day <= today,
    ).length;
    const prev = rows.filter(
      r => test(r) && r.day >= prevFrom && r.day <= prevTo,
    ).length;
    return { cur, prev };
  };

  const cards = [
    {
      id: 'all',
      label: 'Total Orders',
      icon: FiShoppingBag,
      value: rows.length,
      trend: true,
    },
    {
      id: 'new',
      label: 'New Orders',
      icon: FiInbox,
      value: rows.filter(QUICK.new).length,
      trend: true,
    },
    {
      id: 'pending',
      label: 'Pending Orders',
      icon: FiClock,
      value: rows.filter(QUICK.pending).length,
    },
    {
      id: 'processing',
      label: 'Processing',
      icon: FiPackage,
      value: rows.filter(QUICK.processing).length,
    },
    {
      id: 'ready',
      label: 'Ready to Ship',
      icon: FiSend,
      value: rows.filter(QUICK.ready).length,
    },
    {
      id: 'transit',
      label: 'In Transit',
      icon: FiTruck,
      value: rows.filter(QUICK.transit).length,
    },
    {
      id: 'deliveredToday',
      label: 'Delivered Today',
      icon: FiCheckCircle,
      value: rows.filter(QUICK.deliveredToday).length,
    },
    {
      id: 'cancelled',
      label: 'Cancelled',
      icon: FiXCircle,
      value: rows.filter(QUICK.cancelled).length,
    },
    {
      id: 'failed',
      label: 'Failed Deliveries',
      icon: FiAlertTriangle,
      value: rows.filter(QUICK.failed).length,
    },
    {
      id: 'returned',
      label: 'Returned Orders',
      icon: FiRotateCcw,
      value: rows.filter(QUICK.returned).length,
    },
    {
      id: 'cod',
      label: 'COD Pending',
      icon: FiDollarSign,
      value: formatCurrency(
        rows.filter(QUICK.cod).reduce((s, r) => s + r.cod, 0),
      ),
    },
  ];

  /* ----- filtering / sorting / paging ----- */
  const setFilter = key => value =>
    setFilters(prev => ({ ...prev, [key]: value }));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = rows.filter(r => {
      if (!QUICK[quick](r)) return false;
      if (filters.channel && r.channel !== filters.channel) return false;
      if (filters.orderStatus && r.orderStatus !== filters.orderStatus)
        return false;
      if (filters.delivery && r.deliveryStatus !== filters.delivery)
        return false;
      if (filters.payment && r.paymentMethod !== filters.payment) return false;
      if (filters.courier && r.courier !== filters.courier) return false;
      if (filters.district && r.district !== filters.district) return false;
      if (filters.staff && r.staff !== filters.staff) return false;
      if (filters.from && r.day < filters.from) return false;
      if (filters.to && r.day > filters.to) return false;
      return !q || r.haystack.includes(q);
    });
    const valueOf = r => {
      switch (sort.key) {
        case 'id':
          return String(r.id);
        case 'customer':
          return String(
            r.order.shopName || r.order.customerName || '',
          ).toLowerCase();
        case 'items':
          return r.copies;
        case 'amount':
          return r.payable;
        case 'netProfit':
          return r.netProfit;
        default:
          return r.ts;
      }
    };
    return [...list].sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) {
        return a.pinned ? -1 : 1;
      }
      const x = valueOf(a);
      const y = valueOf(b);
      const res = x < y ? -1 : x > y ? 1 : 0;
      return sort.dir === 'asc' ? res : -res;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, quick, filters, search, sort, today]);

  useEffect(() => setPage(1), [quick, filters, search, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);
  const cols = COLUMNS;

  const activeFilterCount = [
    filters.orderStatus,
    filters.delivery,
    filters.payment,
  ].filter(Boolean).length;
  const hasFilters = Boolean(
    search || quick !== 'all' || Object.values(filters).some(Boolean),
  );
  const clearAll = () => {
    setSearch('');
    setQuick('all');
    setFilters(EMPTY_FILTERS);
  };

  const toggleSort = key =>
    setSort(prev =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'date' || key === 'amount' ? 'desc' : 'asc' },
    );

  /* ----- selection ----- */
  const selectedRows = rows.filter(r => selected.has(r.id));
  const pageAllSelected =
    pageRows.length > 0 && pageRows.every(r => selected.has(r.id));
  const toggleRow = id =>
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const togglePage = () =>
    setSelected(prev => {
      const next = new Set(prev);
      pageRows.forEach(r =>
        pageAllSelected ? next.delete(r.id) : next.add(r.id),
      );
      return next;
    });

  /* ----- bulk definitions ----- */
  const notCancelled = r =>
    r.orderStatus === 'cancelled' ? 'Order is cancelled' : null;
  const BULK = [
    {
      id: 'approve',
      label: 'Approve orders',
      check: r => canOrderMove(r, 'approved'),
      apply: r => coreMoveOrder(r, 'approved'),
    },
    {
      id: 'shipping',
      label: 'Move to Shipping',
      check: r => canOrderMove(r, 'shipping'),
      apply: r => coreMoveOrder(r, 'shipping', 'Handed over to courier'),
    },
    {
      id: 'delivered',
      label: 'Mark Delivered',
      check: r => canOrderMove(r, 'delivered'),
      apply: r => coreMoveOrder(r, 'delivered'),
    },
    {
      id: 'staff',
      label: 'Assign staff',
      value: 'staff',
      check: r => notCancelled(r),
      apply: (r, v) => {
        writeMeta(
          r.id,
          { assignedStaff: v },
          { key: 'staff', label: 'Staff assigned', note: v },
          `Assigned to ${v}`,
        );
        return { ok: true };
      },
    },
    {
      id: 'courier',
      label: 'Assign courier',
      value: 'courier',
      check: r => (r.isCounter ? 'Counter sale' : notCancelled(r)),
      apply: (r, v) => {
        writeMeta(
          r.id,
          { courier: v },
          { key: 'courier', label: 'Courier assigned', note: v },
          `Courier → ${v}`,
        );
        return { ok: true };
      },
    },
    {
      id: 'cancel',
      label: 'Cancel orders',
      danger: true,
      check: r => canOrderMove(r, 'cancelled'),
      apply: (r, v, note) => coreMoveOrder(r, 'cancelled', note),
    },
  ];

  const runBulk = def => {
    setBulkMenu(false);
    if (selectedRows.length === 0)
      return toast.error('Select at least one order');
    setBulkDef(def);
  };

  const detailRow = rows.find(r => r.id === detailId) ?? null;

  const togglePin = row => {
    const nextPinned = !row.pinned;
    writeMeta(
      row.id,
      { pinned: nextPinned },
      null,
      nextPinned ? 'Order pinned' : 'Order unpinned',
    );
    toast.success(nextPinned ? 'Order pinned' : 'Order unpinned');
  };

  /* ----- cell rendering ----- */
  const renderCell = (id, r) => {
    switch (id) {
      case 'id':
        return (
          <span className="whitespace-nowrap font-semibold text-slate-800">
            {r.id}
          </span>
        );
      case 'channel':
        return (
          <span className="inline-block whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            {labelOf(CHANNELS, r.channel)}
          </span>
        );
      case 'customer':
        return (
          <span className="block max-w-[180px] truncate whitespace-nowrap font-medium text-slate-800">
            {r.order.shopName || r.order.customerName}
          </span>
        );
      case 'phone':
        return (
          <span className="whitespace-nowrap text-slate-600">
            {toEnglishDigits(r.order.phone) || '—'}
          </span>
        );
      case 'items':
        return (
          <span className="whitespace-nowrap text-slate-600">
            {r.uniqueBooks} books · {r.copies} copies
          </span>
        );
      case 'amount':
        return (
          <span className="whitespace-nowrap font-semibold text-slate-900">
            {formatCurrency(r.payable)}
          </span>
        );
      case 'charge':
        return (
          <span className="whitespace-nowrap text-slate-600">
            {formatCurrency(r.charge)}
          </span>
        );
      case 'netProfit':
        return (
          <span
            className={`whitespace-nowrap font-semibold ${
              r.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            {formatCurrency(r.netProfit)}
          </span>
        );
      case 'payment':
        return <Pill list={PAYMENT_METHODS} value={r.paymentMethod} />;
      case 'orderStatus':
        return <Pill list={ORDER_STATUSES} value={r.orderStatus} />;
      case 'delivery':
        return r.isCounter ? (
          <span className="whitespace-nowrap text-xs text-slate-400">
            Counter handover
          </span>
        ) : (
          <Pill list={DELIVERY_STATUSES} value={r.deliveryStatus} />
        );
      case 'date':
        return (
          <span className="whitespace-nowrap text-slate-600">
            {fmtDate(r.order.date)}
          </span>
        );
      case 'courier':
        return (
          <span className="whitespace-nowrap text-slate-600">
            {r.courier || '—'}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div data-no-translate="true">
      <PageHeader
        title="Online Orders"
        description="Manage website orders, invoices, printing, and courier status."
      />

      {/* Summary cards */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {cards.map(card => {
          const Icon = card.icon;
          const t = card.trend ? trend(card.id) : null;
          const pct =
            t && t.prev > 0
              ? Math.round(((t.cur - t.prev) / t.prev) * 100)
              : null;
          const active = quick === card.id;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() =>
                setQuick(active && card.id !== 'all' ? 'all' : card.id)
              }
              aria-pressed={active}
              className={`rounded-xl border bg-white p-3.5 text-left transition hover:border-blue-300 ${active ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200'}`}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Icon size={15} />
              </span>
              <p className="mt-2 text-xs text-slate-500">{card.label}</p>
              <p className="truncate text-lg font-bold text-slate-900">
                {card.value}
              </p>
              {t && (
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {t.cur} in last 7 days
                  {pct !== null && (
                    <span
                      className={
                        pct >= 0 ? ' text-emerald-600' : ' text-rose-600'
                      }
                    >{` · ${pct >= 0 ? '+' : ''}${pct}%`}</span>
                  )}
                </p>
              )}
            </button>
          );
        })}
      </div>

      <section className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <h2 className="font-heading text-base font-bold text-slate-900 sm:text-lg">
            Delivery Activities
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Track orders from placement to delivery, returns and refunds
          </p>
        </div>

        {/* Toolbar */}
        <div className="space-y-3 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
              <FiSearch
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Order ID, customer, shop, phone, tracking or consignment ID..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-blue-500"
              />
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setFilterMenu(o => !o)}
                className={`${btnOutline} !py-1.5`}
              >
                <FiSliders size={14} /> Filters
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              {filterMenu && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setFilterMenu(false)}
                  />
                  <div className="absolute right-0 z-30 mt-1 w-64 space-y-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-lg">
                    <Field label="Order Status">
                      <FilterSelect
                        label="Order Status"
                        value={filters.orderStatus}
                        onChange={setFilter('orderStatus')}
                        options={ORDER_STATUSES}
                      />
                    </Field>
                    <Field label="Delivery Status">
                      <FilterSelect
                        label="Delivery Status"
                        value={filters.delivery}
                        onChange={setFilter('delivery')}
                        options={DELIVERY_STATUSES}
                      />
                    </Field>
                    <Field label="Payment">
                      <FilterSelect
                        label="Payment"
                        value={filters.payment}
                        onChange={setFilter('payment')}
                        options={PAYMENT_METHODS}
                      />
                    </Field>
                    {activeFilterCount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilters(prev => ({
                            ...prev,
                            orderStatus: '',
                            delivery: '',
                            payment: '',
                          }));
                          setFilterMenu(false);
                        }}
                        className="w-full rounded-lg border border-slate-200 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                downloadCsv(selectedRows.length ? selectedRows : filtered)
              }
              className={`${btnOutline} !py-1.5`}
            >
              <FiDownload size={14} /> Export{' '}
              {selectedRows.length ? 'selected' : 'CSV'}
            </button>
            <button
              type="button"
              onClick={() =>
                openPrint(
                  reportHtml(
                    filtered,
                    hasFilters ? 'Filtered view' : 'All orders',
                  ),
                  'Orders report',
                )
              }
              className={`${btnOutline} !py-1.5`}
            >
              <FiPrinter size={14} /> Print report
            </button>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-slate-500">
                From
              </span>
              <input
                type="date"
                value={filters.from}
                max={filters.to || undefined}
                onChange={e => setFilter('from')(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500"
              />
            </label>
            <span className="pb-2 text-sm text-slate-400">to</span>
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-slate-500">
                To
              </span>
              <input
                type="date"
                value={filters.to}
                min={filters.from || undefined}
                onChange={e => setFilter('to')(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500"
              />
            </label>
            {[
              ['Today', today, today],
              ['Last 7 days', shiftDay(today, -6), today],
              ['Last 30 days', shiftDay(today, -29), today],
            ].map(([label, from, to]) => (
              <button
                key={label}
                type="button"
                onClick={() => setFilters(prev => ({ ...prev, from, to }))}
                className={`h-9 rounded-lg px-3 text-xs font-semibold transition ${
                  filters.from === from && filters.to === to
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ))}
            {hasFilters && (
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex h-9 items-center gap-1 rounded-lg px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50"
              >
                <FiX size={13} /> Clear all
              </button>
            )}
          </div>

          {selectedRows.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-2.5 text-sm text-slate-700">
              <span>
                <b>{selectedRows.length}</b> selected
                {pageAllSelected &&
                  filtered.length > pageRows.length &&
                  selectedRows.length < filtered.length && (
                    <button
                      type="button"
                      onClick={() =>
                        setSelected(new Set(filtered.map(r => r.id)))
                      }
                      className="ml-2 font-semibold text-blue-700 underline"
                    >
                      Select all {filtered.length}
                    </button>
                  )}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setBulkMenu(o => !o)}
                    className={`${btnPrimary} !py-1.5`}
                  >
                    Bulk actions{' '}
                    {bulkMenu ? (
                      <FiChevronUp size={14} />
                    ) : (
                      <FiChevronDown size={14} />
                    )}
                  </button>
                  {bulkMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-20"
                        onClick={() => setBulkMenu(false)}
                      />
                      <div className="absolute right-0 z-30 mt-1 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                        {BULK.map(def => (
                          <button
                            key={def.id}
                            type="button"
                            onClick={() => runBulk(def)}
                            className={`block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50 ${def.danger ? 'text-red-600' : 'text-slate-700'}`}
                          >
                            {def.label}
                          </button>
                        ))}
                        <div className="my-1 border-t border-slate-100" />
                        <button
                          type="button"
                          onClick={() => {
                            setBulkMenu(false);
                            api.printInvoices(selectedRows);
                          }}
                          className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                          Print invoices
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setBulkMenu(false);
                            api.printLabels(selectedRows);
                          }}
                          className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                          Print shipping labels
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  className={`${btnOutline} !py-1.5`}
                >
                  Clear selection
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50/70 text-xs font-medium text-slate-500">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select page"
                    checked={pageAllSelected}
                    onChange={togglePage}
                  />
                </th>
                {cols.map(c => (
                  <th
                    key={c.id}
                    className={`whitespace-nowrap px-4 py-3 ${
                      c.align === 'center'
                        ? 'text-center'
                        : c.align === 'right'
                          ? 'text-right'
                          : 'text-left'
                    }`}
                  >
                    {c.sort ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(c.sort)}
                        className={`inline-flex items-center gap-1 hover:text-slate-800 ${
                          c.align === 'center' ? 'justify-center' : ''
                        }`}
                      >
                        {c.label}
                        <span className="flex flex-col leading-none">
                          <FiChevronUp
                            size={10}
                            className={
                              sort.key === c.sort && sort.dir === 'asc'
                                ? 'text-slate-800'
                                : 'text-slate-300'
                            }
                          />
                          <FiChevronDown
                            size={10}
                            className={
                              sort.key === c.sort && sort.dir === 'desc'
                                ? 'text-slate-800'
                                : 'text-slate-300'
                            }
                          />
                        </span>
                      </button>
                    ) : (
                      c.label
                    )}
                  </th>
                ))}
                <th className="whitespace-nowrap px-4 py-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageRows.map(r => (
                <tr
                  key={r.id}
                  onClick={() => setDetailId(r.id)}
                  className={`cursor-pointer text-sm transition ${
                    r.pinned
                      ? 'bg-amber-50/85 hover:bg-amber-100/75'
                      : 'bg-white hover:bg-slate-50/70'
                  }`}
                >
                  <td
                    className={`whitespace-nowrap px-4 py-3 ${
                      r.pinned ? 'border-l-4 border-l-amber-400' : ''
                    }`}
                    onClick={e => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      aria-label={`Select ${r.id}`}
                      checked={selected.has(r.id)}
                      onChange={() => toggleRow(r.id)}
                    />
                  </td>
                  {cols.map(c => (
                    <td
                      key={c.id}
                      className={`whitespace-nowrap px-4 py-3 ${
                        c.align === 'center'
                          ? 'text-center'
                          : c.align === 'right'
                            ? 'text-right'
                            : 'text-left'
                      }`}
                    >
                      {renderCell(c.id, r)}
                    </td>
                  ))}
                  <td
                    className="whitespace-nowrap px-4 py-3"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                      <button
                        type="button"
                        title={r.pinned ? 'Unpin order' : 'Pin order'}
                        aria-label={r.pinned ? 'Unpin order' : 'Pin order'}
                        onClick={() => togglePin(r)}
                        className={`rounded-lg p-1.5 transition ${
                          r.pinned
                            ? 'text-amber-600 hover:bg-amber-200/60'
                            : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                        }`}
                      >
                        <FiBookmark
                          size={14}
                          className={r.pinned ? 'fill-current' : ''}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDetailId(r.id)}
                        className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
                      >
                        <FiEye size={13} /> View
                      </button>
                      <button
                        type="button"
                        title={
                          r.printed
                            ? 'Printed — Click to print again'
                            : 'Unprinted — Print invoice'
                        }
                        aria-label="Print invoice"
                        onClick={() => api.printInvoices([r])}
                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition ${
                          r.printed
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                        }`}
                      >
                        <FiPrinter size={13} />
                        <span>{r.printed ? 'Printed' : 'Print'}</span>
                      </button>
                      {!r.isCounter && (
                        <button
                          type="button"
                          title="Print shipping label"
                          aria-label="Print shipping label"
                          onClick={() => api.printLabels([r])}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <FiTag size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pageRows.length === 0 && (
            <p className="py-12 text-center text-sm text-slate-400">
              {rows.length === 0
                ? 'No orders yet.'
                : 'No orders match the current filters.'}
            </p>
          )}
        </div>

        {/* Shared Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZES}
          itemLabel="orders"
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </section>

      {detailRow && (
        <OrderDetailsModal
          row={detailRow}
          rows={rows}
          books={books}
          staffOptions={staffOptions}
          api={api}
          onClose={() => setDetailId(null)}
        />
      )}

      {bulkDef && (
        <BulkDialog
          def={bulkDef}
          selected={selectedRows}
          staffOptions={staffOptions}
          api={api}
          onCancel={() => setBulkDef(null)}
          onDone={() => {
            setBulkDef(null);
            setSelected(new Set());
          }}
        />
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          confirmLabel={confirm.confirmLabel}
          danger={confirm.danger}
          withNote={confirm.withNote}
          onCancel={() => setConfirm(null)}
          onConfirm={note => {
            const action = confirm.onConfirm;
            setConfirm(null);
            action(note);
          }}
        >
          <p>{confirm.body}</p>
        </ConfirmDialog>
      )}
    </div>
  );
}

export default Orders;
