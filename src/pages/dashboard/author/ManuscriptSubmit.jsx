import { useState } from 'react';
import { FiFileText, FiUploadCloud, FiEdit3 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import PageHeader from '../../../components/dashboard/PageHeader';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import { useAuth } from '../../../context/useAuth';
import {
  getStoredManuscripts,
  saveStoredManuscripts,
} from '../../../utils/authorStorage';

const categories = [
  'Novel',
  'Story',
  'Poetry',
  'Essay',
  'Children & Young Adult',
  'Other',
];

const countWords = text => text.trim().split(/\s+/).filter(Boolean).length;

function ManuscriptSubmit() {
  const { currentUser } = useAuth();
  const [form, setForm] = useState({ title: '', type: '', text: '' });
  const [mode, setMode] = useState('file'); // 'file' | 'text'
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [manuscripts, setManuscripts] = useState(getStoredManuscripts);
  const myManuscripts = manuscripts.filter(
    manuscript => manuscript.authorId === currentUser.id,
  );
  const isPending = currentUser.status === 'pending';
  const wordCount = countWords(form.text);

  const switchMode = nextMode => {
    if (nextMode === mode) return;
    setMode(nextMode);
    setFile(null);
    setForm(current => ({ ...current, text: '' }));
    setErrors(current => ({ ...current, file: '', text: '' }));
  };

  const handleFile = event => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx'].includes(extension)) {
      setErrors(current => ({
        ...current,
        file: 'Only PDF or DOCX files are accepted.',
      }));
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setErrors(current => ({
        ...current,
        file: 'File size must be 10 MB or less.',
      }));
      return;
    }
    setFile(selectedFile);
    setErrors(current => ({ ...current, file: '' }));
  };

  const readFileAsDataUrl = selectedFile =>
    new Promise(resolve => {
      if (!selectedFile || selectedFile.size > 1.5 * 1024 * 1024) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(selectedFile);
    });

  const handleSubmit = async event => {
    event.preventDefault();
    if (isPending) return;
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = 'Enter the book name.';
    if (!form.type) nextErrors.type = 'Select a category.';
    if (mode === 'file' && !file) nextErrors.file = 'Select a file to upload.';
    if (mode === 'text' && !form.text.trim())
      nextErrors.text = 'Write some text.';
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    const trimmedText = mode === 'text' ? form.text.trim() : '';
    const fileDataUrl = mode === 'file' ? await readFileAsDataUrl(file) : null;
    const nextManuscripts = [
      ...manuscripts,
      {
        id: `manuscript-${Date.now()}`,
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorEmail: currentUser.email,
        title: form.title.trim(),
        type: form.type,
        submitMode: mode,
        text: trimmedText,
        wordCount: trimmedText ? countWords(trimmedText) : 0,
        summary: trimmedText.slice(0, 200),
        comments: '',
        fileName: mode === 'file' ? file.name : '',
        fileSize: mode === 'file' ? file.size : 0,
        fileType: mode === 'file' ? file.type : '',
        fileDataUrl,
        status: 'submitted',
        feedback: '',
        submittedAt: new Date().toISOString(),
      },
    ];
    saveStoredManuscripts(nextManuscripts);
    setManuscripts(nextManuscripts);
    setForm({ title: '', type: '', text: '' });
    setFile(null);
    setErrors({});
    toast.success('Manuscript submitted successfully.');
  };

  const tabClass = active =>
    `inline-flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition ${
      active
        ? 'bg-primary text-dark shadow-sm'
        : 'text-dark-muted hover:text-dark'
    }`;

  return (
    <>
      <PageHeader
        title="Submit Manuscript"
        description="Submit your new manuscript for review."
      />
      {isPending && <PendingBanner />}
      <div className="grid gap-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-dark/10 bg-white p-6 shadow-sm"
        >
          <div className="space-y-5">
            <FormField
              label="Book Name"
              value={form.title}
              error={errors.title}
              onChange={value => setForm({ ...form, title: value })}
              placeholder="Enter the book name"
            />
            <SelectField
              label="Category"
              value={form.type}
              error={errors.type}
              options={categories}
              onChange={value => setForm({ ...form, type: value })}
            />

            <div>
              <span className="mb-2 block font-semibold text-dark">
                Submit as
              </span>
              <div className="flex gap-1 rounded-lg bg-cream p-1">
                <button
                  type="button"
                  onClick={() => switchMode('file')}
                  className={tabClass(mode === 'file')}
                >
                  <FiUploadCloud /> Upload File
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('text')}
                  className={tabClass(mode === 'text')}
                >
                  <FiEdit3 /> Write Text
                </button>
              </div>
            </div>

            {mode === 'file' ? (
              <label className="block">
                <span className="mb-2 block font-semibold text-dark">
                  File (PDF/DOCX)
                </span>
                <div className="rounded-lg border border-dashed border-dark/20 bg-cream p-5 text-center">
                  <FiUploadCloud className="mx-auto text-3xl text-primary-hover" />
                  <input
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFile}
                    className="mt-3 block w-full text-sm text-dark-muted"
                  />
                  <p className="mt-2 text-xs text-dark-muted">Max 10 MB</p>
                  {file && (
                    <p className="mt-2 text-sm font-semibold text-dark">
                      {file.name}
                    </p>
                  )}
                </div>
                {errors.file && (
                  <span className="mt-1 block text-sm text-red-600">
                    {errors.file}
                  </span>
                )}
              </label>
            ) : (
              <div>
                <FormField
                  label="Text"
                  value={form.text}
                  error={errors.text}
                  onChange={value => setForm({ ...form, text: value })}
                  placeholder="Write or paste your text here"
                  textarea
                />
                <p className="mt-2 text-sm font-semibold text-dark-muted">
                  Word count: {wordCount}
                </p>
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 font-semibold text-dark transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FiUploadCloud /> Submit Manuscript
          </button>
        </form>

        <section>
          <h2 className="font-heading text-2xl font-bold text-dark">
            My Manuscripts
          </h2>
          <div className="mt-4 space-y-4">
            {myManuscripts.length > 0 ? (
              myManuscripts.map(manuscript => (
                <article
                  key={manuscript.id}
                  className="rounded-xl border border-dark/10 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <h3 className="font-heading text-xl font-bold text-dark">
                        {manuscript.title}
                      </h3>
                      <p className="mt-1 text-sm text-dark-muted">
                        {manuscript.type} · {manuscript.submittedAt}
                      </p>
                    </div>
                    <StatusBadge status={manuscript.status} />
                  </div>
                  {manuscript.text && (
                    <>
                      <p className="mt-4 line-clamp-3 text-sm leading-6 text-dark-muted">
                        {manuscript.text}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-dark-muted">
                        {manuscript.wordCount ?? countWords(manuscript.text)}{' '}
                        words
                      </p>
                    </>
                  )}
                  {manuscript.fileName && (
                    <p className="mt-3 flex items-center gap-2 text-sm text-dark">
                      <FiFileText /> {manuscript.fileName}
                    </p>
                  )}
                  {manuscript.feedback && (
                    <div className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                      <strong>Moderator feedback:</strong> {manuscript.feedback}
                    </div>
                  )}
                </article>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-dark/20 bg-white px-5 py-14 text-center text-dark-muted">
                You have no manuscripts yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

function FormField({ label, value, error, onChange, placeholder, textarea }) {
  const Field = textarea ? 'textarea' : 'input';
  return (
    <label className="block">
      <span className="mb-2 block font-semibold text-dark">{label}</span>
      <Field
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        rows={textarea ? 8 : undefined}
        className={`w-full rounded-lg border bg-cream px-4 py-3 text-dark outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 ${error ? 'border-red-500' : 'border-dark/10'}`}
      />
      {error && (
        <span className="mt-1 block text-sm text-red-600">{error}</span>
      )}
    </label>
  );
}

function SelectField({ label, value, error, options, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block font-semibold text-dark">{label}</span>
      <select
        value={value}
        onChange={event => onChange(event.target.value)}
        className={`w-full rounded-lg border bg-cream px-4 py-3 text-dark outline-none focus:border-primary ${error ? 'border-red-500' : 'border-dark/10'}`}
      >
        <option value="">Select a category</option>
        {options.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error && (
        <span className="mt-1 block text-sm text-red-600">{error}</span>
      )}
    </label>
  );
}

function PendingBanner() {
  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-800">
      Your account is awaiting approval. You cannot submit manuscripts until it
      is approved.
    </div>
  );
}

export default ManuscriptSubmit;
