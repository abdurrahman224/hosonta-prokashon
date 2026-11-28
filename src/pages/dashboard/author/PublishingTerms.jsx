import { useState } from 'react';
import {
  FiAlertCircle,
  FiArrowRight,
  FiBookOpen,
  FiCheckCircle,
  FiImage,
  FiLock,
} from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/dashboard/PageHeader';
import { useAuth } from '../../../context/useAuth';

/*
  প্রতিটি আইটেমে একটি টাইটেল থাকবে, আর তার নিচে এক বা একাধিক ছবি।
  - images: আপলোড করা ছবির লিংকগুলো এখানে দিন (এক বা একাধিক)
  - to: টাইটেল ক্লিক করলে যেখানে যাবে (না দিলে সাধারণ লেখা হিসেবে দেখাবে)
  উদাহরণ:
  { id: 1, title: 'আপনার স্বামীকে আগলে রাখুন', to: '/books/apnar-shamike-agle-rakhun', images: ['/uploads/a.jpg', '/uploads/b.jpg'] }
*/
const publishingItems = [
  {
    id: 1,
    title: 'Originality & Copyright Ownership',
    to: '',
    images: [
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=600&q=80',
    ],
  },
  {
    id: 2,
    title: 'Content & Community Guidelines',
    to: '',
    images: [
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1526243741027-444d633d7365?auto=format&fit=crop&w=600&q=80',
    ],
  },
  {
    id: 3,
    title: 'Formatting & Cover Specifications',
    to: '',
    images: [
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80',
    ],
  },
  {
    id: 4,
    title: 'Editorial Verification Process',
    to: '',
    images: [
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=600&q=80',
    ],
  },
  { id: 5, title: 'Pricing, Royalty & Payment Terms', to: '', images: [] },
];

function PublishingTerms() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [hasAgreed, setHasAgreed] = useState(false);
  const isPending = currentUser?.status === 'pending';

  const handleProceed = () => {
    if (hasAgreed && !isPending) {
      navigate('/dashboard/books/new');
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Publishing Terms & Guidelines"
        action={
          <Link
            to="/dashboard/my-books"
            className="inline-flex items-center gap-2 rounded-md border border-dark/10 bg-white px-3 py-2 text-xs font-semibold text-dark transition hover:border-primary hover:text-primary-hover"
          >
            <FiBookOpen /> Back to My Books
          </Link>
        }
      />

      {/* Account verification status */}
      {isPending ? (
        <div className="flex items-start gap-2.5 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900">
          <FiAlertCircle className="mt-0.5 shrink-0 text-base text-amber-600" />
          <p className="text-xs leading-5 sm:text-sm">
            <span className="font-semibold">
              Author verification required.{' '}
            </span>
            Adding new books is enabled once your account is verified.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 rounded-md border border-emerald-200 bg-emerald-50/70 p-3 text-emerald-900">
          <FiCheckCircle className="shrink-0 text-base text-emerald-600" />
          <p className="text-xs leading-5 sm:text-sm">
            <span className="font-semibold">Verified author.</span>
          </p>
        </div>
      )}

      {/* Title + image grid */}
      <div className="space-y-4">
        {publishingItems.map(item => (
          <section
            key={item.id}
            className="rounded-lg border border-dark/10 bg-white p-4"
          >
            {item.to ? (
              <Link
                to={item.to}
                className="font-heading text-sm font-bold text-dark transition hover:text-primary-hover md:text-base"
              >
                {item.title}
              </Link>
            ) : (
              <h3 className="font-heading text-sm font-bold text-dark md:text-base">
                {item.title}
              </h3>
            )}

            <ImageGrid images={item.images} title={item.title} />
          </section>
        ))}
      </div>

      {/* Agreement */}
      <section className="flex flex-col gap-3 rounded-lg border border-primary/40 bg-cream p-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            checked={hasAgreed}
            onChange={e => setHasAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-dark/20 accent-primary"
          />
          <span className="text-xs leading-5 text-dark sm:text-sm">
            I have read and agree to all the publishing conditions.
          </span>
        </label>

        <button
          type="button"
          onClick={handleProceed}
          disabled={!hasAgreed || isPending}
          className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-bold text-dark transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-dark disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {isPending ? (
            <>
              <FiLock /> Pending Verification
            </>
          ) : (
            <>
              Agree & Add New Book <FiArrowRight />
            </>
          )}
        </button>
      </section>
    </div>
  );
}

function ImageGrid({ images, title }) {
  if (!images || images.length === 0) {
    return (
      <div className="mt-3 flex h-28 items-center justify-center rounded-md border border-dashed border-dark/15 bg-cream text-xl text-dark/30">
        <FiImage />
      </div>
    );
  }

  const single = images.length === 1;

  return (
    <div
      className={
        single
          ? 'mt-3'
          : 'mt-3 flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:snap-none sm:grid-cols-3 sm:overflow-visible sm:pb-0 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden'
      }
    >
      {images.map((src, index) => (
        <a
          key={src}
          href={src}
          target="_blank"
          rel="noreferrer"
          className={`block overflow-hidden rounded-md border border-dark/10 bg-cream ${
            single ? '' : 'w-[42%] shrink-0 snap-start sm:w-auto'
          }`}
        >
          <img
            src={src}
            alt={`${title} - ছবি ${index + 1}`}
            loading="lazy"
            className={`w-full ${
              single
                ? 'max-h-[32rem] object-contain'
                : 'aspect-[3/4] object-cover'
            }`}
          />
        </a>
      ))}
    </div>
  );
}

export default PublishingTerms;
