import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FiAlertCircle, FiCheckCircle, FiFileText, FiX } from 'react-icons/fi'

function ReviewModal({ item, kind = 'book', onClose, onDecision }) {
  const [comment, setComment] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const [error, setError] = useState('')
  const dialogRef = useRef(null)
  const isBook = kind === 'book'
  const isMagazine = kind === 'magazine'

  useEffect(() => {
    const dialog = dialogRef.current
    const focusable = dialog?.querySelectorAll('button, textarea, [href], [tabindex]:not([tabindex="-1"])')
    focusable?.[0]?.focus()
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab' || !focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const decide = (decision) => {
    if (['revision', 'reject'].includes(decision) && !comment.trim()) {
      setError(
        decision === 'revision'
          ? 'সংশোধনের জন্য মন্তব্য লিখুন।'
          : 'প্রত্যাখ্যানের কারণ লিখুন।',
      )
      return
    }

    onDecision(decision, comment.trim(), internalNote.trim())
  }

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] flex items-center justify-center bg-dark/70 px-4 py-6 backdrop-blur-sm">
      <motion.div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="review-title" initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }} className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-dark/10 p-5 md:p-7">
          <div>
            <p className="text-sm font-semibold text-primary-hover">
              {isBook ? 'বই রিভিউ' : isMagazine ? 'Magazine রিভিউ' : 'পাণ্ডুলিপি রিভিউ'}
            </p>
            <h2 id="review-title" className="mt-1 font-heading text-2xl font-bold text-dark">{item.title}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-2 text-xl text-dark-muted hover:bg-dark/10" aria-label="বন্ধ করুন">
            <FiX />
          </button>
        </div>
        <div className="grid gap-6 p-5 md:grid-cols-[12rem_1fr] md:p-7">
          {isBook || isMagazine ? (
            <img src={item.cover ?? item.image} alt={`${item.title} প্রচ্ছদ`} className="mx-auto aspect-[4/5] w-48 rounded-lg object-cover shadow-md md:w-full" />
          ) : (
            <div className="flex aspect-[4/5] w-48 flex-col items-center justify-center rounded-lg bg-cream text-center text-dark-muted md:w-full">
              <FiFileText className="text-5xl text-primary-hover" />
              <span className="mt-3 break-all px-3 text-sm">{item.fileName}</span>
            </div>
          )}
          <div>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <Meta label="লেখক" value={item.author ?? `লেখক ID: ${item.authorId}`} />
              <Meta label="ধরন" value={item.category ?? item.type} />
              {isBook && <Meta label="দাম" value={`৳${item.price}`} />}
              {isBook && <Meta label="প্রকাশের বছর" value={item.publishedYear} />}
              {isMagazine && <Meta label="তারিখ" value={item.date} />}
              {!isBook && !isMagazine && <Meta label="জমার তারিখ" value={item.submittedAt} />}
            </dl>
            <div className="mt-6">
              <h3 className="font-semibold text-dark">{isBook ? 'বিবরণ' : 'সারসংক্ষেপ'}</h3>
              <p className="mt-2 leading-7 text-dark-muted">{item.description ?? item.summary ?? item.excerpt}</p>
            </div>
            {!isBook && item.comments && (
              <p className="mt-4 rounded-lg bg-cream p-3 text-sm leading-6 text-dark-muted">
                <strong>লেখকের মন্তব্য:</strong> {item.comments}
              </p>
            )}
          </div>
        </div>
        <div className="border-t border-dark/10 p-5 md:p-7">
          <label className="block">
            <span className="mb-2 block font-semibold text-dark">
              {isBook ? 'লেখকের জন্য মন্তব্য' : 'লেখকের জন্য ফিডব্যাক'}
            </span>
            <textarea value={comment} onChange={(event) => { setComment(event.target.value); setError('') }} rows={3} placeholder="সংশোধন বা সিদ্ধান্তের কারণ লিখুন..." className={`w-full rounded-lg border bg-cream px-4 py-3 outline-none focus:border-primary ${error ? 'border-red-500' : 'border-dark/10'}`} />
          </label>
          {!isBook && (
            <label className="mt-4 block">
              <span className="mb-2 block font-semibold text-dark">অভ্যন্তরীণ নোট (শুধু moderator/admin)</span>
              <textarea value={internalNote} onChange={(event) => setInternalNote(event.target.value)} rows={2} placeholder="টিমের জন্য নোট..." className="w-full rounded-lg border border-dark/10 bg-cream px-4 py-3 outline-none focus:border-primary" />
            </label>
          )}
          {error && <p className="mt-2 flex items-center gap-2 text-sm text-red-600"><FiAlertCircle /> {error}</p>}
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button type="button" onClick={() => decide('reject')} className="inline-flex items-center gap-2 rounded-md border border-red-200 px-4 py-2.5 font-semibold text-red-600 hover:bg-red-50"><FiX /> প্রত্যাখ্যান</button>
            <button type="button" onClick={() => decide('revision')} className="rounded-md border border-amber-200 px-4 py-2.5 font-semibold text-amber-700 hover:bg-amber-50">সংশোধন চান</button>
            <button type="button" onClick={() => decide('approve')} className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-700"><FiCheckCircle /> অনুমোদন</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
    </AnimatePresence>
  )
}

function Meta({ label, value }) {
  return <div><dt className="text-dark-muted">{label}</dt><dd className="mt-1 font-semibold text-dark">{value}</dd></div>
}

export default ReviewModal
