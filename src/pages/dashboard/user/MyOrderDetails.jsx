import { useState } from 'react'
import toast from 'react-hot-toast'
import {
  FiCheckCircle,
  FiClock,
  FiPackage,
  FiPrinter,
  FiTruck,
  FiXCircle,
} from 'react-icons/fi'
import { Link, useParams } from 'react-router-dom'
import ConfirmModal from '../../../components/dashboard/ConfirmModal'
import StatusBadge from '../../../components/dashboard/StatusBadge'
import { useAuth } from '../../../context/useAuth'
import { useData } from '../../../context/useData'
import { getReviews, saveReviews } from '../../../utils/userStorage'
import {
  buildTracking,
  formatDate,
  getAmounts,
  getShipping,
  resolveItem,
} from '../../../utils/orderUtils'

const COMPANY = {
  name: 'হসন্ত প্রকাশন',
  legalName: 'Hosonta Prokashon',
  hotline: 'যোগাযোগ করুন',
  email: 'support@hosontoprokashon.com',
}

const money = value => `Tk ${Number(value || 0).toLocaleString('en-BD')}`

function MyOrderDetails() {
  const { id } = useParams()
  const { currentUser } = useAuth()
  const { orders, cancelOrder } = useData()
  const order = orders.find((item) => item.id === id && item.userId === currentUser.id)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [reviewing, setReviewing] = useState(null)
  const [reviewText, setReviewText] = useState('')
  if (!order) return <div className="p-10 text-center">অর্ডার পাওয়া যায়নি।</div>
  const items = order.items.map(resolveItem)
  const amounts = getAmounts(order, items)
  const shipping = getShipping(order, currentUser)
  const tracking = buildTracking(order)

  const cancel = () => {
    const result = cancelOrder(order.id, currentUser.id)
    if (result.success) {
      toast.success('অর্ডার বাতিল হয়েছে.')
      setConfirmCancel(false)
    } else {
      toast.error(result.message)
    }
  }
  const submitReview = () => {
    if (!reviewText.trim()) return toast.error('রিভিউ লিখুন।')
    const reviews = getReviews()
    saveReviews([...reviews, { id: `review-${Date.now()}`, userId: currentUser.id, bookTitle: reviewing.title, bookId: reviewing.bookId, rating: 5, text: reviewText.trim(), status: 'pending', date: new Date().toISOString().slice(0, 10) }])
    setReviewing(null)
    setReviewText('')
    toast.success('রিভিউ মডারেশনের জন্য পাঠানো হয়েছে।')
  }

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #invoice-print, #invoice-print * { visibility: visible !important; }
          #invoice-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: 0 !important;
            box-shadow: none !important;
          }
          @page { margin: 12mm; }
        }
      `}</style>

      <main className="mx-auto max-w-6xl print:hidden">
        <nav className="mb-3 flex items-center gap-2 text-xs text-dark-muted sm:mb-5 sm:text-sm">
          <Link to="/dashboard/my-orders" className="hover:text-dark">My Orders</Link>
          <span>&gt;</span>
          <span>Order Details</span>
        </nav>

        <h1 className="mb-5 font-heading text-2xl font-bold text-dark sm:mb-7 sm:text-3xl">Order Details</h1>

        <section className="relative overflow-hidden rounded-lg border border-sky-100 bg-sky-50/70 px-4 py-5 sm:px-6 sm:py-6">
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-lg font-bold text-sky-700 sm:text-xl">
              {order.status === 'delivered' ? 'Order Delivered' : order.status === 'cancelled' ? 'Order Canceled' : order.status === 'processing' ? 'Order Processing' : order.status === 'shipped' ? 'Order Shipped' : 'Order Placed'}
            </h2>
            <p className="mt-1 text-xs leading-5 text-sky-800/70 sm:text-sm">
              {order.status === 'delivered' ? 'Your order has been delivered successfully.' : order.status === 'cancelled' ? 'This order has been canceled.' : order.status === 'processing' ? 'Your order is confirmed and is being prepared.' : order.status === 'shipped' ? 'Your order is out for delivery.' : 'Your order has been received and is waiting for confirmation.'}
            </p>
          </div>
          <FiTruck className="absolute right-5 top-1/2 hidden -translate-y-1/2 text-7xl text-sky-500/70 sm:block" />
        </section>

        <section className="mt-5 grid gap-5 rounded-lg bg-white px-4 py-5 text-sm sm:grid-cols-3 sm:px-6">
          <div>
            <p className="font-semibold text-dark">Order Id <button type="button" onClick={() => navigator.clipboard?.writeText(order.id)} className="ml-1 text-xs text-dark-muted">Copy</button></p>
            <p className="mt-1 break-all text-xs text-dark-muted sm:text-sm">{order.id}</p>
          </div>
          <div>
            <p className="font-semibold text-dark">Order Date</p>
            <p className="mt-1 text-xs text-dark-muted sm:text-sm">{formatDate(order.date, true)}</p>
          </div>
          <div>
            <p className="font-semibold text-dark">Payment Method</p>
            <p className="mt-1 text-xs text-dark-muted sm:text-sm">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : String(order.paymentMethod || '').toUpperCase()}</p>
          </div>
          <div className="sm:col-span-3">
            <p className="font-semibold text-dark">Shipping Address</p>
            <p className="mt-1 text-xs leading-5 text-dark-muted sm:text-sm">
              {shipping.name}<br />
              {shipping.phone && <>{shipping.phone}<br /></>}
              {shipping.text}
            </p>
          </div>
          <div className="sm:col-span-3 flex justify-end border-t border-transparent pt-1">
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700">
              <FiPrinter /> Download Invoice
            </button>
          </div>
        </section>

        <section className="mt-5 rounded-lg bg-white px-4 py-5 sm:px-6 sm:py-6">
          <h2 className="border-b border-dashed border-dark/20 pb-3 font-heading text-base font-bold text-dark sm:text-lg">Tracking Update</h2>
          <div className="mt-4">
            {tracking.map((step, index) => (
              <div key={`${step.title}-${index}`} className="relative flex gap-4 pb-5 last:pb-0">
                {index < tracking.length - 1 && <span className="absolute left-[61px] top-[28px] h-[calc(100%-18px)] border-l-2 border-dotted border-emerald-500 sm:left-[64px]" />}
                <TrackingDate date={step.date} />
                <span className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${step.danger ? 'bg-red-500 text-white' : step.done ? 'bg-emerald-500 text-white' : 'bg-dark/10 text-dark-muted'}`}>
                  {step.danger ? <FiXCircle /> : step.done ? <FiCheckCircle /> : <FiClock />}
                </span>
                <div className="min-w-0 flex-1 pb-1">
                  <h3 className="text-sm font-bold text-dark sm:text-base">{step.title}</h3>
                  {step.text && <p className="mt-1 text-[11px] leading-5 text-dark-muted sm:text-xs">{step.text}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-lg bg-white px-4 py-5 sm:px-6 sm:py-6">
          <h2 className="border-b border-dashed border-dark/20 pb-3 font-heading text-base font-bold text-dark sm:text-lg">Order Items</h2>
          <div className="divide-y divide-dark/10">
            {items.map(item => (
              <article key={`${order.id}-${item.bookId}`} className="flex items-center gap-3 py-4 sm:gap-4">
                {item.image ? <img src={item.image} alt="" className="h-16 w-14 shrink-0 rounded-md border border-dark/10 object-cover sm:h-20 sm:w-16" /> : <span className="flex h-16 w-14 shrink-0 items-center justify-center rounded-md border border-dark/10 bg-cream sm:h-20 sm:w-16"><FiPackage /></span>}
                <div className="min-w-0 flex-1">
                  <Link to={`/books/${item.bookId}`} className="line-clamp-1 text-sm font-semibold text-dark hover:text-primary-hover sm:text-base">{item.title}</Link>
                  {item.author && <p className="mt-1 text-[11px] text-dark-muted sm:text-xs">Author: {typeof item.author === 'object' ? item.author.bn || item.author.name : item.author}</p>}
                  {order.status === 'delivered' && <button type="button" onClick={() => setReviewing(item)} className="mt-1 text-[11px] font-semibold text-primary-hover sm:text-xs">Write Review</button>}
                </div>
                <p className="shrink-0 text-xs text-dark-muted sm:text-sm">Qty: {item.qty}</p>
                <strong className="shrink-0 text-xs text-dark sm:text-sm">৳{item.price * item.qty}</strong>
              </article>
            ))}
          </div>
          <dl className="mt-2 space-y-2 text-sm text-dark-muted">
            <div className="flex justify-between"><dt>Total items:</dt><dd className="font-semibold text-dark">{amounts.count} Product{amounts.count === 1 ? '' : 's'}</dd></div>
            <div className="flex justify-between"><dt>Sub-Total:</dt><dd className="text-dark">৳{amounts.subtotal}</dd></div>
            <div className="flex justify-between"><dt>Delivery and Service Charge:</dt><dd className="text-dark">৳{amounts.delivery}</dd></div>
            <div className="flex justify-between"><dt>Discount:</dt><dd className="text-dark">৳{amounts.discount}</dd></div>
            <div className="flex justify-between border-t border-dashed border-dark/20 pt-3 text-base"><dt className="font-semibold text-dark">Payable Amount:</dt><dd className="font-bold text-dark">৳{amounts.payable}</dd></div>
          </dl>
        </section>

        {order.status === 'new' && <button type="button" onClick={() => setConfirmCancel(true)} className="mt-5 w-full rounded-md border border-red-200 px-4 py-3 font-semibold text-red-600 sm:w-auto">অর্ডার বাতিল করুন</button>}
      </main>

      <Invoice order={order} items={items} amounts={amounts} shipping={shipping} />
      <ConfirmModal isOpen={confirmCancel} title="অর্ডার বাতিল করবেন?" message="স্টক পুনরায় যোগ হবে এবং এই কাজটি ফিরিয়ে আনা যাবে না।" onCancel={() => setConfirmCancel(false)} onConfirm={cancel} confirmLabel="বাতিল করুন" />
      {reviewing && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-dark/70 px-4 print:hidden">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h2 className="font-heading text-xl font-bold">রিভিউ লিখুন</h2>
            <p className="mt-2 text-sm text-dark-muted">{reviewing.title}</p>
            <textarea value={reviewText} onChange={event => setReviewText(event.target.value)} rows="4" className="mt-4 w-full rounded-lg border border-dark/10 bg-cream p-3" placeholder="আপনার অভিজ্ঞতা লিখুন..." />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setReviewing(null)} className="rounded-md border px-4 py-2">বাতিল</button>
              <button type="button" onClick={submitReview} className="rounded-md bg-primary px-4 py-2 font-semibold">জমা দিন</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Invoice({ order, items, amounts, shipping }) {
  return (
    <article
      id="invoice-print"
      className="hidden print:absolute print:left-0 print:top-0 print:w-full print:border-0 print:bg-white print:p-8 print:shadow-none"
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-heading text-xl font-bold text-dark sm:text-3xl">{COMPANY.name}</p>
          <p className="mt-1 text-[11px] leading-5 text-dark-muted sm:text-sm">
            {COMPANY.legalName}<br />
            Hotline: {COMPANY.hotline}<br />
            {COMPANY.email}
          </p>
        </div>
        <div className="text-xs sm:text-right sm:text-sm">
          <h2 className="text-xl font-extrabold tracking-wide text-dark sm:text-3xl">INVOICE</h2>
          <p className="mt-1 text-dark-muted">Invoice No: <span className="break-all font-bold text-dark">{order.id}</span></p>
          <p className="text-dark-muted">Order Date: <span className="font-bold text-dark">{formatDate(order.date)}</span></p>
          <p className="text-dark-muted">Payment: <span className="font-bold text-dark">{order.paymentMethod || 'Cash on Delivery'}</span></p>
          <span className="mt-1.5 inline-block"><StatusBadge status={order.status} /></span>
        </div>
      </header>

      <section className="mt-5 grid gap-4 border-y border-dark/10 py-4 text-xs sm:mt-6 sm:grid-cols-2 sm:gap-6 sm:py-5 sm:text-sm">
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-dark-muted">Billed to</h3>
          <p className="mt-1 leading-5 text-dark">
            <span className="font-semibold">{shipping.name}</span>
            {shipping.phone && <><br />{shipping.phone}</>}
          </p>
        </div>
        <div className="sm:text-right">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-dark-muted">Shipping address</h3>
          <p className="mt-1 leading-5 text-dark">
            {shipping.name && <span className="font-semibold">{shipping.name}</span>}
            {shipping.phone && <> {shipping.phone}</>}
            {shipping.text && <><br />{shipping.text}</>}
          </p>
        </div>
      </section>

      <div className="mt-4 overflow-x-auto sm:mt-5">
        <table className="w-full min-w-[26rem] text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-dark/10 text-[11px] font-semibold text-dark-muted sm:text-xs">
              <th className="w-8 py-2 pr-2">SL</th>
              <th className="py-2 pr-2">ITEM</th>
              <th className="w-12 py-2 text-center">QTY</th>
              <th className="w-20 py-2 text-right">UNIT PRICE</th>
              <th className="w-20 py-2 text-right">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={`${order.id}-${item.bookId}`} className="border-b border-dark/10 align-top">
                <td className="py-2.5 pr-2 font-semibold text-sky-700">{index + 1}</td>
                <td className="py-2.5 pr-2 text-dark">{item.title}</td>
                <td className="py-2.5 text-center text-dark">{item.qty}</td>
                <td className="py-2.5 text-right text-dark">{money(item.price)}</td>
                <td className="py-2.5 text-right text-dark">{money(item.price * item.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="ml-auto mt-4 w-full space-y-1.5 text-xs sm:mt-5 sm:max-w-xs sm:text-sm">
        <InvoiceLine label={`Subtotal (${amounts.count} ${amounts.count === 1 ? 'item' : 'items'})`} value={money(amounts.subtotal)} />
        <InvoiceLine label="Delivery and Service Charge" value={money(amounts.delivery)} />
        <InvoiceLine label="Discount" value={`${amounts.discount ? '- ' : ''}${money(amounts.discount)}`} />
        <div className="border-t border-dark/15 pt-2">
          <InvoiceLine label="Payable Total" value={money(amounts.payable)} strong />
        </div>
      </dl>

      <footer className="mt-6 border-t border-dark/10 pt-3 text-[11px] leading-5 text-dark-muted sm:mt-8 sm:text-xs">
        This is a computer generated invoice and does not require a signature. For any query please contact {COMPANY.hotline} or {COMPANY.email}.
      </footer>
    </article>
  )
}

function InvoiceLine({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className={strong ? 'font-bold text-dark' : 'text-dark-muted'}>{label}</dt>
      <dd className={strong ? 'text-sm font-bold text-dark sm:text-base' : 'text-dark'}>{value}</dd>
    </div>
  )
}

function TrackingDate({ date }) {
  if (!date) return <div className="w-[52px] shrink-0 sm:w-[55px]" />
  const fullDate = formatDate(date)
  const fullTime = formatDate(date, true)
  const timeMatch = fullTime.match(/\b\d{1,2}:\d{2}\s*(?:AM|PM)\b/i)
  return (
    <div className="w-[52px] shrink-0 text-right text-[10px] leading-4 text-dark-muted sm:w-[55px] sm:text-xs">
      <span>{fullDate}</span>
      {timeMatch && <><br /><span>{timeMatch[0]}</span></>}
    </div>
  )
}

export default MyOrderDetails
