import { useState } from 'react'
import toast from 'react-hot-toast'
import { FiArrowRight, FiUserPlus } from 'react-icons/fi'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import SEO from '../../components/common/SEO'

function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    wantsToBeAuthor: false,
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!form.name.trim()) nextErrors.name = 'আপনার নাম লিখুন।'
    if (!form.email.trim()) nextErrors.email = 'আপনার ইমেইল লিখুন।'
    if (form.password.length < 6) {
      nextErrors.password = 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'
    }
    if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = 'পাসওয়ার্ড দুটো একই নয়।'
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setIsSubmitting(true)
    const result = register(form)
    if (!result.success) {
      setIsSubmitting(false)
      setErrors({ email: result.message })
      return
    }

    toast.success(
      form.wantsToBeAuthor
        ? 'লেখক আবেদনসহ রেজিস্ট্রেশন হয়েছে। অনুমোদনের পর লগইন করতে পারবেন।'
        : 'রেজিস্ট্রেশন সম্পন্ন হয়েছে। এখনই লগইন করতে পারবেন।',
    )
    navigate('/login', { replace: true })
  }

  return (
    <main className="flex min-h-[75vh] items-center justify-center bg-cream px-5 py-12 md:py-20">
      <SEO title="রেজিস্টার | হসন্ত প্রকাশন" description="হসন্ত প্রকাশনে নতুন অ্যাকাউন্ট তৈরি করুন।" noIndex />
      <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-xl md:p-9">
        <div className="text-center">
          <p className="font-heading text-sm font-semibold uppercase tracking-widest text-primary-hover">
            হসন্ত প্রকাশন
          </p>
          <h1 className="mt-3 font-heading text-3xl font-bold text-dark">
            নতুন অ্যাকাউন্ট তৈরি করুন
          </h1>
          <p className="mt-2 text-dark-muted">আমাদের প্রকাশনা পরিবারের অংশ হোন।</p>
        </div>
        <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
          <FormField
            label="নাম"
            name="name"
            value={form.name}
            error={errors.name}
            onChange={handleChange}
            placeholder="আপনার নাম"
          />
          <FormField
            label="ইমেইল"
            name="email"
            type="email"
            value={form.email}
            error={errors.email}
            onChange={handleChange}
            placeholder="আপনার ইমেইল"
          />
          <FormField
            label="পাসওয়ার্ড"
            name="password"
            type="password"
            value={form.password}
            error={errors.password}
            onChange={handleChange}
            placeholder="কমপক্ষে ৬ অক্ষর"
          />
          <FormField
            label="পাসওয়ার্ড নিশ্চিত করুন"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            error={errors.confirmPassword}
            onChange={handleChange}
            placeholder="পাসওয়ার্ড আবার লিখুন"
          />
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-dark/10 bg-cream p-4">
            <input
              type="checkbox"
              name="wantsToBeAuthor"
              checked={form.wantsToBeAuthor}
              onChange={handleChange}
              className="mt-1 h-4 w-4 accent-primary"
            />
            <span>
              <span className="block font-semibold text-dark">আমি লেখক হতে চাই</span>
              <span className="mt-1 block text-sm leading-6 text-dark-muted">
                আপনার অ্যাকাউন্ট author হিসেবে অনুমোদনের অপেক্ষায় থাকবে।
              </span>
            </span>
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-3.5 font-semibold text-dark transition hover:bg-primary-hover"
          >
            {isSubmitting ? <LoadingSpinner label="রেজিস্টার করা হচ্ছে..." /> : <>রেজিস্টার করুন <FiUserPlus /></>}
          </button>
        </form>
        <p className="mt-7 text-center text-dark-muted">
          আগে থেকেই অ্যাকাউন্ট আছে?{' '}
          <Link to="/login" className="font-semibold text-primary-hover hover:text-dark">
            লগইন করুন <FiArrowRight className="inline" />
          </Link>
        </p>
      </div>
    </main>
  )
}

function FormField({ label, name, type = 'text', value, error, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="mb-2 block font-semibold text-dark">{label}</span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full rounded-lg border bg-cream px-4 py-3 text-dark outline-none transition placeholder:text-dark-light focus:border-primary focus:ring-2 focus:ring-primary/20 ${
          error ? 'border-red-500' : 'border-dark/10'
        }`}
        aria-invalid={Boolean(error)}
      />
      {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
    </label>
  )
}

export default Register
