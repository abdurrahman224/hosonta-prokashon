import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FiSend, FiX } from 'react-icons/fi';
import {
  MIN_WITHDRAWAL,
  PAYMENT_METHODS,
  addPaymentRequest,
} from '../../utils/paymentStorage';

const formatMoney = value => `৳${Number(value).toLocaleString('en-US')}`;

const inputClasses =
  'w-full rounded-lg border border-dark/10 bg-cream/60 px-4 py-2.5 text-dark placeholder:text-dark/35 outline-none transition hover:border-dark/25 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/25';

function PaymentRequestModal({
  open,
  onClose,
  availableBalance,
  userId,
  onSubmitted,
}) {
  if (!open) return null;
  return (
    <ModalContent
      onClose={onClose}
      availableBalance={availableBalance}
      userId={userId}
      onSubmitted={onSubmitted}
    />
  );
}

function ModalContent({ onClose, availableBalance, userId, onSubmitted }) {
  const [form, setForm] = useState({
    amount: '',
    method: PAYMENT_METHODS[0],
    account: '',
    note: '',
  });
  const [error, setError] = useState('');
  const amountRef = useRef(null);

  useEffect(() => {
    amountRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKey = event => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const submit = event => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!amount || amount < MIN_WITHDRAWAL) {
      setError(`Minimum withdrawal is ${formatMoney(MIN_WITHDRAWAL)}.`);
      return;
    }
    if (amount > availableBalance) {
      setError(
        `Amount exceeds your available balance of ${formatMoney(availableBalance)}.`,
      );
      return;
    }
    if (!form.account.trim()) {
      setError('Enter the account or mobile number to receive payment.');
      return;
    }
    const request = addPaymentRequest({
      userId,
      amount,
      method: form.method,
      account: form.account.trim(),
      note: form.note.trim(),
    });
    toast.success('Payment request submitted.');
    onSubmitted?.(request);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-dark/60 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-request-title"
        className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[90dvh] sm:rounded-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-dark/10 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-dark">
              <FiSend />
            </span>
            <div className="min-w-0">
              <h2
                id="payment-request-title"
                className="font-heading text-lg font-bold text-dark sm:text-xl"
              >
                Request payment
              </h2>
              <p className="text-xs text-dark/60 sm:text-sm">
                Minimum withdrawal is {formatMoney(MIN_WITHDRAWAL)}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-dark/50 transition hover:bg-dark/5 hover:text-dark"
          >
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          {/* Scrollable body */}
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:space-y-5 sm:px-6 sm:py-5">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-xl bg-dark px-4 py-3.5 text-white sm:px-5 sm:py-4">
              <p className="text-sm text-white/70">Available balance</p>
              <p className="font-heading text-xl font-bold text-primary sm:text-2xl">
                {formatMoney(availableBalance)}
              </p>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700"
              >
                {error}
              </p>
            )}

            <label className="block">
              <span className="mb-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm font-semibold text-dark">
                Amount (BDT)
                <button
                  type="button"
                  onClick={() =>
                    setForm({ ...form, amount: String(availableBalance) })
                  }
                  className="text-xs font-semibold text-dark underline decoration-primary decoration-2 underline-offset-4 hover:text-primary-hover"
                >
                  Withdraw full balance
                </button>
              </span>
              <input
                ref={amountRef}
                type="number"
                min="0"
                inputMode="numeric"
                value={form.amount}
                onChange={event =>
                  setForm({ ...form, amount: event.target.value })
                }
                placeholder="e.g. 5000"
                className={inputClasses}
              />
            </label>

            <fieldset>
              <legend className="mb-1.5 text-sm font-semibold text-dark">
                Payment method
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map(method => (
                  <label
                    key={method}
                    className={`cursor-pointer rounded-lg border px-3 py-2.5 text-center text-sm font-medium transition focus-within:ring-2 focus-within:ring-primary/40 ${
                      form.method === method
                        ? 'border-dark bg-dark text-white'
                        : 'border-dark/10 bg-cream/60 text-dark/70 hover:border-dark/25'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      value={method}
                      checked={form.method === method}
                      onChange={() => setForm({ ...form, method })}
                      className="sr-only"
                    />
                    {method}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-dark">
                Account / mobile number
              </span>
              <input
                type="text"
                value={form.account}
                onChange={event =>
                  setForm({ ...form, account: event.target.value })
                }
                placeholder="Where should we send the payment?"
                className={inputClasses}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-dark">
                Note (optional)
              </span>
              <input
                type="text"
                value={form.note}
                onChange={event =>
                  setForm({ ...form, note: event.target.value })
                }
                placeholder="Anything we should know"
                className={inputClasses}
              />
            </label>
          </div>

          {/* Footer: always visible */}
          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-dark/10 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:gap-3 sm:px-6 sm:py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-dark/10 px-5 py-2.5 font-semibold text-dark/70 transition hover:bg-dark/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-dark shadow-sm transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-dark focus-visible:ring-offset-2"
            >
              <FiSend /> Request payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PaymentRequestModal;
