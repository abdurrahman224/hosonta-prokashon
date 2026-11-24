import { useState } from 'react'
import { FiArrowRight, FiEye, FiEyeOff, FiLogIn } from 'react-icons/fi'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import SEO from '../../components/common/SEO'

const demoAccounts = [
  { role: 'admin', email: 'admin@hosontoprokashon.com', password: 'admin123' },
  { role: 'moderator', email: 'moderator@hosontoprokashon.com', password: 'moderator123' },
  { role: 'author', email: 'author@hosontoprokashon.com', password: 'author123' },
  { role: 'employee', email: 'employee@hosontoprokashon.com', password: 'employee123' },
  { role: 'user', email: 'reader@hosontoprokashon.com', password: 'reader123' },
]

const roleLabels = {
  admin: 'প্রশাসক',
  moderator: 'মডারেটর',
  author: 'লেখক',
  employee: 'কর্মী',
  user: 'ব্যবহারকারী',
}

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(location.state?.message ?? '')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!form.email.trim() || !form.password) {
      setError('ইমেইল ও পাসওয়ার্ড দুটোই লিখুন।')
      return
    }

    setIsSubmitting(true)
    const result = login(form.email, form.password)
    if (!result.success) {
      setIsSubmitting(false)
      setError(result.message)
      return
    }

    const destination = location.state?.from?.pathname ?? '/dashboard'
    navigate(destination, { replace: true })
  }

  const loginWithDemo = (account) => {
    const result = login(account.email, account.password)
    if (result.success) {
      navigate('/dashboard', { replace: true })
    } else {
      setError(result.message)
    }
  }

  return (
    <AuthShell
      eyebrow="হসন্ত প্রকাশন"
      title="আপনার অ্যাকাউন্টে প্রবেশ করুন"
      subtitle="আপনার কাজের জগতে ফিরে আসুন।"
    >
      <SEO title="লগইন | হসন্ত প্রকাশন" description="হসন্ত প্রকাশন অ্যাকাউন্টে লগইন করুন।" noIndex />
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {error && <Alert message={error} />}
        <FormField
          label="ইমেইল"
          type="email"
          value={form.email}
          onChange={(value) => setForm({ ...form, email: value })}
          placeholder="আপনার ইমেইল"
        />
        <div>
          <FormField
            label="পাসওয়ার্ড"
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={(value) => setForm({ ...form, password: value })}
            placeholder="পাসওয়ার্ড লিখুন"
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            className="-mt-10 mr-3 float-right text-lg text-dark-muted transition hover:text-dark"
            aria-label={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-3.5 font-semibold text-dark transition hover:bg-primary-hover"
        >
          {isSubmitting ? <LoadingSpinner label="প্রবেশ করা হচ্ছে..." /> : <>লগইন করুন <FiLogIn /></>}
        </button>
      </form>

      <div className="mt-8 border-t border-dark/10 pt-6">
        <p className="text-center text-sm font-semibold text-dark">ডেমো লগইন</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {demoAccounts.map((account) => (
            <button
              type="button"
              key={account.role}
              onClick={() => loginWithDemo(account)}
              className="rounded-md border border-dark/10 px-3 py-2 text-sm font-semibold text-dark transition hover:border-primary hover:bg-primary/10"
            >
              {roleLabels[account.role] || account.role}
            </button>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-dark-muted">
          শুধু development ব্যবহারের জন্য
        </p>
      </div>

      <p className="mt-7 text-center text-dark-muted">
        অ্যাকাউন্ট নেই?{' '}
        <Link to="/register" className="font-semibold text-primary-hover hover:text-dark">
          রেজিস্টার করুন <FiArrowRight className="inline" />
        </Link>
      </p>
    </AuthShell>
  )
}

function AuthShell({ eyebrow, title, subtitle, children }) {
  return (
    <main className="flex min-h-[75vh] items-center justify-center bg-cream px-5 py-12 md:py-20">
      <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-xl md:p-9">
        <div className="text-center">
          <p className="font-heading text-sm font-semibold uppercase tracking-widest text-primary-hover">
            {eyebrow}
          </p>
          <h1 className="mt-3 font-heading text-3xl font-bold text-dark">{title}</h1>
          <p className="mt-2 text-dark-muted">{subtitle}</p>
        </div>
        <div className="mt-8">{children}</div>
      </div>
    </main>
  )
}

function FormField({ label, type, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="mb-2 block font-semibold text-dark">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-dark/10 bg-cream px-4 py-3 text-dark outline-none transition placeholder:text-dark-light focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  )
}

function Alert({ message }) {
  return (
    <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
      {message}
    </p>
  )
}

export default Login
