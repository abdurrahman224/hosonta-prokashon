import { FiCheckCircle, FiHome, FiPackage } from 'react-icons/fi'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useData } from '../../context/useData'

function OrderSuccess() {
  const { id } = useParams()
  const { state } = useLocation()
  const { orders } = useData()
  const order = state?.order ?? orders.find((item) => item.id === id)
  if (!order) return <main className="flex min-h-[65vh] items-center justify-center bg-cream px-5 text-center"><div><h1 className="font-heading text-3xl font-bold">অর্ডার পাওয়া যায়নি</h1><Link to="/books" className="mt-5 inline-block rounded-md bg-primary px-5 py-3 font-semibold">বই দেখুন</Link></div></main>
  return <main className="flex min-h-[75vh] items-center justify-center bg-cream px-5 py-16"><div className="w-full max-w-2xl rounded-2xl bg-white p-7 text-center shadow-xl md:p-10"><FiCheckCircle className="mx-auto text-6xl text-emerald-500" /><h1 className="mt-5 font-heading text-4xl font-bold text-dark">অর্ডার সফল হয়েছে!</h1><p className="mt-3 text-dark-muted">আপনার অর্ডারটি গ্রহণ করা হয়েছে।</p><div className="mt-7 rounded-xl bg-cream p-5"><p className="text-sm text-dark-muted">অর্ডার নম্বর</p><p className="mt-1 font-heading text-2xl font-bold text-primary-hover">{order.id}</p><p className="mt-4 text-sm">মোট: <strong>৳{order.total}</strong></p></div><p className="mt-6 flex items-center justify-center gap-2 text-sm text-dark-muted"><FiPackage /> অর্ডারটি এখন নতুন অবস্থায় আছে; পরবর্তী আপডেট ড্যাশবোর্ডে দেখতে পারবেন।</p><div className="mt-7 flex flex-wrap justify-center gap-3"><Link to={`/dashboard/my-orders/${order.id}`} className="rounded-md bg-dark px-5 py-3 font-semibold text-white">অর্ডার দেখুন</Link><Link to="/" className="inline-flex items-center gap-2 rounded-md border border-dark/10 px-5 py-3 font-semibold"><FiHome /> হোমে ফিরুন</Link></div></div></main>
}

export default OrderSuccess
