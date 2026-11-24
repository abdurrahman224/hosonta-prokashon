import { useState } from 'react'
import toast from 'react-hot-toast'
import PageHeader from '../../../components/dashboard/PageHeader'
import { useAuth } from '../../../context/useAuth'

function Profile() {
  const { currentUser, updateProfile, changePassword } = useAuth()
  const [form, setForm] = useState({ name: currentUser.name, phone: currentUser.phone ?? '', avatar: currentUser.avatar })
  const [passwords, setPasswords] = useState({ current: '', next: '' })
  const saveProfile = (event) => {
    event.preventDefault()
    const result = updateProfile(form)
    if (result.success) toast.success('প্রোফাইল আপডেট হয়েছে।')
    else toast.error(result.message)
  }
  const savePassword = (event) => {
    event.preventDefault()
    if (passwords.next.length < 6) {
      toast.error('নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।')
      return
    }
    const result = changePassword(passwords.current, passwords.next)
    if (result.success) {
      toast.success('পাসওয়ার্ড পরিবর্তন হয়েছে।')
      setPasswords({ current: '', next: '' })
    } else toast.error(result.message)
  }
  return <><PageHeader title="আমার প্রোফাইল" description="আপনার ব্যক্তিগত তথ্য ও পাসওয়ার্ড পরিচালনা করুন।" /><div className="grid gap-6 lg:grid-cols-2"><form onSubmit={saveProfile} className="rounded-xl bg-white p-6"><h2 className="font-heading text-xl font-bold">ব্যক্তিগত তথ্য</h2>{[['name', 'নাম'], ['phone', 'ফোন'], ['avatar', 'ছবির URL']].map(([key, label]) => <label key={key} className="mt-4 block text-sm font-semibold">{label}<input value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-2 w-full rounded-lg border border-dark/10 bg-cream px-4 py-3" /></label>)}<button className="mt-5 rounded-md bg-primary px-5 py-2.5 font-semibold">সংরক্ষণ</button></form><form onSubmit={savePassword} className="rounded-xl bg-white p-6"><h2 className="font-heading text-xl font-bold">পাসওয়ার্ড পরিবর্তন</h2>{[['current', 'বর্তমান পাসওয়ার্ড'], ['next', 'নতুন পাসওয়ার্ড']].map(([key, label]) => <label key={key} className="mt-4 block text-sm font-semibold">{label}<input type="password" value={passwords[key]} onChange={(event) => setPasswords({ ...passwords, [key]: event.target.value })} className="mt-2 w-full rounded-lg border border-dark/10 bg-cream px-4 py-3" /></label>)}<button className="mt-5 rounded-md bg-primary px-5 py-2.5 font-semibold">পাসওয়ার্ড আপডেট</button></form></div></>
}

export default Profile
