import { FiPrinter, FiX } from 'react-icons/fi';

export default function CashMemoModal({ order, onClose }) {
  if (!order) return null;

  const items = order.items || [];
  const subtotal = order.subtotal || items.reduce((s, i) => s + Number(i.price * i.quantity), 0);
  const commission = Number(order.commission || 0);
  const commissionDeduction =
    order.commissionAmount !== undefined
      ? order.commissionAmount
      : Math.round((subtotal * commission) / 100);
  const total = Number(order.total || subtotal - commissionDeduction);
  const paid = order.amountPaid !== undefined ? Number(order.amountPaid) : total;
  const due = order.dueAmount !== undefined ? Number(order.dueAmount) : Math.max(0, total - paid);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs print:static print:p-0 print:bg-white">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-xl print:max-h-none print:w-full print:shadow-none print:rounded-none">
        {/* Print Controls (hidden when printing) */}
        <div className="flex items-center justify-between border-b border-gray-100 p-4 print:hidden">
          <span className="text-sm font-bold text-gray-800">Cash Memo Preview</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-dark transition hover:bg-primary-hover shadow-2xs"
            >
              <FiPrinter size={14} />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
              aria-label="Close"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* Printable Receipt */}
        <div className="p-6 md:p-8 print:p-4 text-gray-800">
          <div className="border-b border-gray-300 pb-3 text-center">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-gray-900">
              Hosonta Prokashon
            </h1>
            <p className="text-xs text-gray-500">Banglabazar, Dhaka • Phone: 01711-000001</p>
            <span className="mt-1.5 inline-block rounded bg-gray-100 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-gray-700">
              Counter Cash Memo / Invoice
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div>
              <p><strong>Wholesale:</strong> {order.shopName || order.customerName}</p>
              {order.representative && <p><strong>Representative:</strong> {order.representative}</p>}
              <p><strong>Phone:</strong> {order.phone}</p>
              <p><strong>Address:</strong> {order.address || 'Showroom Counter'}</p>
            </div>
            <div className="text-right">
              <p><strong>Memo No:</strong> {order.id}</p>
              <p><strong>Date:</strong> {order.date}</p>
              <p><strong>Payment:</strong> {order.paymentMethod || 'cash'}</p>
              <p><strong>Served By:</strong> {order.servedBy || 'Counter Staff'}</p>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs border border-gray-200">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 font-bold">
                  <th className="py-2 px-2 text-center w-8">#</th>
                  <th className="py-2 px-2">Book Name</th>
                  <th className="py-2 px-2 text-center">Quantity</th>
                  <th className="py-2 px-2 text-right">Price (৳)</th>
                  <th className="py-2 px-2 text-right">Total (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className="py-2 px-2 text-center text-gray-400">{index + 1}</td>
                    <td className="py-2 px-2 font-medium">{item.title}</td>
                    <td className="py-2 px-2 text-center font-bold">{item.quantity}</td>
                    <td className="py-2 px-2 text-right">{item.price}</td>
                    <td className="py-2 px-2 text-right font-semibold">
                      {Number(item.price) * Number(item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex justify-end text-xs">
            <div className="w-56 space-y-1">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>৳{subtotal}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Commission Discount ({commission}%):</span>
                <span>- ৳{commissionDeduction}</span>
              </div>
              <div className="border-t border-gray-300 pt-1 flex justify-between font-bold text-sm text-gray-900">
                <span>Grand Total:</span>
                <span>৳{total}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Paid:</span>
                <span>৳{paid}</span>
              </div>
              {due > 0 && (
                <div className="flex justify-between font-bold text-rose-600">
                  <span>Due:</span>
                  <span>৳{due}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 text-center text-xs text-gray-400">
            <div className="border-t border-dashed border-gray-300 pt-1">Customer Signature</div>
            <div className="border-t border-dashed border-gray-300 pt-1">Authorized Signature</div>
          </div>
        </div>
      </div>
    </div>
  );
}
