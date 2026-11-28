import { useEffect } from 'react';
import { FiDownload, FiExternalLink, FiFileText, FiX } from 'react-icons/fi';
import { getBookSlug } from '../../utils/bookSlug';

function BookPdfModal({ book, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!book) return null;

  const title = book.title?.bn || book.title || 'বই প্রিভিউ';
  const author = book.author?.bn || book.author || 'লেখক';
  const fileLabel = book.samplePdfName || `${getBookSlug(book)}.pdf`;
  const hasRealPdf = Boolean(book.samplePdfUrl);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-xs sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} PDF`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-dark/10 bg-dark px-4 py-3 text-white sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-dark">
              <FiFileText size={16} />
            </span>
            <div className="min-w-0">
              <p className="truncate font-heading text-sm font-bold text-white">
                {title}
              </p>
              <p className="truncate text-[11px] text-white/65">{fileLabel}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasRealPdf && (
              <>
                <a
                  href={book.samplePdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-dark transition hover:bg-primary-hover"
                >
                  <FiExternalLink size={13} />
                  <span>খুলুন</span>
                </a>
                <a
                  href={book.samplePdfUrl}
                  download={fileLabel}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
                >
                  <FiDownload size={13} />
                  <span>ডাউনলোড</span>
                </a>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="বন্ধ করুন"
              className="rounded-lg p-1.5 text-white/75 transition hover:bg-white/10 hover:text-white"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-cream p-4 sm:p-5">
          {hasRealPdf ? (
            <iframe
              src={book.samplePdfUrl}
              title={title}
              className="h-[72vh] w-full rounded-xl border border-dark/10 bg-white"
            />
          ) : (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-dark/20 bg-white p-6 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary-hover">
                <FiFileText size={22} />
              </span>
              <h3 className="mt-3 font-heading text-base font-bold text-dark">
                {title}
              </h3>
              <p className="mt-1 text-xs text-dark-muted">লেখক: {author}</p>
              <p className="mt-3 max-w-md text-xs leading-relaxed text-dark-muted sm:text-sm">
                এই বইটির নমুনা PDF এখনো যুক্ত করা হয়নি। PDF ফাইল যুক্ত করলে এখান থেকেই সরাসরি পড়া যাবে।
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-5 rounded-lg bg-primary px-5 py-2 text-xs font-bold text-dark transition hover:bg-primary-hover"
              >
                বন্ধ করুন
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BookPdfModal;
