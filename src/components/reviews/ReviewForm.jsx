import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { FiImage, FiSend, FiX } from 'react-icons/fi'
import StarRating from './StarRating'
import useData from '../../context/useData'
import { useAuth } from '../../context/useAuth'

const MAX_IMAGES = 3
const MAX_IMAGE_SIZE = 2 * 1024 * 1024

function ReviewForm({ bookId, review, onSubmitted, onCancel }) {
  const { addReview, updateReview } = useData()
  const { currentUser, can } = useAuth()
  const [rating, setRating] = useState(review?.rating ?? 0)
  const [title, setTitle] = useState(review?.title ?? '')
  const [comment, setComment] = useState(review?.comment ?? '')
  const [images, setImages] = useState(review?.images ?? [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef(null)

  if (!currentUser || !can('review:write')) return null

  const handleImages = (event) => {
    const files = Array.from(event.target.files ?? [])
    if (files.length + images.length > MAX_IMAGES) {
      toast.error(`সর্বোচ্চ ${MAX_IMAGES}টি ছবি যোগ করা যাবে।`)
      event.target.value = ''
      return
    }
    const invalidFile = files.find((file) => !file.type.startsWith('image/') || file.size > MAX_IMAGE_SIZE)
    if (invalidFile) {
      toast.error('শুধু ছবি এবং সর্বোচ্চ ২ MB আকারের ফাইল আপলোড করুন।')
      event.target.value = ''
      return
    }
    Promise.all(files.map((file) => new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    }))).then((newImages) => setImages((current) => [...current, ...newImages])).catch(() => toast.error('ছবি পড়া যায়নি।'))
    event.target.value = ''
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!rating) return toast.error('রেটিং নির্বাচন করুন।')
    if (comment.trim().length < 20) return toast.error('মন্তব্যে অন্তত ২০টি অক্ষর লিখুন।')
    if (comment.trim().length > 1000) return toast.error('মন্তব্য সর্বোচ্চ ১০০০ অক্ষর হতে পারবে।')
    if (title.trim().length > 80) return toast.error('শিরোনাম সর্বোচ্চ ৮০ অক্ষর হতে পারবে।')
    setIsSubmitting(true)
    const result = review
      ? updateReview(review.id, { rating, title, comment, images }, currentUser)
      : addReview({ bookId, rating, title, comment, images }, currentUser)
    setIsSubmitting(false)
    if (!result.success) return toast.error(result.message)
    toast.success('আপনার রিভিউ অনুমোদনের জন্য জমা হয়েছে।')
    onSubmitted?.()
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-dark/10 bg-white p-5 md:p-7">
      <h3 className="font-heading text-2xl font-bold text-dark">
        {review ? 'রিভিউ সম্পাদনা করুন' : 'আপনার রিভিউ লিখুন'}
      </h3>
      <label className="mt-5 block text-sm font-semibold text-dark">রেটিং</label>
      <StarRating value={rating} onChange={setRating} interactive size="text-2xl" />
      <label className="mt-5 block text-sm font-semibold text-dark" htmlFor="review-title">শিরোনাম (ঐচ্ছিক)</label>
      <input id="review-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} className="mt-2 w-full rounded-md border border-dark/10 bg-cream px-4 py-3 text-dark outline-none focus:border-primary" />
      <label className="mt-5 block text-sm font-semibold text-dark" htmlFor="review-comment">আপনার মন্তব্য</label>
      <textarea id="review-comment" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={1000} rows={5} className="mt-2 w-full resize-y rounded-md border border-dark/10 bg-cream px-4 py-3 leading-7 text-dark outline-none focus:border-primary" />
      <p className="mt-1 text-right text-xs text-dark-muted">{comment.length}/১০০০</p>
      <div className="mt-5">
        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImages} className="hidden" />
        <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-md border border-dark/10 px-4 py-2.5 text-sm font-semibold text-dark transition hover:bg-cream">
          <FiImage /> ছবি যোগ করুন (সর্বোচ্চ ৩টি)
        </button>
        {images.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-3">
            {images.map((image, index) => (
              <div key={`${image.slice(0, 20)}-${index}`} className="relative">
                <img src={image} alt={`আপলোড করা ছবি ${index + 1}`} className="h-20 w-20 rounded-md object-cover" />
                <button type="button" onClick={() => setImages((current) => current.filter((_, imageIndex) => imageIndex !== index))} className="absolute -right-2 -top-2 rounded-full bg-dark p-1 text-white" aria-label="ছবি সরান"><FiX className="text-xs" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        {onCancel && <button type="button" onClick={onCancel} className="rounded-md border border-dark/10 px-5 py-3 font-semibold text-dark">বাতিল</button>}
        <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 font-semibold text-dark transition hover:bg-primary-hover disabled:cursor-wait disabled:opacity-60">
          <FiSend /> {isSubmitting ? 'জমা হচ্ছে...' : 'রিভিউ জমা দিন'}
        </button>
      </div>
    </form>
  )
}

export default ReviewForm
