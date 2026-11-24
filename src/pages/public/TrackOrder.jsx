import { useState } from 'react'
import { FiSearch } from 'react-icons/fi'
import { useData } from '../../context/useData'
import StatusBadge from '../../components/dashboard/StatusBadge'

function TrackOrder() {
  const { orders } = useData()
  const [form, setForm] = useState({ id: '', phone: '' })
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const search = (event) => {
    event.preventDefault()
    const order = orders.find((item) => item.id.toLowerCase() === form.id.trim().toLowerCase() && item.phone === form.phone.trim())
    setResult(order ?? null)
    setError(order ? '' : 'অর্ডার নম্বর ও ফোন নম্বর মিলছে না।')
  }
  return <main className="min-h-[75vh] bg-cream px-5 py-16"><div className="mx-auto max-w-xl rounded-2xl bg-white p-7 shadow-xl md:p-10"><div className="text-center"><FiSearch className="mx-auto text-5xl text-primary-hover" /><h1 className="mt-4 font-heading text-3xl font-bold">অর্ডার ট্র্যাক করুন</h1><p className="mt-2 text-dark-muted">অর্ডার নম্বর ও ফোন নম্বর দিয়ে অর্ডারের অবস্থা দেখুন।</p></div><form onSubmit={search} className="mt-8 space-y-4"><Field label="অর্ডার নম্বর" value={form.id} onChange={(value) => setForm({ ...form, id: value })} placeholder="ORD-20261113-001" /><Field label="ফোন নম্বর" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} placeholder="০১৭..." />{error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button className="w-full rounded-md bg-primary px-5 py-3 font-semibold">ট্র্যাক করুন</button></form>{result && <div className="mt-7 rounded-xl bg-cream p-5"><div className="flex justify-between gap-3"><strong>{result.id}</strong><StatusBadge status={result.status} /></div><p className="mt-3 text-sm text-dark-muted">গ্রাহক: {result.customerName}</p><div className="mt-4 space-y-2 text-sm">{result.statusHistory?.map((entry) => <p key={`${entry.status}-${entry.at}`}>✓ {entry.status} — {new Date(entry.at).toLocaleString('bn-BD')}</p>)}</div></div>}</div></main>
}

function Field({ label, value, onChange, placeholder }) { return <label className="block text-left text-sm font-semibold">{label}<input required value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 w-full rounded-lg border border-dark/10 bg-cream px-4 py-3" /></label> }

export default TrackOrder
