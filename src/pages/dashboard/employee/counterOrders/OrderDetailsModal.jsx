import { FiPrinter, FiShoppingBag, FiX } from 'react-icons/fi';
import { formatCurrency } from '../../../../utils/format';

export default function OrderDetailsModal({ order, onClose, onPrint }) {
  if (!order) return null;

  const items = order.items || [];
  const totalCopies = items.reduce((s, i) => s + Number(i.quantity || 1), 0);
  const subtotal = order.subtotal || items.reduce((s, i) => s + Number(i.price * i.quantity), 0);
  const commission = Number(order.commission || 0);
  const commissionDeduction =
    order.commissionAmount !== undefined
      ? order.commissionAmount
      : Math.round((subtotal * commission) / 100);
  const total = Number(order.total || subtotal - commissionDeduction);
  const paid = order.amountPaid !== undefined ? Number(order.amountPaid) : total;
  const due = order.dueAmount !== undefined ? Number(order.dueAmount) : Math.max(0, total - paid);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        {/* Simple Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <FiShoppingBag size={18} />
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-gray-900">
                {order.shopName || order.customerName}
              </h3>
              <p className="text-xs text-gray-500 font-mono">Memo: {order.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Shop Meta Info */}
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-3.5 text-xs">
            <div>
              <span className="text-gray-500 block">Phone Number:</span>
              <span className="font-semibold text-gray-900">{order.phone}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Date:</span>
              <span className="font-semibold text-gray-900">{order.date}</span>
            </div>
            {order.representative && (
              <div>
                <span className="text-gray-500 block">Representative:</span>
                <span className="font-semibold text-gray-900">{order.representative}</span>
              </div>
            )}
            <div>
              <span className="text-gray-500 block">Address:</span>
              <span className="font-semibold text-gray-900 truncate block">
                {order.address || 'Showroom Counter'}
              </span>
            </div>
          </div>

          {/* Table: কি কি তিনি কিনেছেন */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Purchased Books ({items.length} books, {totalCopies} copies)
              </h4>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-100">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50 font-semibold text-gray-600 border-b border-gray-100">
                    <th className="py-2.5 px-3">Book Name</th>
                    <th className="py-2.5 px-3 text-center">Quantity</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50/50">
                      <td className="py-2.5 px-3 font-medium text-gray-900">
                        {item.title}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-gray-800">
                        {item.quantity} copies
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-500">
                        ৳{item.price}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                        ৳{Number(item.price) * Number(item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Simple Calculation Summary */}
          <div className="rounded-xl border border-gray-100 p-4 space-y-2 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal (Gross):</span>
              <span className="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Total Commission Discount ({commission}%):</span>
              <span className="font-semibold text-rose-600">- {formatCurrency(commissionDeduction)}</span>
            </div>
            <div className="border-t border-gray-100 pt-2 flex justify-between text-sm font-bold text-gray-900">
              <span>Net Payable:</span>
              <span className="text-amber-600 text-base">{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between text-gray-600 pt-1">
              <span>Paid Amount ({order.paymentMethod || 'Cash'}):</span>
              <span className="font-semibold text-emerald-700">{formatCurrency(paid)}</span>
            </div>
            {due > 0 && (
              <div className="flex justify-between font-bold text-rose-600">
                <span>Remaining Due:</span>
                <span>{formatCurrency(due)}</span>
              </div>
            )}
          </div>

          {order.notes && (
            <p className="text-xs text-gray-500 italic">
              <strong>Note:</strong> {order.notes}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={onPrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-dark transition hover:bg-primary-hover shadow-xs"
            >
              <FiPrinter size={14} />
              <span>Print Cash Memo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
