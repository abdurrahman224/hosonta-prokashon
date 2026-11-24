export const esc = s =>
  String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c]);

export const PUBLISHER = {
  name: 'Hosonta Prokashon',
  address: 'Enter address here, Dhaka',
  phone: '01XXXXXXXXX',
};

export const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash' },
  { id: 'bkash', label: 'bKash' },
  { id: 'nagad', label: 'Nagad' },
  { id: 'rocket', label: 'Rocket' },
  { id: 'bank', label: 'Bank' },
  { id: 'due', label: 'Due' },
];

export const paymentLabel = id =>
  PAYMENT_METHODS.find(p => p.id === id)?.label || id;

export function buildInvoiceHtml(d) {
  const rows = d.items
    .map(
      (it, i) => `<tr>
        <td>${i + 1}</td><td>${esc(it.title)}</td>
        <td class="r">${it.quantity}</td><td class="r">${it.price}</td>
        <td class="r">${it.netPrice}</td><td class="r">${it.lineTotal}</td></tr>`,
    )
    .join('');

  return `<!doctype html><html lang="bn"><head><meta charset="utf-8">
<title>Invoice - ${esc(d.shopName)}</title>
<style>
 body{font-family:'Noto Sans Bengali','Hind Siliguri',Arial,sans-serif;color:#1d2939;margin:0;padding:32px;font-size:13px}
 .pub{text-align:center;border-bottom:2px solid #1d2939;padding-bottom:12px}
 .pub h1{margin:0;font-size:26px} .pub p{margin:2px 0;color:#475467}
 .meta{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;margin:16px 0}
 .meta div{display:flex;gap:6px} .meta b{min-width:120px;color:#475467;font-weight:500}
 table{width:100%;border-collapse:collapse}
 th,td{padding:8px;border-bottom:1px solid #eaecf0;text-align:left}
 thead th{background:#f9fafb;border-top:1px solid #d0d5dd;border-bottom:1px solid #d0d5dd;font-weight:600}
 tfoot td{font-weight:700;border-top:1px solid #1d2939;border-bottom:none}
 .r{text-align:right}
 .total{text-align:right;font-size:16px;font-weight:700;margin:10px 0 18px}
 .foot{display:flex;justify-content:space-between;gap:12px;border-top:1px dashed #98a2b3;padding-top:12px;font-size:14px}
 .foot span{display:block;color:#475467;font-size:12px} .foot b{font-size:15px}
 .due b{color:#d92d20}
 .note{margin-top:14px;color:#475467}
 @media print{body{padding:12px}}
</style></head><body>
<div class="pub"><h1>${esc(PUBLISHER.name)}</h1><p>${esc(PUBLISHER.address)}</p><p>Mobile: ${esc(PUBLISHER.phone)}</p></div>
<div class="meta">
 <div><b>Order Number</b>${esc(d.orderNumber)}</div><div><b>Date</b>${esc(d.orderDate)}</div>
 <div><b>Shop Name</b>${esc(d.shopName)}</div><div><b>Phone Number</b>${esc(d.phone)}</div>
 <div><b>Address</b>${esc(d.address)}</div>${d.representative ? `<div><b>Person Taking the Books</b>${esc(d.representative)}</div>` : ''}
</div>
<table><thead><tr><th>Sl</th><th>Product</th><th class="r">Qty</th><th class="r">Unit Price</th><th class="r">Dis. Price</th><th class="r">Subtotal</th></tr></thead>
<tbody>${rows}</tbody>
<tfoot><tr><td colspan="2">Total</td><td class="r">${d.totalCopies}</td><td class="r">${d.subtotal}</td><td class="r">${d.disTotal}</td><td class="r">${d.netPayable}</td></tr></tfoot></table>
<div class="total">Total: ৳${d.netPayable}</div>
<div class="foot">
 ${d.previousDue > 0 ? `<div><span>Previous Due</span><b>৳${d.previousDue}</b></div>` : ''}
 <div><span>Total Bill</span><b>৳${d.previousDue + d.netPayable}</b></div>
 <div><span>Paid (${esc(d.paymentLabel)})</span><b>৳${d.paidAmount}</b></div>
 <div class="due"><span>Total Due</span><b>৳${d.totalDue}</b></div>
</div>
${d.notes ? `<p class="note">Note: ${esc(d.notes)}</p>` : ''}
</body></html>`;
}

/** সংরক্ষিত অর্ডার থেকে ইনভয়েসের ডাটা বানায় */
export function orderToInvoiceData(o = {}) {
  const items = (o.items || []).map(it => {
    const price = Number(it.price) || 0;
    const quantity = Number(it.quantity) || 0;
    const netPrice =
      it.netPrice !== undefined ? Number(it.netPrice) : price;
    const lineTotal =
      it.lineTotal !== undefined
        ? Number(it.lineTotal)
        : Math.round(netPrice * quantity);
    return { title: it.title, price, quantity, netPrice, lineTotal };
  });
  const totalCopies = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const disTotal =
    Math.round(
      items.reduce((s, i) => s + i.netPrice * i.quantity, 0) * 100,
    ) / 100;
  const netPayable =
    o.total !== undefined
      ? Number(o.total)
      : items.reduce((s, i) => s + i.lineTotal, 0);
  const previousDue = Number(o.previousDue || 0);
  const paidAmount =
    o.amountPaid !== undefined ? Number(o.amountPaid) : netPayable;
  const totalDue =
    o.totalDue !== undefined
      ? Number(o.totalDue)
      : Math.max(0, previousDue + netPayable - paidAmount);
  const rawDate = o.orderDate || o.createdAt || o.date;

  return {
    orderNumber: o.orderNumber || o.orderId || o.id || '',
    orderDate: rawDate ? String(rawDate).slice(0, 10) : '',
    shopName: o.shopName || o.customerName || '—',
    phone: o.phone || '',
    address: o.address || '',
    email: o.email || '',
    representative: (o.representative || '').trim(),
    notes: o.notes || '',
    items,
    totalCopies,
    subtotal,
    disTotal,
    commissionAmount:
      o.commissionAmount !== undefined
        ? Number(o.commissionAmount)
        : Math.max(0, subtotal - netPayable),
    netPayable,
    previousDue,
    paidAmount,
    totalDue,
    paymentLabel: paymentLabel(o.paymentMethod),
  };
}
