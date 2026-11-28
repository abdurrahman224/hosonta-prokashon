import { useState } from 'react';
import { FiPhoneCall, FiX } from 'react-icons/fi';
import {
  FOLLOWUP_CHANNELS,
  FOLLOWUP_OUTCOMES,
  addFollowUpLog,
} from '../../utils/followUpStorage';

export default function FollowUpModal({
  isOpen,
  user,
  retargetBooksHint = '',
  currentUser,
  onClose,
  onSaved,
}) {
  const [channel, setChannel] = useState('Phone Call');
  const [outcome, setOutcome] = useState(FOLLOWUP_OUTCOMES[0]);
  const [retargetBooks, setRetargetBooks] = useState(retargetBooksHint);
  const [note, setNote] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');

  if (!isOpen || !user) return null;

  const inputCls =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-primary';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!note.trim()) return;

    const saved = addFollowUpLog({
      userId: user.id,
      userName: user.name,
      userPhone: user.phone || '',
      followedById: currentUser?.id || 'staff',
      followedByName: currentUser?.name || 'Moderator',
      followedByRole: currentUser?.role || 'moderator',
      channel,
      outcome,
      retargetBooks,
      note,
      nextFollowUpDate,
    });

    setNote('');
    if (onSaved) onSaved(saved);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl bg-white p-5 sm:p-6 shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <FiPhoneCall className="text-emerald-600" size={16} />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Log Follow-Up & Retargeting Note
              </h3>
              <p className="text-[11px] text-slate-500">
                {user.name} {user.phone ? `· ${user.phone}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 text-slate-400 hover:text-dark"
          >
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-semibold text-slate-700">
                Channel
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className={inputCls}
              >
                {FOLLOWUP_CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block font-semibold text-slate-700">
                Outcome / Status
              </label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className={inputCls}
              >
                {FOLLOWUP_OUTCOMES.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block font-semibold text-slate-700">
              Retargeted Books (Cart / Wishlist)
            </label>
            <input
              type="text"
              value={retargetBooks}
              onChange={(e) => setRetargetBooks(e.target.value)}
              placeholder="e.g. Cart or Wishlist book titles..."
              className={inputCls}
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-slate-700">
              Follow-Up Update Note *
            </label>
            <textarea
              required
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Write call update, customer interest, discount offer, or next action..."
              className={inputCls}
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-slate-700">
              Next Follow-Up Date (Optional)
            </label>
            <input
              type="date"
              value={nextFollowUpDate}
              onChange={(e) => setNextFollowUpDate(e.target.value)}
              className={inputCls}
            />
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500">
            <span>
              Followed up by:{' '}
              <strong className="text-slate-800">{currentUser?.name}</strong> (
              {currentUser?.role})
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-dark hover:bg-primary-hover"
              >
                Save Update
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
