import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiColumns,
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
  FiTag,
  FiTruck,
  FiX,
  FiXCircle,
} from 'react-icons/fi';
import PageHeader from '../../../components/dashboard/PageHeader';
import { useAuth } from '../../../context/useAuth';
import { useData } from '../../../context/useData';
import { formatCurrency } from '../../../utils/format';
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

const ORDER_STATUSES = [
  { value: 'new', label: 'New', tone: 'indigo' },
  { value: 'confirmed', label: 'Confirmed', tone: 'blue' },
  { value: 'processing', label: 'Processing', tone: 'amber' },
  { value: 'completed', label: 'Completed', tone: 'emerald' },
  { value: 'cancelled', label: 'Cancelled', tone: 'slate' },
];

const PAYMENT_STATUSES = [
  { value: 'unpaid', label: 'Unpaid', tone: 'rose' },
  { value: 'paid', label: 'Paid', tone: 'emerald' },
  { value: 'partial', label: 'Partially Paid', tone: 'amber' },
  { value: 'refunded', label: 'Refunded', tone: 'violet' },
  { value: 'partially_refunded', label: 'Partially Refunded', tone: 'orange' },
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

/* Valid status transitions. Each status is managed independently. */
const ORDER_FLOW = {
  new: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['completed', 'cancelled'],
  completed: [],
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
  confirmed: 'Order confirmed',
  processing: 'Processing started',
  completed: 'Order completed',
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
  { id: 'channel', label: 'Channel', show: true },
  { id: 'customer', label: 'Customer / Shop', sort: 'customer', show: true },
  { id: 'phone', label: 'Phone', show: false },
  { id: 'items', label: 'Items', sort: 'items', show: true },
  {
    id: 'amount',
    label: 'Order Amount',
    sort: 'amount',
    align: 'right',
    show: true,
  },
  { id: 'charge', label: 'Delivery Charge', align: 'right', show: false },
  { id: 'payment', label: 'Payment', show: true },
  { id: 'orderStatus', label: 'Order Status', show: true },
  { id: 'delivery', label: 'Delivery Status', show: true },
  { id: 'date', label: 'Order Date', sort: 'date', show: true },
  { id: 'courier', label: 'Courier', show: true },
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

/* Combines the order from useData() with the extra fulfillment details kept locally. */
function buildRow(order, m = {}) {
  const ctx = String(order.status || 'new').toLowerCase();
  const isCounter = order.orderType === 'counter' || Boolean(order.shopName);
  const pay = String(order.paymentStatus || '').toLowerCase();
  const items = order.items || [];

  const orderStatus =
    ctx === 'cancelled'
      ? 'cancelled'
      : (m.orderStatus ??
        (ctx === 'delivered'
          ? 'completed'
          : ctx === 'new'
            ? 'new'
            : 'processing'));

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
    isCounter,
    channel,
    orderStatus,
    deliveryStatus,
    paymentStatus,
    courier: m.courier || order.courier || '',
    tracking: m.trackingId || order.trackingId || '',
    consignment: m.consignmentId || order.consignmentId || '',
    staff: m.assignedStaff || order.assignedStaff || '',
    district,
    charge,
    payable,
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
  if (to === 'completed' && row.deliveryStatus !== 'delivered')
    return 'Delivery must be Delivered first';
  if (
    to === 'cancelled' &&
    !['not_dispatched', 'ready_to_ship'].includes(row.deliveryStatus)
  )
    return 'Already shipped — use the return process';
  return null;
}

function canDeliveryMove(row, to) {
  if (row.isCounter) return 'Counter sales have no delivery workflow';
  if (row.orderStatus === 'cancelled') return 'Order is cancelled';
  if (!DELIVERY_FLOW[row.deliveryStatus]?.includes(to))
    return 'Not a valid next step from the current status';
  if (to === 'ready_to_ship' && row.orderStatus !== 'processing')
    return 'Order must be in Processing first';
  if (to === 'shipped' && !row.courier) return 'Assign a courier first';
  return null;
}

/* Status kept in the existing useData() order record (new / processing / shipped / delivered / cancelled). */
const contextOrderTarget = to =>
  to === 'cancelled' ? 'cancelled' : to === 'processing' ? 'processing' : null;
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

function ShippingTab({ row, api }) {
  const m = row.m;
  const o = row.order;
  const [form, setForm] = useState({
    courier: row.courier || '',
    consignmentId: row.consignment || '',
    trackingId: row.tracking || '',
    shipDate: m.shipDate || '',
    eta: m.eta || '',
    deliveryCharge: String(row.charge || ''),
    courierStatus: m.courierStatus || '',
    recipientName: m.recipientName || o.customerName || o.shopName || '',
    recipientPhone: m.recipientPhone || o.phone || '',
    shipAddress: m.shipAddress || o.address || '',
  });
  const set = key => value => setForm(prev => ({ ...prev, [key]: value }));
  const attempts = m.attempts || [];
  const history = m.shipmentHistory || [];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        <FiAlertTriangle className="mt-0.5 shrink-0" size={14} />
        <p>
          Courier API is not connected. Shipments are recorded <b>manually</b>{' '}
          here — nothing is booked with Pathao, Steadfast or RedX from this
          screen. Enter the consignment ID after booking on the courier&apos;s
          own panel.
        </p>
      </div>

      <Section
        title="Shipping information"
        right={
          <button
            type="button"
            onClick={() => api.printLabels([row])}
            className={btnOutline}
          >
            <FiTag size={14} /> Print label
          </button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Courier company">
            <select
              value={form.courier}
              onChange={e => set('courier')(e.target.value)}
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
            value={form.consignmentId}
            onChange={set('consignmentId')}
          />
          <TextInput
            label="Tracking ID"
            value={form.trackingId}
            onChange={set('trackingId')}
          />
          <TextInput
            label="Shipment date"
            type="date"
            value={form.shipDate}
            onChange={set('shipDate')}
          />
          <TextInput
            label="Estimated delivery date"
            type="date"
            value={form.eta}
            onChange={set('eta')}
          />
          <TextInput
            label="Delivery charge (৳)"
            type="number"
            min="0"
            value={form.deliveryCharge}
            onChange={set('deliveryCharge')}
          />
          <TextInput
            label="Recipient name"
            value={form.recipientName}
            onChange={set('recipientName')}
          />
          <TextInput
            label="Recipient phone"
            value={form.recipientPhone}
            onChange={set('recipientPhone')}
          />
          <TextInput
            label="Latest courier status"
            value={form.courierStatus}
            onChange={set('courierStatus')}
            placeholder="e.g. Picked up"
          />
          <div className="sm:col-span-2 lg:col-span-3">
            <TextInput
              label="Shipping address"
              value={form.shipAddress}
              onChange={set('shipAddress')}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-500">
            Delivery attempts: <b>{attempts.length}</b>
            {row.consignment &&
              ' · A consignment ID is already stored for this order (saving updates it).'}
          </p>
          <button
            type="button"
            onClick={() => api.saveShipment(row, form)}
            className={btnPrimary}
          >
            <FiSend size={14} /> Save shipment details
          </button>
        </div>
      </Section>

      <Section title="Shipment history">
        {history.length === 0 ? (
          <p className="text-sm text-slate-400">No shipment records yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {[...history].reverse().map((h, i) => (
              <li
                key={i}
                className="flex flex-wrap items-center justify-between gap-2 py-2"
              >
                <span className="font-medium text-slate-800">
                  {h.courier || '—'} · {h.consignmentId || 'no consignment ID'}
                  {h.courierStatus && ` · ${h.courierStatus}`}
                </span>
                <span className="text-xs text-slate-500">
                  {fmtDateTime(h.at)} · {h.by}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

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
  const [tab, setTab] = useState('overview');
  const { order, m } = row;

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
      label: 'Order placed',
      at: order.date,
      by: order.servedBy || 'Customer',
      note: '',
    },
    ...(m.timeline || []),
  ];
  const lastUpdated = timeline[timeline.length - 1]?.at ?? order.date;
  const audit = api.audit.filter(a => a.orderId === row.id);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    ...(row.isCounter
      ? []
      : [
          { id: 'shipping', label: 'Shipping & courier' },
          { id: 'issues', label: 'Failed delivery & returns' },
        ]),
    { id: 'timeline', label: 'Timeline' },
  ];

  const nextOrder = (ORDER_FLOW[row.orderStatus] || []).filter(
    s => s !== 'cancelled',
  );
  const nextDelivery = row.isCounter
    ? []
    : DELIVERY_FLOW[row.deliveryStatus] || [];
  const cancelReason = canOrderMove(row, 'cancelled');

  const askCancel = () =>
    api.askConfirm({
      title: `Cancel order ${row.id}?`,
      body: 'The order will be cancelled and this is recorded in the timeline. Refunds, if any, are handled separately.',
      confirmLabel: 'Cancel order',
      danger: true,
      withNote: true,
      onConfirm: note => api.moveOrder(row, 'cancelled', note),
    });

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-dark/70 px-3 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Order ${row.id}`}
        onClick={e => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-slate-50 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white p-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-primary-hover">
              Order details
            </p>
            <h2 className="mt-0.5 font-heading text-2xl font-bold text-dark">
              {row.id}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Pill list={ORDER_STATUSES} value={row.orderStatus} />
              <Pill list={PAYMENT_STATUSES} value={row.paymentStatus} />
              {row.deliveryStatus && (
                <Pill list={DELIVERY_STATUSES} value={row.deliveryStatus} />
              )}
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                {labelOf(CHANNELS, row.channel)}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => api.printInvoices([row])}
              className={btnOutline}
            >
              <FiPrinter size={14} /> Invoice
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        <div
          role="tablist"
          className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-4"
        >
          {tabs.map(t => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
                tab === t.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="space-y-4 overflow-y-auto p-5">
          {tab === 'overview' && (
            <>
              <Section title="Order overview">
                <InfoGrid
                  items={[
                    ['Order ID', row.id],
                    ['Order date & time', fmtDateTime(order.date)],
                    ['Last updated', fmtDateTime(lastUpdated)],
                    ['Sales channel', labelOf(CHANNELS, row.channel)],
                    ['Assigned staff', row.staff],
                    ['Served by', order.servedBy],
                  ]}
                />
                {!row.isCounter && (
                  <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
                    <Field label="Change sales channel">
                      <select
                        value={row.channel}
                        onChange={e =>
                          api.setMeta(
                            row,
                            { channel: e.target.value },
                            `Channel → ${e.target.value}`,
                          )
                        }
                        className={inputCls}
                      >
                        {CHANNELS.filter(c => c.value !== 'counter').map(c => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Assigned staff">
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
                  </div>
                )}
              </Section>

              {row.isCounter ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  This is a counter sale. It is handed over at the showroom, so
                  the courier and delivery workflow does not apply.
                </div>
              ) : (
                <Section title="Status management">
                  <div className="grid gap-5 lg:grid-cols-3">
                    <div>
                      <p className="mb-2 text-xs font-semibold text-slate-500">
                        Order status
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {nextOrder.length === 0 && (
                          <span className="text-sm text-slate-400">
                            No further steps
                          </span>
                        )}
                        {nextOrder.map(s => {
                          const why = canOrderMove(row, s);
                          return (
                            <button
                              key={s}
                              type="button"
                              disabled={Boolean(why)}
                              title={why || ''}
                              onClick={() => api.moveOrder(row, s)}
                              className={btnOutline}
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
                            className={btnDanger}
                          >
                            Cancel order
                          </button>
                        )}
                      </div>
                      {nextOrder.map(s => {
                        const why = canOrderMove(row, s);
                        return why ? (
                          <p
                            key={s}
                            className="mt-1.5 text-[11px] text-slate-400"
                          >
                            {labelOf(ORDER_STATUSES, s)}: {why}
                          </p>
                        ) : null;
                      })}
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-semibold text-slate-500">
                        Delivery status
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {nextDelivery.length === 0 && (
                          <span className="text-sm text-slate-400">
                            No further steps
                          </span>
                        )}
                        {nextDelivery.map(s => {
                          const why = canDeliveryMove(row, s);
                          const viaForm =
                            s === 'delivery_failed' || s === 'returned';
                          return (
                            <button
                              key={s}
                              type="button"
                              disabled={Boolean(why)}
                              title={
                                why ||
                                (viaForm
                                  ? 'Handled in the Failed delivery & returns tab'
                                  : '')
                              }
                              onClick={() =>
                                viaForm
                                  ? setTab('issues')
                                  : api.moveDelivery(row, s)
                              }
                              className={btnOutline}
                            >
                              → {labelOf(DELIVERY_STATUSES, s)}
                            </button>
                          );
                        })}
                      </div>
                      {nextDelivery.map(s => {
                        const why = canDeliveryMove(row, s);
                        return why ? (
                          <p
                            key={s}
                            className="mt-1.5 text-[11px] text-slate-400"
                          >
                            {labelOf(DELIVERY_STATUSES, s)}: {why}
                          </p>
                        ) : null;
                      })}
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-semibold text-slate-500">
                        Payment
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {order.paymentMethod !== 'cod' &&
                          row.paymentStatus === 'unpaid' && (
                            <button
                              type="button"
                              onClick={() => api.verifyPayment(row)}
                              className={`${btnBase} bg-emerald-600 text-white hover:bg-emerald-700`}
                            >
                              Payment verified
                            </button>
                          )}
                        {order.paymentMethod === 'cod' &&
                          row.deliveryStatus === 'delivered' &&
                          ['unpaid', 'partial'].includes(row.paymentStatus) && (
                            <button
                              type="button"
                              onClick={() => api.markCod(row)}
                              className={`${btnBase} bg-emerald-600 text-white hover:bg-emerald-700`}
                            >
                              COD collected
                            </button>
                          )}
                        {!(
                          (order.paymentMethod !== 'cod' &&
                            row.paymentStatus === 'unpaid') ||
                          (order.paymentMethod === 'cod' &&
                            row.deliveryStatus === 'delivered' &&
                            ['unpaid', 'partial'].includes(row.paymentStatus))
                        ) && (
                          <span className="text-sm text-slate-400">
                            No payment action needed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Section>
              )}

              <Section title="Customer information">
                <InfoGrid
                  items={[
                    [
                      row.isCounter ? 'Shop' : 'Customer name',
                      order.shopName || order.customerName,
                    ],
                    ['Phone number', order.phone],
                    [
                      'Alternative phone',
                      order.altPhone || order.alternativePhone,
                    ],
                    ['Email', order.email],
                    [
                      'Full address',
                      order.address || (row.isCounter ? 'Showroom' : ''),
                    ],
                    ['District', row.district],
                    ['Area / Thana', order.area || order.thana],
                    [
                      'Delivery instructions',
                      order.deliveryInstructions || order.note || order.notes,
                    ],
                    ['Previous orders', String(previousOrders)],
                    ...(order.commission > 0
                      ? [['Commission', `${order.commission}%`]]
                      : []),
                  ]}
                />
              </Section>

              <Section
                title={`Book items — ${row.uniqueBooks} books, ${row.copies} copies`}
              >
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs text-slate-500">
                        <th className="py-2 pr-3 font-medium">Book</th>
                        <th className="py-2 pr-3 font-medium">SKU / ISBN</th>
                        <th className="py-2 pr-3 text-right font-medium">
                          Qty
                        </th>
                        <th className="py-2 pr-3 text-right font-medium">
                          Unit price
                        </th>
                        <th className="py-2 text-right font-medium">
                          Subtotal
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
                        return (
                          <tr key={item.bookId ?? idx}>
                            <td className="py-2.5 pr-3">
                              <div className="flex items-center gap-3">
                                {cover ? (
                                  <img
                                    src={cover}
                                    alt=""
                                    className="h-12 w-9 shrink-0 rounded object-cover"
                                  />
                                ) : (
                                  <span className="flex h-12 w-9 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-300">
                                    <FiPackage size={14} />
                                  </span>
                                )}
                                <span className="font-medium text-slate-800">
                                  {item.title}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 pr-3 text-slate-500">
                              {book?.sku || book?.isbn || item.sku || '—'}
                            </td>
                            <td className="py-2.5 pr-3 text-right">
                              {item.quantity}
                            </td>
                            <td className="py-2.5 pr-3 text-right">
                              ৳{item.price}
                            </td>
                            <td className="py-2.5 text-right font-semibold">
                              ৳{num(item.price) * num(item.quantity)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Section>

              <Section title="Financial summary">
                <div className="ml-auto max-w-sm space-y-1.5 text-sm">
                  {[
                    ['Subtotal', formatCurrency(row.subtotal)],
                    ['Discount', `− ${formatCurrency(row.discount)}`],
                    ['Delivery charge', formatCurrency(row.charge)],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      className="flex justify-between text-slate-600"
                    >
                      <span>{k}</span>
                      <span className="font-medium">{v}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-slate-200 pt-1.5 text-base font-bold text-slate-900">
                    <span>Total payable</span>
                    <span>{formatCurrency(row.payable)}</span>
                  </div>
                  {[
                    ['Paid amount', formatCurrency(row.paid)],
                    ['COD amount', formatCurrency(row.cod)],
                    ['Refund amount', formatCurrency(row.refund)],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      className="flex justify-between text-slate-600"
                    >
                      <span>{k}</span>
                      <span className="font-medium">{v}</span>
                    </div>
                  ))}
                  <div
                    className={`flex justify-between rounded-lg px-3 py-2 font-semibold ${row.outstanding > 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}
                  >
                    <span>Outstanding</span>
                    <span>{formatCurrency(row.outstanding)}</span>
                  </div>
                </div>
              </Section>
            </>
          )}

          {tab === 'shipping' && !row.isCounter && (
            <ShippingTab
              key={`${row.id}-${row.courier}-${row.consignment}`}
              row={row}
              api={api}
            />
          )}
          {tab === 'issues' && !row.isCounter && (
            <IssuesTab
              key={`${row.id}-${row.deliveryStatus}-${m.returnInfo?.status || 'none'}`}
              row={row}
              api={api}
            />
          )}

          {tab === 'timeline' && (
            <>
              <Section title="Order timeline">
                <ol className="relative space-y-4 border-l border-slate-200 pl-5">
                  {timeline.map((e, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -left-[26px] top-1 h-3 w-3 rounded-full border-2 border-white bg-blue-500" />
                      <p className="text-sm font-semibold text-slate-800">
                        {e.label}
                      </p>
                      <p className="text-xs text-slate-500">
                        {fmtDateTime(e.at)} · {e.by}
                      </p>
                      {e.note && (
                        <p className="mt-0.5 text-sm text-slate-600">
                          {e.note}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              </Section>
              <Section title="Audit log">
                {audit.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    No logged actions for this order yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100 text-sm">
                    {audit.map((a, i) => (
                      <li
                        key={i}
                        className="flex flex-wrap justify-between gap-2 py-2"
                      >
                        <span className="text-slate-700">{a.action}</span>
                        <span className="text-xs text-slate-500">
                          {a.by} · {fmtDateTime(a.at)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bulk actions                                                        */
/* ------------------------------------------------------------------ */

function BulkDialog({ def, selected, staffOptions, api, onCancel, onDone }) {
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
  const [visibleCols, setVisibleCols] = useState(() =>
    COLUMNS.filter(c => c.show).map(c => c.id),
  );
  const [colMenu, setColMenu] = useState(false);
  const [bulkMenu, setBulkMenu] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [detailId, setDetailId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [bulkDef, setBulkDef] = useState(null);

  const today = todayLocal();
  const rows = useMemo(
    () => orders.map(o => buildRow(o, store.meta[o.id] || {})),
    [orders, store.meta],
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
    writeMeta(
      row.id,
      { orderStatus: to },
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

  const api = {
    audit: store.audit,
    askConfirm: setConfirm,
    moveOrder: (row, to, note) => report(coreMoveOrder(row, to, note)),
    moveDelivery: (row, to, note) => report(coreMoveDelivery(row, to, note)),
    printInvoices: list =>
      openPrint(list.map(invoiceHtml).join(''), 'Invoices'),
    printLabels: list => {
      const online = list.filter(r => !r.isCounter);
      if (online.length === 0)
        return toast.error('Counter sales do not need shipping labels');
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
  const inTransit = ['shipped', 'in_transit', 'out_for_delivery'];
  const QUICK = {
    all: () => true,
    new: r => r.orderStatus === 'new',
    pending: r => ['new', 'confirmed'].includes(r.orderStatus),
    processing: r => r.orderStatus === 'processing',
    ready: r => r.deliveryStatus === 'ready_to_ship',
    transit: r => inTransit.includes(r.deliveryStatus),
    deliveredToday: r =>
      r.deliveryStatus === 'delivered' && r.deliveredDay === today,
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
      if (filters.payment && r.paymentStatus !== filters.payment) return false;
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
        default:
          return r.ts;
      }
    };
    return [...list].sort((a, b) => {
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
  const cols = COLUMNS.filter(c => visibleCols.includes(c.id));

  const optionsFrom = fn =>
    [...new Set(rows.map(fn).filter(Boolean))]
      .sort()
      .map(v => ({ value: v, label: v }));
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
      id: 'confirm',
      label: 'Confirm orders',
      check: r => canOrderMove(r, 'confirmed'),
      apply: r => coreMoveOrder(r, 'confirmed'),
    },
    {
      id: 'processing',
      label: 'Start processing',
      check: r => canOrderMove(r, 'processing'),
      apply: r => coreMoveOrder(r, 'processing'),
    },
    {
      id: 'ready',
      label: 'Mark ready to ship',
      check: r => canDeliveryMove(r, 'ready_to_ship'),
      apply: r => coreMoveDelivery(r, 'ready_to_ship'),
    },
    {
      id: 'ship',
      label: 'Create shipments (manual)',
      check: r => canDeliveryMove(r, 'shipped'),
      apply: r => coreMoveDelivery(r, 'shipped', 'Manual shipment'),
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

  /* ----- cell rendering ----- */
  const renderCell = (id, r) => {
    switch (id) {
      case 'id':
        return <span className="font-semibold text-slate-800">{r.id}</span>;
      case 'channel':
        return (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            {labelOf(CHANNELS, r.channel)}
          </span>
        );
      case 'customer':
        return (
          <div>
            <p className="font-medium text-slate-800">
              {r.order.shopName || r.order.customerName}
            </p>
            <p className="text-xs text-slate-400">{r.order.phone}</p>
          </div>
        );
      case 'phone':
        return <span className="text-slate-600">{r.order.phone || '—'}</span>;
      case 'items':
        return (
          <span className="text-slate-600">
            {r.uniqueBooks} books · {r.copies} copies
          </span>
        );
      case 'amount':
        return (
          <span className="font-semibold text-slate-900">
            {formatCurrency(r.payable)}
          </span>
        );
      case 'charge':
        return (
          <span className="text-slate-600">{formatCurrency(r.charge)}</span>
        );
      case 'payment':
        return <Pill list={PAYMENT_STATUSES} value={r.paymentStatus} />;
      case 'orderStatus':
        return <Pill list={ORDER_STATUSES} value={r.orderStatus} />;
      case 'delivery':
        return r.isCounter ? (
          <span className="text-xs text-slate-400">Counter handover</span>
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
        return <span className="text-slate-600">{r.courier || '—'}</span>;
      default:
        return null;
    }
  };

  return (
    <>
      <PageHeader
        title="Orders Management"
        description="Process online and counter orders, manage shipments, returns and invoices."
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
                onClick={() => setColMenu(o => !o)}
                className={`${btnOutline} !py-1.5`}
              >
                <FiColumns size={14} /> Columns
              </button>
              {colMenu && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setColMenu(false)}
                  />
                  <div className="absolute right-0 z-30 mt-1 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                    {COLUMNS.map(c => (
                      <label
                        key={c.id}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={visibleCols.includes(c.id)}
                          onChange={() =>
                            setVisibleCols(prev =>
                              prev.includes(c.id)
                                ? prev.length > 1
                                  ? prev.filter(x => x !== c.id)
                                  : prev
                                : [...prev, c.id],
                            )
                          }
                        />
                        {c.label}
                      </label>
                    ))}
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

          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              label="Channels"
              value={filters.channel}
              onChange={setFilter('channel')}
              options={CHANNELS}
            />
            <FilterSelect
              label="Order Status"
              value={filters.orderStatus}
              onChange={setFilter('orderStatus')}
              options={ORDER_STATUSES}
            />
            <FilterSelect
              label="Delivery Status"
              value={filters.delivery}
              onChange={setFilter('delivery')}
              options={DELIVERY_STATUSES}
            />
            <FilterSelect
              label="Payment Status"
              value={filters.payment}
              onChange={setFilter('payment')}
              options={PAYMENT_STATUSES}
            />
            <FilterSelect
              label="Couriers"
              value={filters.courier}
              onChange={setFilter('courier')}
              options={COURIERS.map(c => ({ value: c, label: c }))}
            />
            <FilterSelect
              label="Districts"
              value={filters.district}
              onChange={setFilter('district')}
              options={optionsFrom(r => r.district)}
            />
            <FilterSelect
              label="Staff"
              value={filters.staff}
              onChange={setFilter('staff')}
              options={staffOptions.map(s => ({ value: s, label: s }))}
            />
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
                    className={`whitespace-nowrap px-4 py-3 ${c.align === 'right' ? 'text-right' : ''}`}
                  >
                    {c.sort ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(c.sort)}
                        className="inline-flex items-center gap-1 hover:text-slate-800"
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
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageRows.map(r => (
                <tr
                  key={r.id}
                  onClick={() => setDetailId(r.id)}
                  className="cursor-pointer text-sm transition hover:bg-slate-50/60"
                >
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
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
                      className={`px-4 py-3 ${c.align === 'right' ? 'text-right' : ''}`}
                    >
                      {renderCell(c.id, r)}
                    </td>
                  ))}
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setDetailId(r.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
                      >
                        <FiEye size={13} /> View
                      </button>
                      <button
                        type="button"
                        title="Print invoice"
                        aria-label="Print invoice"
                        onClick={() => api.printInvoices([r])}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <FiPrinter size={14} />
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

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-slate-100 p-4 text-sm text-slate-500 lg:flex-row lg:items-center lg:justify-between lg:px-5">
          <p>
            Showing {filtered.length === 0 ? 0 : start + 1} to{' '}
            {Math.min(start + pageSize, filtered.length)} of {filtered.length}{' '}
            orders
          </p>
          <label className="flex items-center gap-2">
            Show
            <select
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-500"
            >
              {PAGE_SIZES.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            per page
          </label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-2 text-xs">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setPage(currentPage + 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
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
    </>
  );
}

export default Orders;
