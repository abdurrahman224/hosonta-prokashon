import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  FiCheckCircle,
  FiEdit2,
  FiMoreVertical,
  FiThumbsUp,
  FiTrash2,
} from 'react-icons/fi';
import ConfirmModal from '../dashboard/ConfirmModal';
import { useAuth } from '../../context/useAuth';
import useData from '../../context/useData';
import StarRating from './StarRating';

const reasons = [
  ['spam', 'স্প্যাম'],
  ['offensive', 'আপত্তিকর'],
  ['irrelevant', 'অপ্রাসঙ্গিক'],
];

function relativeDate(date) {
  const days = Math.max(
    0,
    Math.floor((Date.now() - new Date(date).getTime()) / 86400000),
  );
  const toBengali = value =>
    String(value).replace(/\d/g, digit => '০১২৩৪৫৬৭৮৯'[digit]);
  if (days === 0) return 'আজ';
  if (days === 1) return 'গতকাল';
  if (days < 30) return `${toBengali(days)} দিন আগে`;
  if (days < 365) return `${toBengali(Math.floor(days / 30))} মাস আগে`;
  return `${toBengali(Math.floor(days / 365))} বছর আগে`;
}

function ReviewCard({ review, onEdit }) {
  const { currentUser, can } = useAuth();
  const { toggleHelpful, reportReview, deleteReview } = useData();
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isOwner = currentUser?.id === review.userId;
  const hasHelpful = currentUser && review.helpfulBy.includes(currentUser.id);
  const isLong = review.comment.length > 260;
  const displayedComment =
    !expanded && isLong ? `${review.comment.slice(0, 260)}...` : review.comment;

  const handleHelpful = () => {
    const result = toggleHelpful(review.id, currentUser?.id);
    if (!result.success) toast.error(result.message);
  };

  const handleReport = reason => {
    const result = reportReview(
      review.id,
      currentUser?.id,
      reason,
      currentUser,
    );
    toast[result.success ? 'success' : 'error'](
      result.success ? 'রিভিউ রিপোর্ট করা হয়েছে।' : result.message,
    );
  };

  const handleDelete = () => {
    const result = deleteReview(review.id, currentUser);
    setConfirmDelete(false);
    toast[result.success ? 'success' : 'error'](
      result.success ? 'রিভিউ মুছে ফেলা হয়েছে।' : result.message,
    );
  };

  return (
    <>
      <article className="border-b border-dark/10 bg-transparent px-0 py-2 first:pt-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {review.avatar ? (
              <img
                src={review.avatar}
                alt=""
                className="h-10 w-10 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-dark/10 text-xs font-bold text-dark">
                {review.userName?.slice(0, 2)}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <p className="flex items-center gap-1 font-semibold text-dark">
                  {review.userName}
                  {review.verifiedPurchase && (
                    <FiCheckCircle
                      className="text-sm text-emerald-500"
                      aria-label="যাচাইকৃত ক্রেতা"
                    />
                  )}
                </p>
                <StarRating value={review.rating} size="text-xs" />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-dark-muted">
                <span className="sm:hidden">
                  {relativeDate(review.createdAt)}
                </span>
                {review.verifiedPurchase && <span>যাচাইকৃত ক্রেতা</span>}
                {review.status === 'pending' && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">
                    অপেক্ষমাণ
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden text-xs text-dark-muted sm:inline">
              {relativeDate(review.createdAt)}
            </span>
            {isOwner && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onEdit(review)}
                  className="rounded-md p-2 text-base text-primary-hover transition hover:bg-cream"
                  aria-label="এডিট"
                  title="এডিট"
                >
                  <FiEdit2 />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="rounded-md p-2 text-base text-red-600 transition hover:bg-red-50"
                  aria-label="ডিলিট"
                  title="ডিলিট"
                >
                  <FiTrash2 />
                </button>
              </div>
            )}
          </div>
        </div>
        {review.title && (
          <h3 className="mt-3 font-heading text-lg font-bold text-dark sm:ml-[3.25rem]">
            {review.title}
          </h3>
        )}
        <p className="mt-3 leading-7 text-dark sm:ml-[3.25rem]">
          {displayedComment}
        </p>
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded(value => !value)}
            className="mt-1 text-sm font-semibold text-primary-hover sm:ml-[3.25rem]"
          >
            {expanded ? 'কম দেখুন' : 'আরও পড়ুন'}
          </button>
        )}
        {review.images?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 sm:ml-[3.25rem]">
            {review.images.map((image, index) => (
              <img
                key={`${review.id}-image-${index}`}
                src={image}
                alt={`${review.userName}-এর আপলোড করা ছবি ${index + 1}`}
                className="h-20 w-20 rounded-md object-cover"
              />
            ))}
          </div>
        )}
        <div className="mt-3 flex items-center gap-3 sm:ml-[3.25rem]">
          <button
            type="button"
            disabled={!currentUser || isOwner}
            onClick={handleHelpful}
            className={`inline-flex items-center gap-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${hasHelpful ? 'text-primary-hover' : 'text-dark-muted'}`}
          >
            <FiThumbsUp /> সহায়ক ({review.helpfulCount})
          </button>
          {currentUser && !isOwner && can('review:report') && (
            <div className="group relative">
              <button
                type="button"
                className="rounded-md p-1 text-dark-muted hover:bg-cream"
                aria-label="রিভিউ রিপোর্ট করুন"
              >
                <FiMoreVertical />
              </button>
              <div className="invisible absolute right-0 z-10 mt-1 w-32 rounded-md border border-dark/10 bg-white p-1 opacity-0 shadow-lg transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                {reasons.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleReport(value)}
                    className="block w-full rounded px-2 py-1.5 text-left text-sm text-dark hover:bg-cream"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
      <ConfirmModal
        isOpen={confirmDelete}
        title="রিভিউ মুছে ফেলবেন?"
        message="এই কাজটি পরে ফিরিয়ে আনা যাবে না।"
        confirmLabel="ডিলিট"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}

export default ReviewCard;
