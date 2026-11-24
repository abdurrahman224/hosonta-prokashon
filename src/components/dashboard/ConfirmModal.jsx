import { useEffect, useRef } from 'react'
import { FiAlertTriangle, FiX } from 'react-icons/fi'
import { AnimatePresence, motion } from 'framer-motion'

function ConfirmModal({ isOpen, title = 'নিশ্চিত করুন', message, onConfirm, onCancel, confirmLabel = 'নিশ্চিত করুন' }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return undefined
    const dialog = dialogRef.current
    const focusable = dialog?.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])')
    focusable?.[0]?.focus()
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCancel()
      if (event.key !== 'Tab' || !focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel])

  return (
    <AnimatePresence>
      {isOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] flex items-center justify-center bg-dark/70 px-5 backdrop-blur-sm">
      <motion.div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="confirm-title" initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }} className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-xl text-red-600">
            <FiAlertTriangle />
          </span>
          <button type="button" onClick={onCancel} className="rounded-md p-1 text-dark-muted hover:bg-dark/10" aria-label="বন্ধ করুন">
            <FiX />
          </button>
        </div>
        <h2 id="confirm-title" className="mt-5 font-heading text-2xl font-bold text-dark">{title}</h2>
        <p className="mt-2 leading-7 text-dark-muted">{message}</p>
        <div className="mt-7 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-md border border-dark/10 px-4 py-2.5 font-semibold text-dark transition hover:bg-gray-100">
            বাতিল
          </button>
          <button type="button" onClick={onConfirm} className="rounded-md bg-red-600 px-4 py-2.5 font-semibold text-white transition hover:bg-red-700">
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>}
    </AnimatePresence>
  )
}

export default ConfirmModal
