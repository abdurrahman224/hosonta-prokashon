import { useState } from 'react'
import { FiFacebook, FiMail, FiMapPin, FiPhone, FiSend } from 'react-icons/fi'
import toast from 'react-hot-toast'

const initialForm = {
  name: '',
  email: '',
  subject: '',
  message: '',
}

function Contact() {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  const validate = () => {
    const nextErrors = {}
    if (!form.name.trim()) nextErrors.name = 'আপনার নাম লিখুন।'
    if (!form.email.trim()) {
      nextErrors.email = 'আপনার ইমেইল লিখুন।'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = 'সঠিক ইমেইল ঠিকানা লিখুন।'
    }
    if (!form.subject.trim()) nextErrors.subject = 'বিষয় লিখুন।'
    if (!form.message.trim()) nextErrors.message = 'আপনার বার্তা লিখুন।'
    return nextErrors
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validate()
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    toast.success('আপনার বার্তা সফলভাবে পাঠানো হয়েছে।')
    setForm(initialForm)
    setErrors({})
  }

  return (
    <div className="bg-cream">
      <section className="bg-dark px-5 py-16 text-white md:px-8 md:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="font-heading text-sm font-semibold uppercase tracking-widest text-primary">
            হসন্ত প্রকাশন
          </p>
          <h1 className="mt-3 font-heading text-4xl font-bold md:text-5xl">
            যোগাযোগ করুন
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-white/65">
            আপনার কথা, প্রশ্ন বা পাণ্ডুলিপি নিয়ে আমাদের লিখুন।
          </p>
        </div>
      </section>

      <main className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:px-8 md:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
        <section className="rounded-xl bg-white p-6 shadow-sm md:p-8">
          <h2 className="font-heading text-3xl font-bold text-dark">বার্তা পাঠান</h2>
          <p className="mt-2 text-dark-muted">
            নিচের ফর্মটি পূরণ করুন, আমরা শীঘ্রই আপনার সঙ্গে যোগাযোগ করব।
          </p>
          <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-5">
            <FormField
              label="আপনার নাম"
              name="name"
              value={form.name}
              error={errors.name}
              onChange={handleChange}
              placeholder="নাম লিখুন"
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
              label="বিষয়"
              name="subject"
              value={form.subject}
              error={errors.subject}
              onChange={handleChange}
              placeholder="কী বিষয়ে লিখছেন?"
            />
            <FormField
              label="বার্তা"
              name="message"
              value={form.message}
              error={errors.message}
              onChange={handleChange}
              placeholder="আপনার বার্তা লিখুন..."
              textarea
            />
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md bg-dark px-6 py-3.5 font-semibold text-white transition hover:bg-dark-gray"
            >
              <FiSend /> বার্তা পাঠান
            </button>
          </form>
        </section>

        <aside className="lg:pt-8">
          <p className="font-heading text-sm font-semibold uppercase tracking-widest text-primary-hover">
            যোগাযোগের তথ্য
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold text-dark">
            কথা বলতে চাইলে
            <span className="block">আমরা আছি পাশে</span>
          </h2>
          <div className="mt-8 space-y-5">
            <ContactInfo icon={<FiMapPin />} title="ঠিকানা" text="ঢাকা, বাংলাদেশ" />
            <ContactInfo icon={<FiPhone />} title="ফোন" text="+৮৮০ ১৭১১-০০০০০০" />
            <ContactInfo
              icon={<FiMail />}
              title="ইমেইল"
              text="info@hosontoprokashon.com"
            />
          </div>

          <a
            href="https://www.facebook.com/"
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center gap-2 font-semibold text-dark transition hover:text-primary-hover"
          >
            <FiFacebook /> ফেসবুকে আমাদের অনুসরণ করুন
          </a>
        </aside>
      </main>
    </div>
  )
}

function ContactInfo({ icon, title, text }) {
  return (
    <div className="flex items-start gap-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-xl text-dark">
        {icon}
      </span>
      <div>
        <h3 className="font-semibold text-dark">{title}</h3>
        <p className="mt-1 text-dark-muted">{text}</p>
      </div>
    </div>
  )
}

function FormField({
  label,
  name,
  value,
  error,
  onChange,
  placeholder,
  type = 'text',
  textarea = false,
}) {
  const Component = textarea ? 'textarea' : 'input'

  return (
    <label className="block">
      <span className="mb-2 block font-semibold text-dark">{label}</span>
      <Component
        type={textarea ? undefined : type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={textarea ? 5 : undefined}
        className={`w-full rounded-lg border bg-cream px-4 py-3 text-dark outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 ${
          error ? 'border-red-500' : 'border-dark/10'
        }`}
      />
      {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
    </label>
  )
}

export default Contact
