import { FiAlertTriangle } from 'react-icons/fi'
import Button from './Button'
import Modal from './Modal'

/**
 * Confirmation modal using semantic danger icon (no colored background) and shared Buttons.
 */
function ConfirmModal({
  isOpen,
  title = 'নিশ্চিত করুন',
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'নিশ্চিত করুন',
  cancelLabel = 'বাতিল',
  danger = true,
  loading = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      size="sm"
      showCloseButton={false}
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            size="md"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3.5">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-lg ${
            danger ? 'text-status-danger' : 'text-status-warning'
          }`}
        >
          <FiAlertTriangle />
        </span>
        <div>
          <h3 className="font-heading text-lg font-bold text-ink">{title}</h3>
          {message && <p className="mt-1.5 text-sm leading-6 text-ink-muted">{message}</p>}
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmModal
