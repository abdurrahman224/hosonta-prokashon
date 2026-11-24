import { useState } from 'react'
import toast from 'react-hot-toast'
import PageHeader from '../../../components/dashboard/PageHeader'
import { useAuth } from '../../../context/useAuth'
import { getAuthorApplications, saveAuthorApplications } from '../../../utils/userStorage'

function BecomeAuthor() {
  const { currentUser } = useAuth()
  const existing = getAuthorApplications().find((application) => application.userId === currentUser.id)
  const [form, setForm] = useState({ identity: existing?.identity ?? '', sample: existing?.sample ?? '', motivation: existing?.motivation ?? '' })
  const submit = (event) => {
    event.preventDefault()
    if (!form.identity.trim() || !form.sample.trim() || !form.motivation.trim()) return toast.error('সব তথ্য পূরণ করুন।')
    const applications = getAuthorApplications().filter((application) => application.userId !== currentUser.id)
    saveAuthorApplications([...applications, { ...form, id: existing?.id ?? `author-application-${Date.now()}`, userId: currentUser.id, name: currentUser.name, status: 'pending', feedback: '', submittedAt: new Date().toISOString() }])
    toast.success('লেখক আবেদন জমা হয়েছে।')
  }
  return <><PageHeader title="লেখক হতে আবেদন" description="আপনার পরিচয় ও লেখার নমুনা দিয়ে আবেদন করুন।" />{existing?.status === 'rejected' && <p className="mb-5 rounded-lg bg-red-50 p-4 text-red-700">আবেদনটি প্রত্যাখ্যাত হয়েছে: {existing.feedback}</p>}{existing?.status === 'pending' && <p className="mb-5 rounded-lg bg-amber-50 p-4 text-amber-800">আপনার আবেদনটি পর্যালোচনাধীন।</p>}<form onSubmit={submit} className="max-w-2xl rounded-xl bg-white p-6"><Field label="নিজের পরিচয়" value={form.identity} onChange={(value) => setForm({ ...form, identity: value })} /><Field label="লেখার নমুনা" value={form.sample} onChange={(value) => setForm({ ...form, sample: value })} rows={5} /><Field label="কেন লেখক হতে চান?" value={form.motivation} onChange={(value) => setForm({ ...form, motivation: value })} rows={4} /><button disabled={existing?.status === 'pending'} className="mt-5 rounded-md bg-primary px-5 py-2.5 font-semibold disabled:opacity-50">আবেদন জমা দিন</button></form></>
}

function Field({ label, value, onChange, rows = 3 }) { return <label className="mt-4 block text-sm font-semibold">{label}{rows > 1 ? <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={rows} className="mt-2 w-full rounded-lg border border-dark/10 bg-cream px-4 py-3" /> : <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-lg border border-dark/10 bg-cream px-4 py-3" />}</label> }

export default BecomeAuthor
