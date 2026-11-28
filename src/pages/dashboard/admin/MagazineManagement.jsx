import { useMemo, useRef, useState } from 'react';
import {
  FiArrowLeft,
  FiCheck,
  FiClock,
  FiEdit2,
  FiEye,
  FiImage,
  FiPlus,
  FiRefreshCw,
  FiSend,
  FiTrash2,
  FiUploadCloud,
  FiX,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import ConfirmModal from '../../../components/dashboard/ConfirmModal';
import DataTable from '../../../components/dashboard/DataTable';
import PageHeader from '../../../components/dashboard/PageHeader';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import { useAuth } from '../../../context/useAuth';
import {
  MAGAZINE_CATEGORIES,
  getLocalizedValue,
  getMagazineCategoryLabel,
} from '../../../utils/i18n';
import {
  getStoredMagazines,
  saveStoredMagazines,
} from '../../../utils/moderationStorage';

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=900&q=80';

const EMPTY_FORM = {
  id: null,
  title: '',
  category: '',
  author: '',
  status: 'published',
  excerpt: '',
  content: '',
  image: '',
};

const MAX_FILE_MB = 10;
const MAX_DIMENSION = 1200;

const TABS = [
  ['all', 'All'],
  ['published', 'Published'],
  ['pending', 'Pending'],
  ['draft', 'Draft'],
];

const formatDate = value => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

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

function MagazineManagement() {
  const { currentUser } = useAuth();
  const [magazines, setMagazines] = useState(getStoredMagazines);
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [tab, setTab] = useState('all');
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [processingImage, setProcessingImage] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const fileInputRef = useRef(null);

  const counts = useMemo(
    () => ({
      all: magazines.length,
      published: magazines.filter(m => m.status === 'published').length,
      pending: magazines.filter(m => m.status === 'pending').length,
      draft: magazines.filter(m => m.status === 'draft').length,
    }),
    [magazines],
  );

  const visibleMagazines = useMemo(() => {
    if (tab === 'all') return magazines;
    return magazines.filter(m => m.status === tab);
  }, [magazines, tab]);

  const persistMagazines = next => {
    try {
      saveStoredMagazines(next);
      setMagazines(next);
      return true;
    } catch {
      toast.error('Storage is full. Use a smaller image or remove old items.');
      return false;
    }
  };

  const openCreateForm = () => {
    setForm({
      ...EMPTY_FORM,
      author: currentUser?.name || 'Admin',
      status: 'published',
    });
    setErrors({});
    setView('form');
  };

  const openEditForm = item => {
    const contentText = Array.isArray(item.content)
      ? item.content.map(p => getLocalizedValue(p)).join('\n\n')
      : typeof item.content === 'object'
        ? (getLocalizedValue(item.content) || '')
        : String(item.content || '');
    setForm({
      id: item.id,
      title: getLocalizedValue(item.title),
      category: getMagazineCategoryLabel(item.category),
      author: getLocalizedValue(item.author) || currentUser?.name || 'Admin',
      status: item.status || 'published',
      excerpt: getLocalizedValue(item.excerpt),
      content: contentText,
      image: item.image || '',
    });
    setErrors({});
    setPreviewItem(null);
    setView('form');
  };

  const closeForm = () => {
    setView('list');
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const updateField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
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
      toast.error(`Image must be under ${MAX_FILE_MB} MB.`);
      return;
    }
    setProcessingImage(true);
    try {
      const dataUrl = await compressImage(file);
      updateField('image', dataUrl);
    } catch {
      toast.error('Could not read the image. Please try another JPG or PNG.');
    } finally {
      setProcessingImage(false);
    }
  };

  const handleSubmit = event => {
    event.preventDefault();
    if (processingImage) return;

    const nextErrors = {};
    if (form.title.trim().length < 3) {
      nextErrors.title = 'Title must be at least 3 characters.';
    }
    if (!form.category) {
      nextErrors.category = 'Select a category.';
    }
    if (form.excerpt.trim().length < 10) {
      nextErrors.excerpt = 'Summary must be at least 10 characters.';
    }
    if (form.content.trim().length < 20) {
      nextErrors.content = 'Article content must be at least 20 characters.';
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const paragraphs = form.content
      .trim()
      .split(/\n+/)
      .map(s => s.trim())
      .filter(Boolean);

    if (form.id) {
      const next = magazines.map(item =>
        item.id === form.id
          ? {
              ...item,
              title: form.title.trim(),
              category: form.category,
              author: form.author.trim() || item.author || 'Admin',
              status: form.status,
              excerpt: form.excerpt.trim(),
              content: paragraphs,
              image: form.image || DEFAULT_IMAGE,
            }
          : item,
      );
      if (persistMagazines(next)) {
        toast.success('Magazine updated.');
        closeForm();
      }
    } else {
      const created = {
        id: `magazine-${Date.now()}`,
        title: form.title.trim(),
        category: form.category,
        excerpt: form.excerpt.trim(),
        content: paragraphs,
        image: form.image || DEFAULT_IMAGE,
        date: new Date().toISOString(),
        status: form.status,
        authorId: currentUser?.id || 'admin',
        author: form.author.trim() || currentUser?.name || 'Admin',
      };
      if (persistMagazines([created, ...magazines])) {
        toast.success(
          form.status === 'published'
            ? 'Magazine published.'
            : 'Magazine saved.',
        );
        closeForm();
      }
    }
  };

  const updateStatus = (item, nextStatus) => {
    const next = magazines.map(m =>
      m.id === item.id ? { ...m, status: nextStatus } : m,
    );
    if (persistMagazines(next)) {
      toast.success(
        nextStatus === 'published'
          ? 'Magazine published.'
          : 'Magazine moved to pending.',
      );
      if (previewItem?.id === item.id) {
        setPreviewItem(prev => (prev ? { ...prev, status: nextStatus } : null));
      }
    }
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const next = magazines.filter(m => m.id !== deleteTarget.id);
    if (persistMagazines(next)) {
      toast.success('Magazine deleted.');
      if (previewItem?.id === deleteTarget.id) setPreviewItem(null);
    }
    setDeleteTarget(null);
  };

  if (view === 'form') {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={closeForm}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 transition hover:text-slate-900"
        >
          <FiArrowLeft size={14} /> Back to Magazines
        </button>

        <PageHeader
          title={form.id ? 'Edit Magazine' : 'Add Magazine'}
          description="Create or edit magazine articles cleanly."
        />

        <form
          onSubmit={handleSubmit}
          noValidate
          className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]"
        >
          {/* Left: Article fields (matches User Upload fields) */}
          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
            <Field
              label="Title"
              value={form.title}
              error={errors.title}
              onChange={v => updateField('title', v)}
              placeholder="Enter magazine title"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Category"
                value={form.category}
                error={errors.category}
                onChange={v => updateField('category', v)}
              />
              <Field
                label="Author"
                value={form.author}
                onChange={v => updateField('author', v)}
                placeholder="Author name"
              />
            </div>

            <Field
              label="Summary / Excerpt"
              value={form.excerpt}
              error={errors.excerpt}
              onChange={v => updateField('excerpt', v)}
              placeholder="Write a 1-2 line summary for readers"
              textarea
              rows={2}
            />

            <Field
              label="Article Content"
              value={form.content}
              error={errors.content}
              onChange={v => updateField('content', v)}
              placeholder="Write each paragraph on a new line"
              textarea
              rows={7}
            />
          </section>

          {/* Right: Cover image + status + actions */}
          <aside className="space-y-4">
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Status
              </label>
              <select
                value={form.status}
                onChange={e => updateField('status', e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-500"
              >
                <option value="published">Published</option>
                <option value="pending">Pending</option>
                <option value="draft">Draft</option>
              </select>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-xs font-semibold text-slate-700">
                Cover Image
              </h2>
              <p className="mb-3 mt-0.5 text-xs text-slate-400">
                Optional. Uses a default image if left empty.
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
                  <div className="aspect-[16/9] overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
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
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <FiRefreshCw size={13} /> Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField('image', '')}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      <FiTrash2 size={13} /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={processingImage}
                  className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-slate-50/50 px-3 text-center transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-60"
                >
                  {processingImage ? (
                    <span className="text-xs font-medium text-slate-600">
                      Processing image...
                    </span>
                  ) : (
                    <>
                      <FiUploadCloud size={20} className="text-slate-400" />
                      <span className="text-xs font-semibold text-slate-700">
                        Upload Cover Image
                      </span>
                      <span className="text-[11px] text-slate-400">
                        JPG or PNG up to {MAX_FILE_MB} MB
                      </span>
                    </>
                  )}
                </button>
              )}
            </section>

            <div className="flex gap-2 rounded-xl border border-slate-200 bg-white p-4">
              <button
                type="submit"
                disabled={processingImage}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-dark transition hover:bg-primary-hover disabled:opacity-60"
              >
                <FiSend size={14} /> {form.id ? 'Save Changes' : 'Publish / Save'}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </aside>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          title="Magazine"
          description="Publish new articles and manage reader submissions."
        />
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-dark transition hover:bg-primary-hover"
        >
          <FiPlus size={15} /> Add Magazine
        </button>
      </div>

      {/* Clean plain summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total', value: counts.all },
          { label: 'Published', value: counts.published },
          { label: 'Pending', value: counts.pending },
          { label: 'Draft', value: counts.draft },
        ].map(card => (
          <div
            key={card.label}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3"
          >
            <p className="text-xs font-medium text-slate-500">{card.label}</p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-3">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
              tab === id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {label} ({counts[id]})
          </button>
        ))}
      </div>

      {/* Table */}
      <DataTable
        data={visibleMagazines}
        selectable={false}
        searchKeys={['title', 'author', 'category', 'excerpt']}
        searchPlaceholder="Search title, author, or category..."
        onRowClick={setPreviewItem}
        columns={[
          {
            key: 'title',
            header: 'Article',
            sortable: true,
            render: item => (
              <div className="flex min-w-[220px] items-center gap-3">
                {item.image ? (
                  <img
                    src={item.image}
                    alt=""
                    className="h-11 w-16 shrink-0 rounded-md border border-slate-200 object-cover"
                  />
                ) : (
                  <span className="flex h-11 w-16 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-400">
                    <FiImage size={16} />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">
                    {getLocalizedValue(item.title)}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {getLocalizedValue(item.excerpt)}
                  </p>
                </div>
              </div>
            ),
          },
          {
            key: 'author',
            header: 'Author',
            sortable: true,
            render: item => (
              <span className="whitespace-nowrap text-xs text-slate-700">
                {getLocalizedValue(item.author) ||
                  (item.authorId ? `User #${item.authorId}` : 'Admin')}
              </span>
            ),
          },
          {
            key: 'category',
            header: 'Category',
            sortable: true,
            render: item => (
              <span className="whitespace-nowrap text-xs text-slate-600">
                {getMagazineCategoryLabel(item.category)}
              </span>
            ),
          },
          {
            key: 'date',
            header: 'Date',
            sortable: true,
            render: item => (
              <span className="whitespace-nowrap text-xs text-slate-500">
                {formatDate(item.date)}
              </span>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: item => <StatusBadge status={item.status} />,
          },
          {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            render: item => (
              <div
                className="flex items-center justify-end gap-1"
                onClick={e => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setPreviewItem(item)}
                  className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                  title="Preview"
                  aria-label="Preview magazine"
                >
                  <FiEye size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => openEditForm(item)}
                  className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                  title="Edit"
                  aria-label="Edit magazine"
                >
                  <FiEdit2 size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => updateStatus(item, 'published')}
                  className={`rounded-lg p-1.5 transition ${
                    item.status === 'published'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                  title="Approve & Publish"
                  aria-label="Approve magazine"
                >
                  <FiCheck size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => updateStatus(item, 'pending')}
                  className={`rounded-lg p-1.5 transition ${
                    item.status === 'pending'
                      ? 'bg-amber-50 text-amber-700'
                      : 'text-slate-500 hover:bg-amber-50 hover:text-amber-700'
                  }`}
                  title="Set Pending"
                  aria-label="Set magazine pending"
                >
                  <FiClock size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(item)}
                  className="rounded-lg p-1.5 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                  title="Delete"
                  aria-label="Delete magazine"
                >
                  <FiTrash2 size={15} />
                </button>
              </div>
            ),
          },
        ]}
        emptyMessage="No magazines found."
      />

      {/* Preview Modal */}
      {previewItem && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/45 px-4 py-6"
          onClick={() => setPreviewItem(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">
                    {getMagazineCategoryLabel(previewItem.category)}
                  </span>
                  <StatusBadge status={previewItem.status} />
                </div>
                <h2 className="mt-1 font-heading text-xl font-bold text-slate-900">
                  {getLocalizedValue(previewItem.title)}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {getLocalizedValue(previewItem.author) ||
                    (previewItem.authorId ? `User #${previewItem.authorId}` : 'Admin')}{' '}
                  · {formatDate(previewItem.date)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                <FiX size={14} /> Close
              </button>
            </div>

            {previewItem.image && (
              <img
                src={previewItem.image}
                alt={previewItem.title}
                className="mt-4 aspect-[16/8] w-full rounded-lg border border-slate-200 object-cover"
              />
            )}

            <p className="mt-4 text-sm font-medium leading-6 text-slate-700">
              {getLocalizedValue(previewItem.excerpt)}
            </p>

            <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 text-sm leading-7 text-slate-600">
              {(Array.isArray(previewItem.content)
                ? previewItem.content
                : [previewItem.content]
              ).map((para, idx) => (
                <p key={idx}>{getLocalizedValue(para)}</p>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => openEditForm(previewItem)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <FiEdit2 size={14} /> Edit
              </button>
              <button
                type="button"
                onClick={() => updateStatus(previewItem, 'published')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
              >
                <FiCheck size={14} /> Approve
              </button>
              <button
                type="button"
                onClick={() => updateStatus(previewItem, 'pending')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50"
              >
                <FiClock size={14} /> Pending
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(previewItem)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
              >
                <FiTrash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Magazine?"
        message={`Are you sure you want to permanently delete "${deleteTarget?.title}"?`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function Field({
  label,
  value,
  error,
  onChange,
  placeholder,
  textarea = false,
  rows,
}) {
  const Element = textarea ? 'textarea' : 'input';
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-700">
        {label}
      </span>
      <Element
        type={textarea ? undefined : 'text'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={textarea ? rows : undefined}
        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-500 ${
          error ? 'border-rose-500' : 'border-slate-200'
        } ${textarea ? 'resize-y leading-6' : ''}`}
      />
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}

function SelectField({ label, value, error, onChange }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-700">
        {label}
      </span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-500 ${
          error ? 'border-rose-500' : 'border-slate-200'
        }`}
      >
        <option value="">Select category</option>
        {MAGAZINE_CATEGORIES.map(category => (
          <option key={category.id} value={category.en}>
            {category.en}
          </option>
        ))}
      </select>
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}

export default MagazineManagement;
