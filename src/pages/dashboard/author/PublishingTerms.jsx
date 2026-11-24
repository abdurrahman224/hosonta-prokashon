import { useState } from 'react';
import {
  FiAlertCircle,
  FiArrowRight,
  FiBookOpen,
  FiCheckCircle,
  FiDollarSign,
  FiFileText,
  FiImage,
  FiLock,
  FiShield,
} from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/dashboard/PageHeader';
import { useAuth } from '../../../context/useAuth';

const publishingConditions = [
  {
    id: 1,
    icon: FiShield,
    title: '1. Originality & Copyright Ownership',
    description:
      'The book must be an entirely original work authored by you. Any form of plagiarism, unauthorized translation, or copyright infringement is strictly prohibited and will lead to immediate delisting.',
    points: [
      'You must hold 100% exclusive publishing rights to the manuscript.',
      'Quotations and references must be appropriately cited.',
      'AI-generated content without substantial human authorship must be declared.',
    ],
  },
  {
    id: 2,
    icon: FiFileText,
    title: '2. Content & Community Guidelines',
    description:
      'Hosonta Prokashon upholds constructive cultural values. Content must respect ethical standards and comply with national publication laws.',
    points: [
      'Zero tolerance for hate speech, communal provocation, or defamation.',
      'Must not violate legal, security, or privacy regulations.',
      'Sensitive themes must include appropriate reader advisories.',
    ],
  },
  {
    id: 3,
    icon: FiImage,
    title: '3. Formatting & Cover Specifications',
    description:
      'Quality visual presentation ensures optimal printing and reader satisfaction. Please prepare your assets according to standard dimensions.',
    points: [
      'Cover image must be sharp, high-resolution (recommended 1200x1600px, aspect ratio 3:4).',
      'Accurate page count and realistic retail pricing must be provided.',
      'Proper synopsis/description in both Bengali and English where applicable.',
    ],
  },
  {
    id: 4,
    icon: FiCheckCircle,
    title: '4. Editorial Verification Process',
    description:
      'Every newly added book goes through editorial moderation before being published publicly on the marketplace.',
    points: [
      'Submitted books are initially marked as "Pending" review.',
      'The editorial board reviews submissions within 24-48 business hours.',
      'Authors receive review feedback directly in their dashboard.',
    ],
  },
  {
    id: 5,
    icon: FiDollarSign,
    title: '5. Pricing, Royalty & Payment Terms',
    description:
      'Transparent royalty distribution per copy sold, tracked live in your author analytics dashboard.',
    points: [
      'Royalty is calculated automatically per delivered customer order.',
      'Payout requests can be submitted once the minimum balance is reached.',
      'Hosonta handles distribution, customer delivery, and packaging.',
    ],
  },
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
    <div className="space-y-6">
      <PageHeader
        title="Publishing Terms & Guidelines"
        description="Carefully review the editorial requirements and terms before adding a new title to Hosonta Prokashon."
        action={
          <Link
            to="/dashboard/my-books"
            className="inline-flex items-center gap-2 rounded-xl border border-dark/10 bg-white px-4 py-2.5 text-xs font-semibold text-dark shadow-xs transition hover:border-primary hover:text-primary-hover sm:text-sm"
          >
            <FiBookOpen /> Back to My Books
          </Link>
        }
      />

      {/* Account Verification Status */}
      {isPending ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-xs">
          <FiAlertCircle className="mt-0.5 text-xl shrink-0 text-amber-600" />
          <div className="text-sm">
            <p className="font-semibold">Author Verification Required</p>
            <p className="mt-1 text-amber-800">
              Your author account is currently awaiting verification by our editorial team.
              You can review the publishing guidelines below, but adding new books is enabled once your account is fully verified.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-emerald-900 shadow-xs">
          <FiCheckCircle className="text-xl text-emerald-600 shrink-0" />
          <p className="text-sm font-medium">
            <span className="font-semibold text-emerald-800">Verified Author Status:</span> You are eligible to publish books upon agreeing to the conditions below.
          </p>
        </div>
      )}

      {/* Condition Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {publishingConditions.map(item => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="rounded-2xl border border-dark/10 bg-white p-6 shadow-xs transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/20 text-xl text-dark">
                  <Icon />
                </span>
                <h3 className="font-heading text-base font-bold text-dark">
                  {item.title}
                </h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-dark-muted">
                {item.description}
              </p>
              <ul className="mt-4 space-y-2 border-t border-dark/5 pt-3">
                {item.points.map((point, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-xs text-dark/80"
                  >
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Agreement & Action Card */}
      <div className="rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-cream to-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <h3 className="font-heading text-lg font-bold text-dark md:text-xl">
              Author Agreement & Confirmation
            </h3>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={hasAgreed}
                onChange={e => setHasAgreed(e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-dark/20 text-primary accent-primary focus:ring-primary"
              />
              <span className="text-sm font-medium leading-relaxed text-dark">
                I have read, understood, and solemnly agree to adhere to all the publication conditions, copyright policies, and editorial standards of Hosonta Prokashon.
              </span>
            </label>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              onClick={handleProceed}
              disabled={!hasAgreed || isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-dark shadow-sm transition-all hover:bg-primary-hover hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 md:w-auto"
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default PublishingTerms;
