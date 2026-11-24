import { useState } from 'react'
import { FiArrowLeft, FiImage, FiSave, FiSend } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PageHeader from '../../../components/dashboard/PageHeader'
import { useAuth } from '../../../context/useAuth'
import { getStoredBooks, saveStoredBooks } from '../../../utils/authorStorage'

const categories = ['কবিতা', 'উপন্যাস', 'গল্প', 'প্রবন্ধ', 'ভ্রমণ', 'সাহিত্য', 'শিশু-কিশোর']

function getInitialValue(value) {
  if (value == null) return ''
  if (typeof value === 'object') return value.bn || value.en || ''
  return String(value)
}

function BookForm() {
  const { currentUser } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)
  const existingBook = getStoredBooks().find(
    (book) => String(book.id) === id && book.authorId === currentUser.id,
  )
  const [form, setForm] = useState(() => ({
    title: getInitialValue(existingBook?.title),
    category: existingBook?.category ?? '',
    description: getInitialValue(existingBook?.description),
    price: existingBook?.price ?? '',
    pages: existingBook?.pages ?? '',
    cover: existingBook?.cover ?? '',
  }))
  const [errors, setErrors] = useState({})
  const [coverPreview, setCoverPreview] = useState(existingBook?.cover ?? '')
  const isPending = currentUser.status === 'pending'

  if (isEditing && !existingBook) {
    return <AccessDenied />
  }

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  const handleCoverChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrors((current) => ({ ...current, cover: 'শুধু ছবি আপলোড করুন।' }))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((current) => ({ ...current, cover: 'ছবির সাইজ সর্বোচ্চ ৫ MB হতে হবে।' }))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const cover = String(reader.result)
      setCoverPreview(cover)
      updateField('cover', cover)
    }
    reader.readAsDataURL(file)
  }

  const validate = () => {
    const nextErrors = {}
    if (!form.title.trim()) nextErrors.title = 'বইয়ের নাম লিখুন।'
    if (!form.category) nextErrors.category = 'ক্যাটাগরি বেছে নিন।'
    if (!form.description.trim()) nextErrors.description = 'বইয়ের বিবরণ লিখুন।'
    if (!form.price || Number(form.price) <= 0) nextErrors.price = 'সঠিক দাম লিখুন।'
    if (!form.pages || Number(form.pages) <= 0) nextErrors.pages = 'পৃষ্ঠা সংখ্যা লিখুন।'
    return nextErrors
  }

  const handleSubmit = (event, requestedStatus) => {
    event.preventDefault()
    if (isPending) return
    const nextErrors = validate()
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const books = getStoredBooks()
    const status =
      requestedStatus === 'pending' || (isEditing && existingBook.status === 'published')
        ? 'pending'
        : 'draft'
    const bookData = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      price: String(form.price),
      pages: Number(form.pages),
      authorId: currentUser.id,
      author: currentUser.name,
      status,
      publishedYear: existingBook?.publishedYear ?? new Date().getFullYear(),
      featured: existingBook?.featured ?? false,
      cover: form.cover || 'https://placehold.co/700x875/FDB82E/0A0A0A?text=হসন্ত',
    }
    const nextBooks = isEditing
      ? books.map((book) => (book.id === existingBook.id ? { ...book, ...bookData } : book))
      : [...books, { ...bookData, id: Date.now() }]
    saveStoredBooks(nextBooks)
    toast.success(status === 'pending' ? 'বইটি রিভিউয়ের জন্য জমা হয়েছে।' : 'বইটি ড্রাফট হিসেবে সেভ হয়েছে।')
    navigate('/dashboard/my-books')
  }

  return (
    <>
      <PageHeader
        title={isEditing ? 'Edit Book' : 'Add New Book'}
        description="Fill in your book details and submit for editorial review."
        action={
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard/publishing-terms"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-dark-muted transition hover:text-primary-hover"
            >
              Publishing Terms
            </Link>
            <span className="text-dark/20">|</span>
            <Link to="/dashboard/my-books" className="inline-flex items-center gap-2 font-semibold text-dark transition hover:text-primary-hover text-sm">
              <FiArrowLeft /> My Books
            </Link>
          </div>
        }
      />
      {isPending && <PendingBanner />}
      <form onSubmit={(event) => handleSubmit(event, 'draft')} className="max-w-3xl rounded-xl border border-dark/10 bg-white p-6 shadow-sm md:p-8">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <FormField label="বইয়ের নাম" name="title" value={form.title} error={errors.title} onChange={updateField} />
          </div>
          <FormField label="ক্যাটাগরি" name="category" value={form.category} error={errors.category} onChange={updateField} select options={categories} />
          <FormField label="দাম (টাকা)" name="price" type="number" value={form.price} error={errors.price} onChange={updateField} />
          <FormField label="পৃষ্ঠা সংখ্যা" name="pages" type="number" value={form.pages} error={errors.pages} onChange={updateField} />
          <label className="block md:col-span-2">
            <span className="mb-2 block font-semibold text-dark">কভার ছবি</span>
            <div className="flex flex-col gap-4 rounded-lg border border-dashed border-dark/20 bg-cream p-4 sm:flex-row sm:items-center">
              {coverPreview ? (
                <img src={coverPreview} alt="কভার প্রিভিউ" className="h-28 w-24 rounded object-cover" />
              ) : (
                <span className="flex h-28 w-24 items-center justify-center rounded bg-dark/10 text-3xl text-dark-muted"><FiImage /></span>
              )}
              <div>
                <input type="file" accept="image/*" onChange={handleCoverChange} className="block max-w-full text-sm text-dark-muted" />
                <p className="mt-2 text-xs text-dark-muted">JPG, PNG বা WEBP; সর্বোচ্চ ৫ MB</p>
                {errors.cover && <p className="mt-1 text-sm text-red-600">{errors.cover}</p>}
              </div>
            </div>
          </label>
          <div className="md:col-span-2">
            <FormField label="বিবরণ" name="description" value={form.description} error={errors.description} onChange={updateField} textarea />
          </div>
        </div>
        <div className="mt-7 flex flex-wrap gap-3 border-t border-dark/10 pt-6">
          <button type="submit" disabled={isPending} className="inline-flex items-center gap-2 rounded-md bg-dark px-5 py-3 font-semibold text-white transition hover:bg-dark-gray disabled:cursor-not-allowed disabled:opacity-40">
            <FiSave /> ড্রাফট সেভ
          </button>
          <button type="button" disabled={isPending} onClick={(event) => handleSubmit(event, 'pending')} className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 font-semibold text-dark transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40">
            <FiSend /> রিভিউয়ের জন্য জমা দিন
          </button>
        </div>
      </form>
    </>
  )
}

function FormField({ label, name, value, error, onChange, type = 'text', textarea, select, options = [], className = '' }) {
  const Field = textarea ? 'textarea' : select ? 'select' : 'input'
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block font-semibold text-dark">{label}</span>
      <Field
        name={name}
        type={textarea || select ? undefined : type}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        rows={textarea ? 6 : undefined}
        className={`w-full rounded-lg border bg-cream px-4 py-3 text-dark outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 ${error ? 'border-red-500' : 'border-dark/10'}`}
      >
        {select && (
          <>
            <option value="">ক্যাটাগরি বেছে নিন</option>
            {options.map((option) => <option key={option} value={option}>{option}</option>)}
          </>
        )}
      </Field>
      {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
    </label>
  )
}

function PendingBanner() {
  return <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-800">আপনার অ্যাকাউন্ট অনুমোদনের অপেক্ষায় আছে। অনুমোদন না হওয়া পর্যন্ত বই যোগ বা জমা দেওয়া যাবে না।</div>
}

function AccessDenied() {
  return <div className="rounded-xl border border-red-200 bg-red-50 p-10 text-center text-red-700">এই বইটি আপনার নিজের নয় অথবা পাওয়া যায়নি।</div>
}

export default BookForm
