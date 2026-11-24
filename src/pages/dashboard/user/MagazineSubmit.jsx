import { useRef, useState } from 'react';
import {
  FiArrowLeft,
  FiImage,
  FiPlus,
  FiRefreshCw,
  FiSend,
  FiTrash2,
  FiUploadCloud,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import { useAuth } from '../../../context/useAuth';
import { PERMISSIONS } from '../../../utils/roles';
import {
  getStoredMagazines,
  saveStoredMagazines,
} from '../../../utils/moderationStorage';

const categories = [
  'সাহিত্য',
  'পাঠাভ্যাস',
  'লেখালেখি',
  'প্রকাশনা',
  'শিশু-কিশোর',
  'অন্যান্য',
];
const defaultImage =
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=900&q=80';
const emptyForm = {
  title: '',
  category: '',
  excerpt: '',
  content: '',
  image: '',
};
const MAX_FILE_MB = 10;
const MAX_DIMENSION = 1200;

const toBn = value => Number(value).toLocaleString('bn-BD');

const formatDate = value => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('bn-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// ফোনের বড় ছবি ছোট করে JPEG বানায়, যাতে স্টোরেজ ভরে না যায়
const compressImage = file =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(
          1,
          MAX_DIMENSION / Math.max(img.width, img.height),
        );
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

function Header({ title, description }) {
  return (
    <div className="min-w-0">
      <h1 className="font-heading text-base font-bold text-dark sm:text-xl">
        {title}
      </h1>
      <p className="mt-1 text-xs leading-5 text-dark-muted sm:text-base">
        {description}
      </p>
    </div>
  );
}

function MagazineSubmit() {
  const { currentUser, can } = useAuth();
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [magazines, setMagazines] = useState(getStoredMagazines);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [processingImage, setProcessingImage] = useState(false);
  const fileInputRef = useRef(null);
  const ownMagazines = magazines.filter(
    magazine => magazine.authorId === currentUser.id,
  );

  const update = (name, value) => {
    setForm(current => ({ ...current, [name]: value }));
    if (errors[name]) setErrors(current => ({ ...current, [name]: undefined }));
  };

  const closeForm = () => {
    setView('list');
    setForm(emptyForm);
    setErrors({});
  };

  const handleFile = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('শুধু ছবি আপলোড করা যাবে।');
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`ছবির সাইজ সর্বোচ্চ ${toBn(MAX_FILE_MB)} MB হতে পারবে।`);
      return;
    }
    setProcessingImage(true);
    try {
      const dataUrl = await compressImage(file);
      update('image', dataUrl);
    } catch {
      toast.error('ছবিটি পড়া যায়নি। JPG বা PNG ছবি দিয়ে আবার চেষ্টা করুন।');
    } finally {
      setProcessingImage(false);
    }
  };

  const handleSubmit = event => {
    event.preventDefault();
    if (!can(PERMISSIONS.MAGAZINES_CREATE) || processingImage) return;
    const nextErrors = {};
    if (form.title.trim().length < 5)
      nextErrors.title = 'শিরোনাম অন্তত ৫ অক্ষরের হতে হবে।';
    if (!form.category) nextErrors.category = 'একটি বিভাগ নির্বাচন করুন।';
    if (form.excerpt.trim().length < 20)
      nextErrors.excerpt = 'সংক্ষিপ্তসার অন্তত ২০ অক্ষরের হতে হবে।';
    if (form.content.trim().length < 80)
      nextErrors.content = 'লেখাটি অন্তত ৮০ অক্ষরের হতে হবে।';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const magazine = {
      id: `magazine-${Date.now()}`,
      title: form.title.trim(),
      category: form.category,
      excerpt: form.excerpt.trim(),
      content: form.content.trim().split(/\n+/).filter(Boolean),
      image: form.image || defaultImage,
      date: new Date().toISOString(),
      status: 'pending',
      authorId: currentUser.id,
      author: currentUser.name,
    };
    const nextMagazines = [magazine, ...magazines];
    try {
      saveStoredMagazines(nextMagazines);
    } catch {
      toast.error(
        'সংরক্ষণের জায়গা শেষ। ছোট ছবি ব্যবহার করুন বা পুরনো লেখা মুছুন।',
      );
      return;
    }
    setMagazines(nextMagazines);
    closeForm();
    toast.success('আপনার Magazine অনুমোদনের জন্য জমা হয়েছে।');
  };

  /* ───────────── ফর্ম ───────────── */
  if (view === 'form') {
    return (
      <>
        <button
          type="button"
          onClick={closeForm}
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-dark-muted transition hover:text-dark sm:mb-4 sm:gap-2 sm:text-sm"
        >
          <FiArrowLeft /> তালিকায় ফিরে যান
        </button>
        <div className="mb-4 sm:mb-6">
          <Header
            title="নতুন Magazine"
            description="লেখাটি জমা দিলে অনুমোদনের পর সবার জন্য প্রকাশিত হবে।"
          />
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="grid items-start gap-3 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_340px]"
        >
          {/* বাম: লেখার অংশ */}
          <section className="rounded-md    shadow-sm sm:rounded-2xl sm:p-4">
            <h2 className="mb-3 font-heading text-sm font-bold text-dark sm:mb-5 sm:text-lg">
              লেখার বিবরণ
            </h2>
            <div className="space-y-2.5 sm:space-y-3.5">
              <Field
                label="শিরোনাম"
                value={form.title}
                error={errors.title}
                onChange={v => update('title', v)}
                placeholder="Magazine-এর শিরোনাম লিখুন"
              />
              <SelectField
                value={form.category}
                error={errors.category}
                onChange={v => update('category', v)}
              />
              <Field
                label="সংক্ষিপ্তসার"
                value={form.excerpt}
                error={errors.excerpt}
                onChange={v => update('excerpt', v)}
                placeholder="পাঠক কী জানতে পারবেন, ১-২ লাইনে লিখুন"
                textarea
                rows={2}
                min={20}
              />
              <Field
                label="মূল লেখা"
                value={form.content}
                error={errors.content}
                onChange={v => update('content', v)}
                placeholder="প্রতিটি অনুচ্ছেদ নতুন লাইনে লিখুন"
                textarea
                rows={5}
                min={80}
              />
            </div>
          </section>

          {/* ডান: কভার ছবি + জমা */}
          <aside className="space-y-3 sm:space-y-5 lg:sticky lg:top-6">
            <section className="rounded-xl border border-dark/10 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5">
              <h2 className="font-heading text-sm font-bold text-dark sm:text-lg">
                কভার ছবি
              </h2>
              <p className="mb-3 mt-0.5 text-xs text-dark-muted sm:mb-4 sm:text-sm">
                ঐচ্ছিক। না দিলে ডিফল্ট ছবি ব্যবহার হবে।
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="sr-only"
                tabIndex={-1}
              />

              {form.image ? (
                <div>
                  <div className="aspect-[16/9] overflow-hidden rounded-lg border border-dark/10 bg-cream sm:rounded-xl">
                    <img
                      src={form.image}
                      alt="কভার ছবির প্রিভিউ"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center justify-center gap-1.5 rounded-md border border-dark/15 px-3 py-2 text-xs font-semibold text-dark transition hover:bg-cream sm:text-sm"
                    >
                      <FiRefreshCw /> বদলান
                    </button>
                    <button
                      type="button"
                      onClick={() => update('image', '')}
                      className="inline-flex items-center justify-center gap-1.5 rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 sm:text-sm"
                    >
                      <FiTrash2 /> সরান
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={processingImage}
                  className="flex h-28 w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-dark/20 bg-cream/60 px-3 text-center transition hover:border-primary hover:bg-cream disabled:opacity-60 sm:aspect-video sm:h-auto sm:gap-2 sm:rounded-xl"
                >
                  {processingImage ? (
                    <span className="text-xs font-semibold text-dark sm:text-sm">
                      ছবি প্রস্তুত হচ্ছে...
                    </span>
                  ) : (
                    <>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-base text-dark shadow-sm sm:h-11 sm:w-11 sm:text-xl">
                        <FiUploadCloud />
                      </span>
                      <span className="text-xs font-semibold text-dark sm:text-sm">
                        ছবি আপলোড করুন
                      </span>
                      <span className="text-[11px] text-dark-muted sm:text-xs">
                        গ্যালারি বা ক্যামেরা • সর্বোচ্চ {toBn(MAX_FILE_MB)} MB
                      </span>
                    </>
                  )}
                </button>
              )}
            </section>

            <div className="flex flex-row gap-2 rounded-xl border border-dark/10 bg-white p-3 shadow-sm sm:gap-3 sm:rounded-2xl sm:p-5">
              <button
                type="submit"
                disabled={processingImage}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-dark transition hover:bg-primary-hover disabled:opacity-60 sm:gap-2 sm:rounded-lg sm:py-3.5 sm:text-base"
              >
                <FiSend /> জমা দিন
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="w-full rounded-md border border-dark/15 px-4 py-2.5 text-sm font-semibold text-dark transition hover:bg-cream sm:rounded-lg sm:py-3 sm:text-base"
              >
                বাতিল করুন
              </button>
            </div>
          </aside>
        </form>
      </>
    );
  }

  /* ───────────── তালিকা ───────────── */
  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <Header
          title="আমার Magazine"
          description="আপনার জমা দেওয়া লেখা ও তাদের অবস্থা এখানে দেখুন।"
        />
        <button
          type="button"
          onClick={() => setView('form')}
          className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-md bg-primary px-2.5 py-2 text-sm font-semibold text-dark shadow-sm transition hover:bg-primary-hover sm:w-auto sm:gap-2 sm:rounded-lg sm:px-2 sm:py-2 sm:text-base"
        >
          <FiPlus /> Magazine যোগ করুন
        </button>
      </div>

      {ownMagazines.length ? (
        <section className="overflow-hidden rounded-xl border border-dark/10 bg-white shadow-sm sm:rounded-2xl">
          <div className="border-b border-dark/10 px-3 py-2.5 sm:px-5 sm:py-3">
            <p className="text-xs font-semibold text-dark sm:text-sm">
              মোট {toBn(ownMagazines.length)}টি লেখা
            </p>
          </div>

          {/* ডেস্কটপ কলাম হেডার */}
          <div className="hidden grid-cols-[minmax(0,1fr)_140px_130px_130px] gap-4 border-b border-dark/10 bg-cream/60 px-5 py-2.5 text-xs font-semibold text-dark-muted md:grid">
            <span>লেখা</span>
            <span>বিভাগ</span>
            <span>তারিখ</span>
            <span>অবস্থা</span>
          </div>

          <ul className="divide-y divide-dark/10">
            {ownMagazines.map(magazine => (
              <li key={magazine.id} className="px-3 py-3 sm:px-5 sm:py-4">
                <div className="md:grid md:grid-cols-[minmax(0,1fr)_140px_130px_130px] md:items-center md:gap-4">
                  <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                    {magazine.image ? (
                      <img
                        src={magazine.image}
                        alt=""
                        loading="lazy"
                        className="h-12 w-16 shrink-0 rounded-md bg-cream object-cover sm:h-16 sm:w-20 sm:rounded-lg"
                      />
                    ) : (
                      <span className="flex h-12 w-16 shrink-0 items-center justify-center rounded-md bg-cream text-dark-muted sm:h-16 sm:w-20 sm:rounded-lg">
                        <FiImage />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 font-heading text-sm font-bold leading-snug text-dark sm:text-base">
                        {magazine.title}
                      </h3>
                      <p className="mt-0.5 line-clamp-1 text-xs text-dark-muted sm:mt-1 sm:text-sm">
                        {magazine.excerpt}
                      </p>
                    </div>
                  </div>

                  {/* মোবাইল মেটা */}
                  <div className="mt-2 flex items-center justify-between gap-2 md:hidden">
                    <span className="min-w-0 truncate text-[11px] text-dark-muted">
                      {magazine.category} • {formatDate(magazine.date)}
                    </span>
                    <span className="shrink-0 origin-right scale-90">
                      <StatusBadge status={magazine.status} />
                    </span>
                  </div>

                  {/* ডেস্কটপ কলাম */}
                  <span className="hidden text-sm text-dark md:block">
                    {magazine.category}
                  </span>
                  <span className="hidden text-sm text-dark-muted md:block">
                    {formatDate(magazine.date)}
                  </span>
                  <span className="hidden md:block">
                    <StatusBadge status={magazine.status} />
                  </span>
                </div>

                {magazine.reviewComment && (
                  <p className="mt-2 rounded-md bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800 sm:mt-3 sm:px-3 sm:py-2 sm:text-sm">
                    {magazine.reviewComment}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <div className="rounded-xl border border-dashed border-dark/20 bg-white px-4 py-10 text-center sm:rounded-2xl sm:py-16">
          <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-cream text-lg text-dark-muted sm:h-12 sm:w-12 sm:text-xl">
            <FiImage />
          </span>
          <p className="mt-3 text-sm font-semibold text-dark sm:mt-4 sm:text-base">
            এখনও কোনো Magazine জমা দেননি
          </p>
          <p className="mt-0.5 text-xs text-dark-muted sm:mt-1 sm:text-sm">
            আপনার প্রথম লেখাটি জমা দিয়ে শুরু করুন।
          </p>
          <button
            type="button"
            onClick={() => setView('form')}
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-dark transition hover:bg-primary-hover sm:mt-5 sm:gap-2 sm:rounded-lg sm:px-5 sm:py-3 sm:text-base"
          >
            <FiPlus /> Magazine যোগ করুন
          </button>
        </div>
      )}
    </>
  );
}

// মোবাইলে ইনপুটের ফন্ট ১৬px রাখা হয়েছে, নইলে iPhone-এ ফোকাস করলে পেজ অটো-জুম হয়
const inputClass = error =>
  `magazine-field w-full rounded-md border bg-white px-3 py-2 text-base text-dark outline-none transition placeholder:text-dark-muted/60 sm:rounded-lg sm:px-4 sm:py-3 ${error ? 'magazine-field-error border-red-500' : 'border-dark/15'}`;

function Field({
  label,
  value,
  error,
  onChange,
  placeholder,
  textarea = false,
  rows,
  min,
}) {
  const Element = textarea ? 'textarea' : 'input';
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between gap-2 text-xs font-semibold text-dark sm:mb-2 sm:text-sm">
        {label}
        {min && (
          <span className="text-[11px] font-normal text-dark-muted sm:text-xs">
            {toBn(value.trim().length)} / ন্যূনতম {toBn(min)}
          </span>
        )}
      </span>
      <Element
        type={textarea ? undefined : 'text'}
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        rows={textarea ? rows : undefined}
        className={`${inputClass(error)} ${textarea ? 'resize-y leading-6 sm:leading-7' : ''}`}
      />
      {error && (
        <span className="mt-1 block text-xs text-red-600 sm:text-sm">
          {error}
        </span>
      )}
    </label>
  );
}

function SelectField({ value, error, onChange }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-dark sm:mb-2 sm:text-sm">
        বিভাগ
      </span>
      <select
        value={value}
        onChange={event => onChange(event.target.value)}
        className={inputClass(error)}
      >
        <option value="">বিভাগ নির্বাচন করুন</option>
        {categories.map(category => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
      {error && (
        <span className="mt-1 block text-xs text-red-600 sm:text-sm">
          {error}
        </span>
      )}
    </label>
  );
}

export default MagazineSubmit;
