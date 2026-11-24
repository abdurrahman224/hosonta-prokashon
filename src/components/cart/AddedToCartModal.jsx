import { useEffect, useRef } from 'react'
import { FiX } from 'react-icons/fi'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

function AddedToCartModal({ isOpen, item, onClose }) {
  const navigate = useNavigate()
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()

    const handleKeyDown = event => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  const book = item?.book
  if (!book) return null

  const goToCart = () => {
    onClose()
    navigate('/cart')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-dark/70 px-4 py-3 backdrop-blur-[2px]"
          onMouseDown={event => {
            if (event.target === event.currentTarget) onClose()
          }}
        >
          <motion.div
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="added-cart-title"
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.28)]"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-lg text-dark-muted shadow-sm transition hover:bg-cream hover:text-dark"
              aria-label="বন্ধ করুন"
            >
              <FiX />
            </button>

            <div className="border-b border-dark/10 px-4 py-2.5 text-center sm:px-7 sm:py-6">
              <h2
                id="added-cart-title"
                className="mt-3 font-heading text-base font-semibold text-dark "
              >
                পণ্যটি আপনার কার্টে যুক্ত হয়েছে
              </h2>
            </div>

            <div className="px-5 py-5 sm:px-7">
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={goToCart}
                  className="rounded-lg bg-red-600 px-3 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 active:scale-[0.98]"
                >
                  শপিং ব্যাগ
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg bg-primary px-3 py-3 text-sm font-bold text-dark shadow-sm transition hover:bg-primary-hover active:scale-[0.98]"
                >
                  আরও কিনুন
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AddedToCartModal
