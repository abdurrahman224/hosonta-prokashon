import { useEffect, useId, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FiX } from 'react-icons/fi'

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  '2xl': 'max-w-4xl',
  full: 'max-w-6xl',
}

/**
 * Accessible modal dialog with Escape key close, focus trapping, and neutral surface tokens.
 */
function Modal({
  isOpen,
  onClose,
  title,
  description,
  headerIcon,
  size = 'md',
  footer,
  closeOnBackdrop = true,
  showCloseButton = true,
  className = '',
  bodyClassName = '',
  children,
}) {
  const dialogRef = useRef(null)
  const titleId = useId()

  useEffect(() => {
    if (!isOpen) return undefined
    const dialog = dialogRef.current
    const focusable = dialog?.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )
    focusable?.[0]?.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.()
        return
      }
      if (event.key !== 'Tab' || !focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeOnBackdrop ? () => onClose?.() : undefined}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-dark/50 px-4 py-6 backdrop-blur-xs overflow-y-auto"
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className={`w-full rounded-xl border border-line bg-surface text-ink shadow-modal overflow-hidden my-auto ${
              SIZE_CLASSES[size] ?? SIZE_CLASSES.md
            } ${className}`}
          >
            {(title || showCloseButton) && (
              <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
                <div className="flex items-start gap-3 min-w-0">
                  {headerIcon && (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-ink">
                      {headerIcon}
                    </span>
                  )}
                  <div className="min-w-0">
                    {title && (
                      <h2
                        id={titleId}
                        className="font-heading text-lg font-bold text-ink leading-snug"
                      >
                        {title}
                      </h2>
                    )}
                    {description && (
                      <p className="mt-0.5 text-xs text-ink-muted">{description}</p>
                    )}
                  </div>
                </div>
                {showCloseButton && (
                  <button
                    type="button"
                    onClick={() => onClose?.()}
                    className="rounded-lg p-1.5 text-ink-muted transition hover:bg-surface-muted hover:text-ink shrink-0"
                    aria-label="Close modal"
                  >
                    <FiX size={18} />
                  </button>
                )}
              </div>
            )}

            <div className={`p-5 ${bodyClassName}`}>{children}</div>

            {footer && (
              <div className="flex items-center justify-end gap-2.5 border-t border-line px-5 py-3.5">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default Modal
