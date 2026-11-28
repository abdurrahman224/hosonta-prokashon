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
import {
  MAGAZINE_CATEGORIES,
  getLocalizedValue,
  getMagazineCategoryLabel,
} from '../../../utils/i18n';
import { PERMISSIONS } from '../../../utils/roles';
import {
  getStoredMagazines,
  saveStoredMagazines,
} from '../../../utils/moderationStorage';

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

const formatDate = value => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
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
      toast.error('Only image files are supported.');
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`Image size must be under ${MAX_FILE_MB} MB.`);
      return;
    }
    setProcessingImage(true);
    try {
      const dataUrl = await compressImage(file);
      update('image', dataUrl);
    } catch {
      toast.error('Failed to read image. Please try JPG or PNG.');
    } finally {
      setProcessingImage(false);
    }
  };

  const handleSubmit = event => {
    event.preventDefault();
    if (!can(PERMISSIONS.MAGAZINES_CREATE) || processingImage) return;
    const nextErrors = {};
    if (form.title.trim().length < 5)
      nextErrors.title = 'Title must be at least 5 characters.';
    if (!form.category) nextErrors.category = 'Please select a category.';
    if (form.excerpt.trim().length < 20)
      nextErrors.excerpt = 'Summary must be at least 20 characters.';
    if (form.content.trim().length < 80)
      nextErrors.content = 'Content must be at least 80 characters.';
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
      toast.error('Storage is full. Use a smaller image or remove older items.');
      return;
    }
    setMagazines(nextMagazines);
    closeForm();
    toast.success('Magazine submitted for review.');
  };

  /* ───────────── Form ───────────── */
  if (view === 'form') {
    return (
      <>
        <button
          type="button"
          onClick={closeForm}
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-dark-muted transition hover:text-dark sm:mb-4 sm:gap-2 sm:text-sm"
        >
          <FiArrowLeft /> Back to list
        </button>
        <div className="mb-4 sm:mb-6">
          <Header
            title="New Magazine"
            description="Submit an article for editorial approval."
          />
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="grid items-start gap-3 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_340px]"
        >
          {/* Left: Article fields */}
          <section className="rounded-xl border border-slate-200 bg-white p-4 sm:rounded-2xl sm:p-5">
            <h2 className="mb-3 font-heading text-sm font-bold text-dark sm:mb-5 sm:text-lg">
              Article Details
            </h2>
            <div className="space-y-2.5 sm:space-y-3.5">
              <Field
                label="Title"
                value={form.title}
                error={errors.title}
                onChange={v => update('title', v)}
                placeholder="Enter magazine title"
              />
              <SelectField
                value={form.category}
                error={errors.category}
                onChange={v => update('category', v)}
              />
              <Field
                label="Summary / Excerpt"
                value={form.excerpt}
                error={errors.excerpt}
                onChange={v => update('excerpt', v)}
                placeholder="Write a 1-2 line summary for readers"
                textarea
                rows={2}
                min={20}
              />
              <Field
                label="Article Content"
                value={form.content}
                error={errors.content}
                onChange={v => update('content', v)}
                placeholder="Write each paragraph on a new line"
                textarea
                rows={5}
                min={80}
              />
            </div>
          </section>

          {/* Right: Cover & Submit */}
          <aside className="space-y-3 sm:space-y-5 lg:sticky lg:top-6">
            <section className="rounded-xl border border-dark/10 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5">
              <h2 className="font-heading text-sm font-bold text-dark sm:text-lg">
                Cover Image
              </h2>
              <p className="mb-3 mt-0.5 text-xs text-dark-muted sm:mb-4 sm:text-sm">
                Optional. A default cover will be used if left empty.
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
                      alt="Cover preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center justify-center gap-1.5 rounded-md border border-dark/15 px-3 py-2 text-xs font-semibold text-dark transition hover:bg-cream sm:text-sm"
                    >
                      <FiRefreshCw /> Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => update('image', '')}
                      className="inline-flex items-center justify-center gap-1.5 rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 sm:text-sm"
                    >
                      <FiTrash2 /> Remove
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
                      Processing image...
                    </span>
                  ) : (
                    <>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-base text-dark shadow-sm sm:h-11 sm:w-11 sm:text-xl">
                        <FiUploadCloud />
                      </span>
                      <span className="text-xs font-semibold text-dark sm:text-sm">
                        Upload Cover Image
                      </span>
                      <span className="text-[11px] text-dark-muted sm:text-xs">
                        JPG or PNG up to {MAX_FILE_MB} MB
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
                <FiSend /> Submit
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="w-full rounded-md border border-dark/15 px-4 py-2.5 text-sm font-semibold text-dark transition hover:bg-cream sm:rounded-lg sm:py-3 sm:text-base"
              >
                Cancel
              </button>
            </div>
          </aside>
        </form>
      </>
    );
  }

  /* ───────────── List ───────────── */
  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <Header
          title="My Magazines"
          description="Track your submitted magazine articles and review status."
        />
        <button
          type="button"
          onClick={() => setView('form')}
          className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-md bg-primary px-2.5 py-2 text-sm font-semibold text-dark shadow-sm transition hover:bg-primary-hover sm:w-auto sm:gap-2 sm:rounded-lg sm:px-3.5 sm:py-2"
        >
          <FiPlus /> Add Magazine
        </button>
      </div>

      {ownMagazines.length ? (
        <section className="overflow-hidden rounded-xl border border-dark/10 bg-white shadow-sm sm:rounded-2xl">
          <div className="border-b border-dark/10 px-3 py-2.5 sm:px-5 sm:py-3">
            <p className="text-xs font-semibold text-dark sm:text-sm">
              Total {ownMagazines.length} article{ownMagazines.length === 1 ? '' : 's'}
            </p>
          </div>

          <div className="hidden grid-cols-[minmax(0,1fr)_140px_130px_130px] gap-4 border-b border-dark/10 bg-cream/60 px-5 py-2.5 text-xs font-semibold text-dark-muted md:grid">
            <span>Article</span>
            <span>Category</span>
            <span>Date</span>
            <span>Status</span>
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
                        {getLocalizedValue(magazine.title)}
                      </h3>
                      <p className="mt-0.5 line-clamp-1 text-xs text-dark-muted sm:mt-1 sm:text-sm">
                        {getLocalizedValue(magazine.excerpt)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2 md:hidden">
                    <span className="min-w-0 truncate text-[11px] text-dark-muted">
                      {getMagazineCategoryLabel(magazine.category)} · {formatDate(magazine.date)}
                    </span>
                    <span className="shrink-0 origin-right scale-90">
                      <StatusBadge status={magazine.status} />
                    </span>
                  </div>

                  <span className="hidden text-sm text-dark md:block">
                    {getMagazineCategoryLabel(magazine.category)}
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
            No magazines submitted yet
          </p>
          <p className="mt-0.5 text-xs text-dark-muted sm:mt-1 sm:text-sm">
            Submit your first article to get started.
          </p>
          <button
            type="button"
            onClick={() => setView('form')}
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-dark transition hover:bg-primary-hover sm:mt-5 sm:gap-2 sm:rounded-lg sm:px-5 sm:py-3 sm:text-base"
          >
            <FiPlus /> Add Magazine
          </button>
        </div>
      )}
    </>
  );
}

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
            {value.trim().length} / min {min}
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
        Category
      </span>
      <select
        value={value}
        onChange={event => onChange(event.target.value)}
        className={inputClass(error)}
      >
        <option value="">Select category</option>
        {MAGAZINE_CATEGORIES.map(category => (
          <option key={category.id} value={category.en}>
            {category.en}
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
