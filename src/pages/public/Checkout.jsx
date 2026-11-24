import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { FiCheck, FiMapPin, FiCreditCard, FiShoppingBag } from 'react-icons/fi'
import { Navigate, useNavigate } from 'react-router-dom'
import PageHeader from '../../components/dashboard/PageHeader'
import { useAuth } from '../../context/useAuth'
import { useCart } from '../../context/useCart'
import { useData } from '../../context/useData'
import { getAddresses, saveAddresses } from '../../utils/userStorage'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const paymentOptions = [
  { value: 'cod', label: 'ক্যাশ অন ডেলিভারি' },
  { value: 'bkash', label: 'bKash' },
  { value: 'nagad', label: 'Nagad' },
  { value: 'rocket', label: 'Rocket' },
]

const emptyAddress = { name: '', phone: '', district: '', thana: '', address: '' }

function normalizePhone(value) {
  return String(value).replace(/[০-৯]/g, (digit) => '০১২৩৪৫৬৭৮৯'.indexOf(digit))
}

function isBangladeshiPhone(value) {
  return /^(?:\+?88)?01[3-9]\d{8}$/.test(normalizePhone(value).replace(/[\s-]/g, ''))
}

function Checkout() {
  const { currentUser } = useAuth()
  const { items, cartTotal, clearCart } = useCart()
  const { createOrder } = useData()
  const navigate = useNavigate()
  const savedAddresses = useMemo(() => getAddresses(currentUser.id), [currentUser.id])
  const [step, setStep] = useState(1)
  const [selectedAddressId, setSelectedAddressId] = useState(savedAddresses.find((address) => address.isDefault)?.id ?? '')
  const [address, setAddress] = useState(emptyAddress)
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [payment, setPayment] = useState({ number: '', transactionId: '' })
  const [coupon, setCoupon] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const selectedAddress = savedAddresses.find((item) => item.id === selectedAddressId)
  const shippingAddress = selectedAddress ?? address
  const delivery = shippingAddress.district?.trim().toLowerCase().includes('ঢাকা') || shippingAddress.district?.trim().toLowerCase() === 'dhaka' ? 60 : 120
  const discount = appliedCoupon ? Math.round(cartTotal * 0.1) : 0
  const total = cartTotal - discount + delivery

  const validateAddress = () => {
    if (!shippingAddress.name?.trim() || !shippingAddress.phone?.trim() || !shippingAddress.district?.trim() || !shippingAddress.thana?.trim() || !shippingAddress.address?.trim()) return 'ঠিকানার সব তথ্য পূরণ করুন।'
    if (!isBangladeshiPhone(shippingAddress.phone)) return 'সঠিক বাংলাদেশি ফোন নম্বর দিন।'
    return ''
  }
  const goPayment = () => {
    const nextError = validateAddress()
    if (nextError) { setError(nextError); return }
    if (!selectedAddressId) {
      const saved = [...savedAddresses, { ...address, id: `address-${Date.now()}`, isDefault: savedAddresses.length === 0 }]
      saveAddresses(currentUser.id, saved)
    }
    setError('')
    setStep(2)
  }
  const goReview = () => {
    if (paymentMethod !== 'cod' && (!payment.number.trim() || !payment.transactionId.trim())) {
      setError('পেমেন্ট নম্বর ও ট্রানজ্যাকশন আইডি দিন।')
      return
    }
    setError('')
    setStep(3)
  }
  const submitOrder = () => {
    setIsSubmitting(true)
    const result = createOrder({
      userId: currentUser.id,
      customerName: shippingAddress.name,
      phone: shippingAddress.phone,
      address: `${shippingAddress.district}, ${shippingAddress.thana}, ${shippingAddress.address}`,
      addressDetails: shippingAddress,
      items: items.map((item) => ({ bookId: item.book.id, title: item.book.title, quantity: item.quantity, price: item.lineTotal / item.quantity })),
      subtotal: cartTotal,
      deliveryCharge: delivery,
      discount,
      total,
      coupon: appliedCoupon ? 'HASANTA10' : '',
      paymentMethod,
      paymentNumber: paymentMethod === 'cod' ? '' : payment.number,
      transactionId: paymentMethod === 'cod' ? '' : payment.transactionId,
    })
    if (!result.success) {
      setIsSubmitting(false)
      setError(result.message)
      setStep(1)
      return
    }
    clearCart()
    navigate(`/order-success/${result.order.id}`, { state: { order: result.order } })
  }

  if (!items.length) {
    return <Navigate to="/cart" replace />
  }

  return <main className="bg-cream px-5 py-10 md:px-8 md:py-14"><div className="mx-auto max-w-7xl"><PageHeader title="চেকআউট" description="আপনার অর্ডারের তথ্য নিশ্চিত করুন।" /><div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(20rem,0.7fr)]"><section className="rounded-xl bg-white p-5 md:p-7"><div className="mb-8 grid grid-cols-3 gap-2">{[['ঠিকানা', FiMapPin], ['পেমেন্ট', FiCreditCard], ['রিভিউ', FiCheck]].map(([label, Icon], index) => <div key={label} className={`border-b-2 pb-3 text-center text-sm font-semibold ${step >= index + 1 ? 'border-primary text-dark' : 'border-dark/10 text-dark-muted'}`}><Icon className="mx-auto mb-1" />{index + 1}. {label}</div>)}</div>{step === 1 && <AddressStep addresses={savedAddresses} selectedId={selectedAddressId} setSelectedId={setSelectedAddressId} address={address} setAddress={setAddress} error={error} onNext={goPayment} />}{step === 2 && <PaymentStep method={paymentMethod} setMethod={setPaymentMethod} payment={payment} setPayment={setPayment} error={error} onBack={() => setStep(1)} onNext={goReview} />}{step === 3 && <ReviewStep address={shippingAddress} method={paymentMethod} items={items} error={error} onBack={() => setStep(2)}   onSubmit={submitOrder} isSubmitting={isSubmitting} />}</section><OrderSummary items={items} subtotal={cartTotal} delivery={delivery} discount={discount} total={total} coupon={coupon} setCoupon={setCoupon} applied={appliedCoupon} onCoupon={() => { if (coupon.trim().toUpperCase() === 'HASANTA10') { setAppliedCoupon(true); toast.success('১০% ছাড় প্রয়োগ হয়েছে।') } else toast.error('কুপন কোডটি সঠিক নয়।') }} /></div></div></main>
}

