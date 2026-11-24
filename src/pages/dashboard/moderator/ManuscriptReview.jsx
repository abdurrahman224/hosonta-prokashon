import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  LuArrowDown as ArrowDown,
  LuArrowLeft as ArrowLeft,
  LuArrowUp as ArrowUp,
  LuArrowUpDown as ArrowUpDown,
  LuDownload as Download,
  LuEye as Eye,
  LuEyeOff as EyeOff,
  LuFileText as FileText,
  LuLock as Lock,
  LuSearch as Search,
  LuUpload as Upload,
} from 'react-icons/lu';
import PageHeader from '../../../components/dashboard/PageHeader';
import { useAuth } from '../../../context/useAuth';
import authors from '../../../data/authors';
import { PERMISSIONS } from '../../../utils/roles';
import {
  addActivityLog,
  getStoredManuscripts,
  saveStoredManuscripts,
} from '../../../utils/moderationStorage';

// ===== Workflow rules =====
// Single source of truth for statuses, allowed transitions and priorities.
// Mirror TRANSITIONS on the server so invalid changes are rejected there too.
const STATUS = {
  SUBMITTED: 'submitted',
  SCREENING: 'screening',
  IN_REVIEW: 'in_review',
  REVISION_REQUESTED: 'revision_requested',
  RESUBMITTED: 'resubmitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
};

const STATUS_META = {
  submitted: {
    label: 'Submitted',
    tone: 'bg-blue-50 text-blue-700 ring-blue-200',
  },
  screening: {
    label: 'Under Screening',
    tone: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  },
  in_review: {
    label: 'In Review',
    tone: 'bg-amber-50 text-amber-700 ring-amber-200',
  },
  revision_requested: {
    label: 'Revision Requested',
    tone: 'bg-orange-50 text-orange-700 ring-orange-200',
  },
  resubmitted: {
    label: 'Resubmitted',
    tone: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  },
  approved: {
    label: 'Approved',
    tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  },
  rejected: { label: 'Rejected', tone: 'bg-red-50 text-red-700 ring-red-200' },
  withdrawn: {
    label: 'Withdrawn',
    tone: 'bg-slate-100 text-slate-600 ring-slate-200',
  },
};

const TRANSITIONS = {
  submitted: ['screening', 'in_review', 'rejected', 'withdrawn'],
  screening: ['in_review', 'revision_requested', 'rejected', 'withdrawn'],
  in_review: ['revision_requested', 'approved', 'rejected', 'withdrawn'],
  revision_requested: ['resubmitted', 'rejected', 'withdrawn'], // resubmitted is triggered by the author
  resubmitted: [
    'in_review',
    'revision_requested',
    'approved',
    'rejected',
    'withdrawn',
  ],
  approved: [],
  rejected: [],
  withdrawn: [],
};

// Statuses that need written feedback for the author
const FEEDBACK_REQUIRED = ['revision_requested', 'rejected'];

const PRIORITIES = {
  low: {
    label: 'Low',
    tone: 'bg-slate-100 text-slate-600 ring-slate-200',
    rank: 0,
  },
  normal: {
    label: 'Normal',
    tone: 'bg-blue-50 text-blue-700 ring-blue-200',
    rank: 1,
  },
  high: {
    label: 'High',
    tone: 'bg-orange-50 text-orange-700 ring-orange-200',
    rank: 2,
  },
  urgent: {
    label: 'Urgent',
    tone: 'bg-red-50 text-red-700 ring-red-200',
    rank: 3,
  },
};

// Maps legacy statuses already stored by the old page
const normalizeStatus = s =>
  s === 'revision' ? STATUS.REVISION_REQUESTED : s || STATUS.SUBMITTED;

// Editors can't trigger "resubmitted"; only the author's submitRevision() does.
const editorTransitions = status =>
  (TRANSITIONS[normalizeStatus(status)] ?? []).filter(
    s => s !== STATUS.RESUBMITTED,
  );

const canTransition = (from, to) =>
  (TRANSITIONS[normalizeStatus(from)] ?? []).includes(to);

// ===== Data layer (swap for API calls later) =====
// Data layer for editorial management. It sits on the existing moderationStorage helpers,
// and every function is async so it can be swapped for real API calls without touching the UI.

const NOTIF_KEY = 'publisher_notifications';
const MAX_INLINE_FILE = 1.5 * 1024 * 1024; // localStorage only; a real backend should take multipart uploads
const ADMIN_ROLES = ['admin', 'super_admin']; // ASSUMPTION: adjust to your roles.js

const uid = p =>
  `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const now = () => new Date().toISOString();

function normalizeManuscript(m) {
  const updatedAt = m.updatedAt || m.reviewedAt || m.submittedAt;
  return {
    priority: 'normal',
    assignedEditorId: null,
    reviewerId: null,
    revisionDeadline: null,
    productionStatus: null,
    versions: [],
    annotatedFiles: [],
    timeline: [],
    ...m,
    status: normalizeStatus(m.status),
    updatedAt,
    // legacy single-string fields become entries in separate lists
    authorFeedback:
      m.authorFeedback ??
      (m.feedback
        ? [
            {
              id: uid('fb'),
              text: m.feedback,
              byId: m.reviewedBy,
              at: m.reviewedAt || updatedAt,
            },
          ]
        : []),
    internalNotes:
      m.internalNotes ??
      (m.internalNote
        ? [
            {
              id: uid('in'),
              text: m.internalNote,
              byId: m.reviewedBy,
              at: m.reviewedAt || updatedAt,
            },
          ]
        : []),
  };
}

async function listManuscripts() {
  return getStoredManuscripts().map(normalizeManuscript);
}

async function getManuscript(id) {
  return (await listManuscripts()).find(m => m.id === id) ?? null;
}

// Client-side access rule. The backend must enforce the same rule.
function canAccessManuscript(m, user) {
  if (!user) return false;
  if (ADMIN_ROLES.includes(user.role)) return true;
  return (
    !m.assignedEditorId ||
    m.assignedEditorId === user.id ||
    m.reviewerId === user.id
  );
}

// What an author is allowed to see: never internal notes or internal timeline entries.
function toAuthorView(m) {
  const { internalNotes, internalNote, ...safe } = m;
  return { ...safe, timeline: m.timeline.filter(e => !e.internal) };
}

async function getEditors(currentUser) {
  // TODO: replace with your users API filtered by editor roles.
  const ids = new Set(
    (await listManuscripts())
      .flatMap(m => [m.assignedEditorId, m.reviewerId])
      .filter(Boolean),
  );
  if (currentUser) ids.add(currentUser.id);
  return [...ids].map(id => ({
    id,
    name: id === currentUser?.id ? (currentUser.name ?? id) : id,
  }));
}

async function mutate(id, actor, entry, fn) {
  const all = (await listManuscripts()).map(m => {
    if (m.id !== id) return m;
    const next = fn(m);
    return {
      ...next,
      updatedAt: now(),
      timeline: [
        ...next.timeline,
        { id: uid('tl'), at: now(), byId: actor.id, internal: false, ...entry },
      ],
    };
  });
  saveStoredManuscripts(all);
  addActivityLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: entry.type,
    entity: 'manuscript',
    entityId: id,
    comment: entry.text,
    internalNote: entry.internal ? entry.text : undefined,
  });
  return all.find(m => m.id === id);
}

async function notify(userId, type, message, entityId) {
  if (!userId) return;
  const list = JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]');
  list.unshift({
    id: uid('nt'),
    userId,
    type,
    message,
    entityId,
    createdAt: now(),
    read: false,
  });
  localStorage.setItem(NOTIF_KEY, JSON.stringify(list.slice(0, 500)));
}

async function getNotifications(userId) {
  return JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]').filter(
    n => n.userId === userId,
  );
}

async function changeStatus(
  id,
  to,
  actor,
  { feedback = '', deadline = null } = {},
) {
  const current = await getManuscript(id);
  if (!current) throw new Error('Manuscript not found.');
  if (!canTransition(current.status, to))
    throw new Error(`Cannot move from ${current.status} to ${to}.`);
  if (FEEDBACK_REQUIRED.includes(to) && !feedback.trim())
    throw new Error('Feedback for the author is required.');
  if (to === STATUS.REVISION_REQUESTED && !deadline)
    throw new Error('Set a revision deadline.');

  const updated = await mutate(
    id,
    actor,
    { type: to, text: feedback.trim() || undefined },
    m => ({
      ...m,
      status: to,
      reviewedBy: actor.id,
      reviewedAt: now(),
      revisionDeadline:
        to === STATUS.REVISION_REQUESTED ? deadline : m.revisionDeadline,
      productionStatus:
        to === STATUS.APPROVED ? 'ready_for_production' : m.productionStatus, // handoff flag only; no book/inventory is created
      authorFeedback: feedback.trim()
        ? [
            ...m.authorFeedback,
            { id: uid('fb'), text: feedback.trim(), byId: actor.id, at: now() },
          ]
        : m.authorFeedback,
    }),
  );
  await notify(
    current.authorId,
    to,
    `Your manuscript "${current.title}" is now ${to.replace('_', ' ')}.`,
    id,
  );
  return updated;
}

async function assign(id, { editorId, reviewerId }, actor) {
  const updated = await mutate(
    id,
    actor,
    {
      type: 'assigned',
      text: `Editor: ${editorId || 'none'}, reviewer: ${reviewerId || 'none'}`,
    },
    m => ({
      ...m,
      assignedEditorId: editorId || null,
      reviewerId: reviewerId || null,
    }),
  );
  await notify(
    editorId,
    'assignment',
    `You were assigned "${updated.title}".`,
    id,
  );
  await notify(
    reviewerId,
    'assignment',
    `You were assigned to review "${updated.title}".`,
    id,
  );
  return updated;
}

const setPriority = (id, priority, actor) =>
  mutate(
    id,
    actor,
    { type: 'priority_changed', text: `Priority set to ${priority}` },
    m => ({ ...m, priority }),
  );

const addInternalNote = (id, text, actor) =>
  mutate(id, actor, { type: 'internal_note', text, internal: true }, m => ({
    ...m,
    internalNotes: [
      ...m.internalNotes,
      { id: uid('in'), text, byId: actor.id, at: now() },
    ],
  }));

const addAuthorFeedback = (id, text, actor) =>
  mutate(id, actor, { type: 'feedback', text }, m => ({
    ...m,
    authorFeedback: [
      ...m.authorFeedback,
      { id: uid('fb'), text, byId: actor.id, at: now() },
    ],
  }));

function readFile(file) {
  return new Promise((resolve, reject) => {
    const meta = {
      name: file.name,
      size: file.size,
      type: file.type,
      dataUrl: null,
    };
    if (file.size > MAX_INLINE_FILE) return resolve(meta); // metadata only; needs real storage
    const r = new FileReader();
    r.onload = () => resolve({ ...meta, dataUrl: r.result });
    r.onerror = () => reject(new Error('Could not read the file.'));
    r.readAsDataURL(file);
  });
}

async function addAnnotatedFile(id, file, actor) {
  const f = await readFile(file);
  return mutate(id, actor, { type: 'annotated_file', text: f.name }, m => ({
    ...m,
    annotatedFiles: [
      ...m.annotatedFiles,
      { id: uid('af'), ...f, byId: actor.id, at: now() },
    ],
  }));
}

// Called from the author side. Appends a new version; earlier versions are never touched.
async function submitRevision(id, file, note, actor) {
  const f = await readFile(file);
  const current = await getManuscript(id);
  const updated = await mutate(
    id,
    actor,
    { type: 'resubmitted', text: note || undefined },
    m => ({
      ...m,
      status: STATUS.RESUBMITTED,
      versions: [
        ...m.versions,
        {
          id: uid('v'),
          version: m.versions.length + 1,
          ...f,
          note,
          submittedBy: actor.id,
          submittedAt: now(),
        },
      ],
    }),
  );
  await notify(
    current.assignedEditorId,
    'resubmitted',
    `New version of "${current.title}" was submitted.`,
    id,
  );
  return updated;
}

const sendToProduction = (id, actor) =>
  mutate(id, actor, { type: 'sent_to_production' }, m => {
    if (m.status !== STATUS.APPROVED)
      throw new Error('Only approved manuscripts can go to production.');
    return { ...m, productionStatus: 'sent_to_production' }; // hook your Book Production module here
  });

const svc = {
  getManuscript,
  getEditors,
  canAccessManuscript,
  changeStatus,
  assign,
  setPriority,
  addInternalNote,
  addAnnotatedFile,
  sendToProduction,
};

// ===== Review workspace =====
function StatusPill({ status }) {
  const m = STATUS_META[status] ?? STATUS_META.submitted;
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${m.tone}`}
    >
      {m.label}
    </span>
  );
}
function PriorityPill({ priority }) {
  const p = PRIORITIES[priority] ?? PRIORITIES.normal;
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${p.tone}`}
    >
      {p.label}
    </span>
  );
}

const fmt = d => (d ? new Date(d).toLocaleString() : '—');
const kb = n => (n ? `${Math.max(1, Math.round(n / 1024))} KB` : '');
const Card = ({ title, children, aside }) => (
  <section className="rounded-xl border border-slate-200 bg-white p-5">
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      {aside}
    </div>
    {children}
  </section>
);
const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500';

function FileRow({ file, label }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm">
      <span className="flex min-w-0 items-center gap-2">
        <FileText size={16} className="shrink-0 text-slate-400" />
        <span className="truncate">
          {label} {file.name}
        </span>
        <span className="text-xs text-slate-400">{kb(file.size)}</span>
      </span>
      {file.dataUrl ? (
        <span className="flex shrink-0 gap-3">
          {file.type === 'application/pdf' && (
            <a
              href={file.dataUrl}
              target="_blank"
              rel="noreferrer"
              className="text-slate-600 hover:underline"
            >
              Preview
            </a>
          )}
          <a
            href={file.dataUrl}
            download={file.name}
            className="flex items-center gap-1 text-slate-600 hover:underline"
          >
            <Download size={14} />
            Download
          </a>
        </span>
      ) : (
        <span className="text-xs text-slate-400">Stored on server</span>
      )}
    </li>
  );
}

function ManuscriptDetails({ manuscriptId, onBack, onChanged }) {
  const { currentUser, can } = useAuth();
  const canReview = can(PERMISSIONS.MANUSCRIPTS_REVIEW);
  const [m, setM] = useState(null);
  const [editors, setEditors] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [deadline, setDeadline] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    let live = true;
    Promise.all([svc.getManuscript(manuscriptId), svc.getEditors(currentUser)])
      .then(([item, eds]) => {
        if (live) {
          setM(item);
          setEditors(eds);
          if (!item) setError('Manuscript not found.');
        }
      })
      .catch(e => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [manuscriptId, currentUser]);

  const run = async (fn, success) => {
    setBusy(true);
    try {
      const next = await fn();
      setM(next);
      onChanged?.(next);
      if (success) toast.success(success);
      return true;
    } catch (e) {
      toast.error(e.message || 'Action failed.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  if (error)
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error}{' '}
        <button onClick={onBack} className="ml-2 underline">
          Back to queue
        </button>
      </div>
    );
  if (!m)
    return (
      <div className="p-10 text-center text-sm text-slate-500">
        Loading manuscript…
      </div>
    );
  if (!svc.canAccessManuscript(m, currentUser))
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        This manuscript is assigned to another editor.{' '}
        <button onClick={onBack} className="ml-2 underline">
          Back to queue
        </button>
      </div>
    );

  const author = authors.find(a => a.id === m.authorId);
  const nameOf = id =>
    editors.find(e => e.id === id)?.name ??
    authors.find(a => a.id === id)?.name ??
    id ??
    '—';
  const next = editorTransitions(m.status);
  const latest = m.versions.at(-1);

  const transition = async to => {
    const ok = await run(
      () =>
        svc.changeStatus(m.id, to, currentUser, {
          feedback,
          deadline: deadline || null,
        }),
      `Status changed to ${STATUS_META[to].label}.`,
    );
    if (ok) {
      setFeedback('');
      setDeadline('');
    }
  };

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        Back to queue
      </button>

      <header className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{m.title}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {m.id} · {author?.name ?? m.authorId} · {m.type}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PriorityPill priority={m.priority} />
          <StatusPill status={m.status} />
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card title="Synopsis">
            <p className="text-sm leading-relaxed text-slate-700">
              {m.summary || 'No synopsis provided.'}
            </p>
          </Card>

          <Card title="Author">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-slate-500">Name</dt>
                <dd>{author?.name ?? m.authorId}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Email</dt>
                <dd>{author?.email ?? '—'}</dd>
              </div>
            </dl>
          </Card>

          <Card
            title={`Manuscript files (${m.versions.length} version${m.versions.length === 1 ? '' : 's'})`}
          >
            {m.versions.length === 0 ? (
              <p className="text-sm text-slate-500">No file uploaded yet.</p>
            ) : (
              <ul className="space-y-2">
                {[...m.versions].reverse().map(v => (
                  <div key={v.id}>
                    <FileRow file={v} label={`v${v.version}`} />
                    <p className="px-1 pt-1 text-xs text-slate-400">
                      {fmt(v.submittedAt)} by {nameOf(v.submittedBy)}
                      {v.note ? ` — ${v.note}` : ''}
                    </p>
                  </div>
                ))}
              </ul>
            )}
            {m.annotatedFiles.length > 0 && (
              <>
                <h4 className="mb-2 mt-4 text-xs font-semibold text-slate-500">
                  Annotated files
                </h4>
                <ul className="space-y-2">
                  {m.annotatedFiles.map(f => (
                    <FileRow key={f.id} file={f} label="" />
                  ))}
                </ul>
              </>
            )}
            {canReview && (
              <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                <Upload size={15} />
                Upload annotated file
                <input
                  type="file"
                  className="hidden"
                  disabled={busy}
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f)
                      run(
                        () => svc.addAnnotatedFile(m.id, f, currentUser),
                        'Annotated file uploaded.',
                      );
                    e.target.value = '';
                  }}
                />
              </label>
            )}
          </Card>

          <Card title="Review timeline">
            {m.timeline.length === 0 ? (
              <p className="text-sm text-slate-500">No activity yet.</p>
            ) : (
              <ol className="space-y-3 border-l border-slate-200 pl-4">
                {[...m.timeline].reverse().map(e => (
                  <li key={e.id} className="text-sm">
                    <p className="font-medium text-slate-800">
                      {STATUS_META[e.type]?.label ??
                        e.type.replaceAll('_', ' ')}
                      {e.internal && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-amber-700">
                          <EyeOff size={12} />
                          Internal
                        </span>
                      )}
                    </p>
                    {e.text && <p className="text-slate-600">{e.text}</p>}
                    <p className="text-xs text-slate-400">
                      {fmt(e.at)} · {nameOf(e.byId)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Assignment">
            {canReview ? (
              <AssignForm
                m={m}
                editors={editors}
                busy={busy}
                onSave={v =>
                  run(
                    () => svc.assign(m.id, v, currentUser),
                    'Assignment saved.',
                  )
                }
                onPriority={p =>
                  run(
                    () => svc.setPriority(m.id, p, currentUser),
                    'Priority updated.',
                  )
                }
              />
            ) : (
              <p className="text-sm text-slate-600">
                Editor: {nameOf(m.assignedEditorId)}
                <br />
                Reviewer: {nameOf(m.reviewerId)}
              </p>
            )}
            {m.revisionDeadline && (
              <p className="mt-3 text-xs text-slate-500">
                Revision due {m.revisionDeadline}
              </p>
            )}
          </Card>

          {canReview && (
            <Card title="Decision">
              {next.length === 0 ? (
                <p className="text-sm text-slate-500">
                  This manuscript is in a final state.
                </p>
              ) : (
                <div className="space-y-3">
                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-600">
                      Feedback for the author (visible to author)
                    </span>
                    <textarea
                      rows={4}
                      value={feedback}
                      onChange={e => setFeedback(e.target.value)}
                      className={inputCls}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-600">
                      Revision deadline
                    </span>
                    <input
                      type="date"
                      value={deadline}
                      onChange={e => setDeadline(e.target.value)}
                      className={inputCls}
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {next.map(to => (
                      <button
                        key={to}
                        disabled={busy}
                        onClick={() => transition(to)}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${to === 'approved' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : to === 'rejected' ? 'bg-red-600 text-white hover:bg-red-700' : 'border border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                      >
                        {to === 'approved'
                          ? 'Approve'
                          : to === 'rejected'
                            ? 'Reject'
                            : to === 'revision_requested'
                              ? 'Request revision'
                              : `Move to ${STATUS_META[to].label}`}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400">
                    Feedback is required to{' '}
                    {FEEDBACK_REQUIRED.map(s =>
                      STATUS_META[s].label.toLowerCase(),
                    ).join(' or ')}
                    .
                  </p>
                </div>
              )}
              {m.status === 'approved' && (
                <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                  {m.productionStatus === 'sent_to_production' ? (
                    'Sent to Book Production.'
                  ) : (
                    <>
                      <p>
                        Approved. Send it to Book Production when you are ready.
                        No book or inventory is created automatically.
                      </p>
                      <button
                        disabled={busy}
                        onClick={() =>
                          run(
                            () => svc.sendToProduction(m.id, currentUser),
                            'Sent to Book Production.',
                          )
                        }
                        className="mt-2 rounded-lg bg-emerald-600 px-3 py-1.5 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Send to Book Production
                      </button>
                    </>
                  )}
                </div>
              )}
            </Card>
          )}

          <Card title="Author feedback history">
            {m.authorFeedback.length === 0 ? (
              <p className="text-sm text-slate-500">None sent.</p>
            ) : (
              <ul className="space-y-3">
                {m.authorFeedback.map(f => (
                  <li key={f.id} className="text-sm text-slate-700">
                    {f.text}
                    <p className="text-xs text-slate-400">
                      {fmt(f.at)} · {nameOf(f.byId)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {canReview && (
            <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-5">
              <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-amber-900">
                <Lock size={14} />
                Internal notes
              </h3>
              <p className="mb-3 text-xs text-amber-800">
                Only editors see these. They are never shown to authors.
              </p>
              <ul className="mb-3 space-y-2">
                {m.internalNotes.map(n => (
                  <li
                    key={n.id}
                    className="rounded-lg bg-white p-2 text-sm text-slate-700"
                  >
                    {n.text}
                    <p className="text-xs text-slate-400">
                      {fmt(n.at)} · {nameOf(n.byId)}
                    </p>
                  </li>
                ))}
              </ul>
              <textarea
                rows={3}
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Add a private note…"
                className={inputCls}
              />
              <button
                disabled={busy || !note.trim()}
                onClick={async () => {
                  if (
                    await run(
                      () => svc.addInternalNote(m.id, note.trim(), currentUser),
                      'Note added.',
                    )
                  )
                    setNote('');
                }}
                className="mt-2 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-50"
              >
                Add note
              </button>
            </section>
          )}
        </div>
      </div>
      {latest && (
        <p className="text-xs text-slate-400">
          Latest version: v{latest.version}
        </p>
      )}
    </div>
  );
}

function AssignForm({ m, editors, busy, onSave, onPriority }) {
  const [editorId, setEditorId] = useState(m.assignedEditorId ?? '');
  const [reviewerId, setReviewerId] = useState(m.reviewerId ?? '');
  const opts = (
    <>
      <option value="">Unassigned</option>
      {editors.map(e => (
        <option key={e.id} value={e.id}>
          {e.name}
        </option>
      ))}
    </>
  );
  return (
    <div className="space-y-3 text-sm">
      <label className="block">
        <span className="mb-1 block text-slate-600">Editor</span>
        <select
          value={editorId}
          onChange={e => setEditorId(e.target.value)}
          className={inputCls}
        >
          {opts}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-slate-600">Reviewer</span>
        <select
          value={reviewerId}
          onChange={e => setReviewerId(e.target.value)}
          className={inputCls}
        >
          {opts}
        </select>
      </label>
      <button
        disabled={busy}
        onClick={() => onSave({ editorId, reviewerId })}
        className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        Save assignment
      </button>
      <label className="block">
        <span className="mb-1 block text-slate-600">Priority</span>
        <select
          value={m.priority}
          disabled={busy}
          onChange={e => onPriority(e.target.value)}
          className={inputCls}
        >
          {Object.entries(PRIORITIES).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

// ===== Queue page =====
const CARDS = [
  { label: 'Total Submissions', match: () => true },
  {
    label: 'Pending Review',
    match: m => ['submitted', 'screening', 'resubmitted'].includes(m.status),
  },
  { label: 'In Review', match: m => m.status === 'in_review' },
  {
    label: 'Revision Requested',
    match: m => m.status === 'revision_requested',
  },
  { label: 'Approved', match: m => m.status === 'approved' },
  { label: 'Rejected', match: m => m.status === 'rejected' },
];
const sel =
  'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-500 focus:outline-none';
const day = d => (d ? new Date(d).toLocaleDateString() : '—');

function ManuscriptReview() {
  const { currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [editors, setEditors] = useState([]);
  const [state, setState] = useState('loading'); // loading | ready | error
  const [selectedId, setSelectedId] = useState(null);
  const [f, setF] = useState({
    q: '',
    status: '',
    genre: '',
    editor: '',
    from: '',
    to: '',
  });
  const [sort, setSort] = useState({ key: 'updatedAt', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const authorName = useCallback(
    id => authors.find(a => a.id === id)?.name ?? id ?? '—',
    [],
  );
  const editorName = useCallback(
    id => editors.find(e => e.id === id)?.name ?? id ?? 'Unassigned',
    [editors],
  );

  const load = useCallback(async () => {
    setState('loading');
    try {
      const [list, eds] = await Promise.all([
        listManuscripts(),
        getEditors(currentUser),
      ]);
      setItems(list.filter(m => canAccessManuscript(m, currentUser)));
      setEditors(eds);
      setState('ready');
    } catch {
      setState('error');
    }
  }, [currentUser]);
  useEffect(() => {
    load();
  }, [load]);

  const genres = useMemo(
    () => [...new Set(items.map(m => m.type).filter(Boolean))],
    [items],
  );
  const setFilter = (k, v) => {
    setF(p => ({ ...p, [k]: v }));
    setPage(1);
  };

  const rows = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    const val = m =>
      ({
        title: m.title,
        author: authorName(m.authorId),
        type: m.type,
        submittedAt: m.submittedAt,
        editor: editorName(m.assignedEditorId),
        updatedAt: m.updatedAt,
        status: m.status,
        priority: PRIORITIES[m.priority]?.rank ?? 1,
      })[sort.key];
    return items
      .filter(
        m =>
          !q ||
          [m.title, m.id, authorName(m.authorId)].some(s =>
            String(s ?? '')
              .toLowerCase()
              .includes(q),
          ),
      )
      .filter(m => !f.status || m.status === f.status)
      .filter(m => !f.genre || m.type === f.genre)
      .filter(
        m =>
          !f.editor ||
          (f.editor === 'none'
            ? !m.assignedEditorId
            : m.assignedEditorId === f.editor),
      )
      .filter(
        m => !f.from || (m.submittedAt && m.submittedAt.slice(0, 10) >= f.from),
      )
      .filter(
        m => !f.to || (m.submittedAt && m.submittedAt.slice(0, 10) <= f.to),
      )
      .sort((a, b) => {
        const x = val(a) ?? '',
          y = val(b) ?? '';
        return (x > y ? 1 : x < y ? -1 : 0) * (sort.dir === 'asc' ? 1 : -1);
      });
  }, [items, f, sort, authorName, editorName]);

  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pages);
  const visible = rows.slice((current - 1) * pageSize, current * pageSize);

  const toggleSort = key =>
    setSort(s => ({
      key,
      dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc',
    }));
  const Th = ({ k, children }) => (
    <th className="px-4 py-3 text-left font-medium">
      {k ? (
        <button
          onClick={() => toggleSort(k)}
          className="inline-flex items-center gap-1 hover:text-slate-900"
        >
          {children}
          {sort.key === k ? (
            sort.dir === 'asc' ? (
              <ArrowUp size={12} />
            ) : (
              <ArrowDown size={12} />
            )
          ) : (
            <ArrowUpDown size={12} className="text-slate-300" />
          )}
        </button>
      ) : (
        children
      )}
    </th>
  );

  const exportCsv = () => {
    const head = [
      'ID',
      'Title',
      'Author',
      'Genre',
      'Submitted',
      'Editor',
      'Last updated',
      'Status',
      'Priority',
    ];
    const esc = v => `"${String(v ?? '').replaceAll('"', '""')}"`;
    const body = rows.map(m =>
      [
        m.id,
        m.title,
        authorName(m.authorId),
        m.type,
        m.submittedAt,
        editorName(m.assignedEditorId),
        m.updatedAt,
        STATUS_META[m.status]?.label,
        PRIORITIES[m.priority]?.label,
      ]
        .map(esc)
        .join(','),
    );
    const url = URL.createObjectURL(
      new Blob([[head.map(esc).join(','), ...body].join('\n')], {
        type: 'text/csv',
      }),
    );
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: `manuscripts-${new Date().toISOString().slice(0, 10)}.csv`,
    });
    a.click();
    URL.revokeObjectURL(url);
  };

  if (selectedId)
    return (
      <ManuscriptDetails
        manuscriptId={selectedId}
        onBack={() => setSelectedId(null)}
        onChanged={load}
      />
    );

  return (
    <>
      <PageHeader
        title="Manuscript Review Queue"
        description="Review submitted manuscripts from authors and provide editorial feedback."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {CARDS.map(c => (
          <div
            key={c.label}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <p className="text-xs text-slate-500">{c.label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {state === 'ready' ? items.filter(c.match).length : '–'}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search
              size={16}
              className="absolute left-3 top-2.5 text-slate-400"
            />
            <input
              value={f.q}
              onChange={e => setFilter('q', e.target.value)}
              placeholder="Search title, author or manuscript ID…"
              className={`${sel} w-full pl-9`}
            />
          </div>
          <select
            className={sel}
            value={f.status}
            onChange={e => setFilter('status', e.target.value)}
            aria-label="Status"
          >
            <option value="">All statuses</option>
            {Object.entries(STATUS_META).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
          <select
            className={sel}
            value={f.genre}
            onChange={e => setFilter('genre', e.target.value)}
            aria-label="Genre"
          >
            <option value="">All genres</option>
            {genres.map(g => (
              <option key={g}>{g}</option>
            ))}
          </select>
          <select
            className={sel}
            value={f.editor}
            onChange={e => setFilter('editor', e.target.value)}
            aria-label="Editor"
          >
            <option value="">All editors</option>
            <option value="none">Unassigned</option>
            {editors.map(e => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            className={sel}
            value={f.from}
            onChange={e => setFilter('from', e.target.value)}
            aria-label="Submitted from"
          />
          <input
            type="date"
            className={sel}
            value={f.to}
            onChange={e => setFilter('to', e.target.value)}
            aria-label="Submitted to"
          />
          <button
            onClick={exportCsv}
            disabled={!rows.length}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <Download size={15} />
            Export CSV
          </button>
        </div>

        {state === 'loading' && (
          <p className="p-10 text-center text-sm text-slate-500">
            Loading manuscripts…
          </p>
        )}
        {state === 'error' && (
          <p className="p-10 text-center text-sm text-red-600">
            Could not load manuscripts.{' '}
            <button onClick={load} className="underline">
              Try again
            </button>
          </p>
        )}
        {state === 'ready' && rows.length === 0 && (
          <p className="p-10 text-center text-sm text-slate-500">
            {items.length
              ? 'No manuscripts match these filters.'
              : 'No manuscripts have been submitted yet.'}
          </p>
        )}

        {state === 'ready' && rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <Th k="title">Manuscript</Th>
                  <Th k="author">Author</Th>
                  <Th k="type">Genre</Th>
                  <Th k="submittedAt">Submitted</Th>
                  <Th k="editor">Editor</Th>
                  <Th k="updatedAt">Last updated</Th>
                  <Th k="status">Status</Th>
                  <Th k="priority">Priority</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{m.title}</p>
                      <p className="text-xs text-slate-400">{m.id}</p>
                    </td>
                    <td className="px-4 py-3">{authorName(m.authorId)}</td>
                    <td className="px-4 py-3">{m.type}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {day(m.submittedAt)}
                    </td>
                    <td className="px-4 py-3">
                      {editorName(m.assignedEditorId)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {day(m.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={m.status} />
                    </td>
                    <td className="px-4 py-3">
                      <PriorityPill priority={m.priority} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedId(m.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-white"
                      >
                        <Eye size={14} />
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {state === 'ready' && rows.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4 text-sm text-slate-600">
            <label className="flex items-center gap-2">
              Rows per page
              <select
                className={sel}
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                {[10, 25, 50, 100].map(n => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <span>
              {(current - 1) * pageSize + 1}–
              {Math.min(current * pageSize, rows.length)} of {rows.length}
            </span>
            <div className="flex gap-2">
              <button
                disabled={current === 1}
                onClick={() => setPage(current - 1)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={current === pages}
                onClick={() => setPage(current + 1)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default ManuscriptReview;