function AddressStep({ addresses, selectedId, setSelectedId, address, setAddress, error, onNext }) {
  return <div><h2 className="font-heading text-2xl font-bold">ডেলিভারি ঠিকানা</h2>{addresses.length > 0 && <div className="mt-5 space-y-3">{addresses.map((item) => <label key={item.id} className="flex cursor-pointer gap-3 rounded-lg border border-dark/10 bg-cream p-4"><input type="radio" checked={selectedId === item.id} onChange={() => setSelectedId(item.id)} /><span><strong>{item.name}</strong> — {item.phone}<br /><span className="text-sm text-dark-muted">{item.district ? `${item.district}, ${item.thana}, ` : ''}{item.address}</span></span></label>)}</div>}<div className="mt-6 border-t border-dark/10 pt-5"><h3 className="font-semibold">নতুন ঠিকানা যোগ করুন</h3><div className="mt-3 grid gap-3 sm:grid-cols-2"><Field label="নাম" value={address.name} onChange={(value) => setAddress({ ...address, name: value })} /><Field label="ফোন" value={address.phone} onChange={(value) => setAddress({ ...address, phone: value })} /><Field label="জেলা" value={address.district} onChange={(value) => setAddress({ ...address, district: value })} /><Field label="থানা" value={address.thana} onChange={(value) => setAddress({ ...address, thana: value })} /><Field label="বিস্তারিত ঠিকানা" value={address.address} onChange={(value) => setAddress({ ...address, address: value })} className="sm:col-span-2" /></div></div>{error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button type="button" onClick={onNext} className="mt-6 rounded-md bg-primary px-5 py-3 font-semibold">পেমেন্টে যান</button></div>
}

function PaymentStep({ method, setMethod, payment, setPayment, error, onBack, onNext }) {
  return <div><h2 className="font-heading text-2xl font-bold">পেমেন্ট পদ্ধতি</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{paymentOptions.map((option) => <label key={option.value} className={`cursor-pointer rounded-lg border p-4 ${method === option.value ? 'border-primary bg-primary/10' : 'border-dark/10'}`}><input type="radio" name="payment" value={option.value} checked={method === option.value} onChange={() => setMethod(option.value)} className="mr-2" />{option.label}</label>)}</div>{method !== 'cod' && <div className="mt-6 rounded-lg bg-cream p-4"><p className="font-semibold">{method.toUpperCase()} নম্বর: ০১৭০০-১২৩৪৫৬</p><p className="mt-1 text-sm text-dark-muted">এই নম্বরে টাকা পাঠিয়ে নিচের তথ্য দিন।</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><Field label="যে নম্বর থেকে পাঠিয়েছেন" value={payment.number} onChange={(value) => setPayment({ ...payment, number: value })} /><Field label="Transaction ID" value={payment.transactionId} onChange={(value) => setPayment({ ...payment, transactionId: value })} /></div></div>}{error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="mt-6 flex gap-3"><button type="button" onClick={onBack} className="rounded-md border px-5 py-3">পেছনে</button><button type="button" onClick={onNext} className="rounded-md bg-primary px-5 py-3 font-semibold">রিভিউ করুন</button></div></div>
}

function ReviewStep({ address, method, items, error, onBack, onSubmit, isSubmitting }) {
  return <div><h2 className="font-heading text-2xl font-bold">অর্ডার নিশ্চিত করুন</h2><div className="mt-5 rounded-lg bg-cream p-4 text-sm leading-7"><strong>ঠিকানা:</strong> {address.name}, {address.phone}<br />{address.district}, {address.thana}, {address.address}<br /><strong>পেমেন্ট:</strong> {paymentOptions.find((option) => option.value === method)?.label}</div><div className="mt-5 divide-y divide-dark/10 rounded-lg border border-dark/10">{items.map((item) => <div key={item.book.id} className="flex justify-between p-3 text-sm"><span>{item.book.title} × {item.quantity}</span><strong>৳{item.lineTotal}</strong></div>)}</div>{error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="mt-6 flex gap-3"><button type="button" onClick={onBack} className="rounded-md border px-5 py-3">পেছনে</button><button type="button" disabled={isSubmitting} onClick={onSubmit} className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? <LoadingSpinner label="অর্ডার তৈরি হচ্ছে..." /> : <><FiShoppingBag /> অর্ডার নিশ্চিত করুন</>}</button></div></div>
}

function OrderSummary({ subtotal, delivery, discount, total, coupon, setCoupon, applied, onCoupon }) {
  return <aside className="h-fit rounded-xl bg-white p-5 shadow-sm lg:sticky lg:top-24 md:p-7"><h2 className="font-heading text-2xl font-bold">অর্ডার সারাংশ</h2><div className="mt-6 space-y-3 text-sm"><div className="flex justify-between"><span>সাবটোটাল</span><span>৳{subtotal}</span></div><div className="flex justify-between"><span>ডেলিভারি</span><span>৳{delivery}</span></div>{discount > 0 && <div className="flex justify-between text-emerald-600"><span>ছাড়</span><span>−৳{discount}</span></div>}</div><div className="mt-5 flex gap-2"><input value={coupon} onChange={(event) => setCoupon(event.target.value)} placeholder="HASANTA10" className="min-w-0 flex-1 rounded-md border border-dark/10 bg-cream px-3 py-2.5 text-sm" /><button type="button" disabled={applied} onClick={onCoupon} className="rounded-md border px-3 py-2.5 text-sm font-semibold disabled:opacity-50">প্রয়োগ</button></div><div className="mt-6 flex justify-between border-t border-dark/10 pt-5 text-lg font-bold"><span>মোট</span><span>৳{total}</span></div></aside>
}

function Field({ label, value, onChange, className = '' }) {
  return <label className={`block text-sm font-semibold ${className}`}>{label}<input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-dark/10 bg-cream px-3 py-2.5" /></label>
}

export default Checkout
