import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  FiArrowLeft,
  FiBookOpen,
  FiChevronRight,
  FiDollarSign,
  FiEdit2,
  FiFolder,
  FiLayers,
  FiPlus,
  FiPrinter,
  FiSearch,
  FiTrash2,
  FiTruck,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../../components/dashboard/PageHeader';
import { useAuth } from '../../../context/useAuth';
import { useData } from '../../../context/useData';
import {
  EXPENSE_PAYMENT_METHODS,
  PROFILE_COLORS,
  addExpenseEntry,
  addExpenseProfile,
  addExpenseVendor,
  deleteExpenseEntry,
  deleteExpenseProfile,
  getExpenseLedger,
  getExpenseProfiles,
  getExpenseVendors,
  summarizeProfiles,
  summarizeVendors,
  updateExpenseEntry,
} from '../../../utils/costProfilesStorage';
import { logEmployeeActivity } from '../../../utils/employeeStorage';
import { formatCurrency } from '../../../utils/format';

const COLOR_ICON = {
  indigo: 'text-indigo-600',
  purple: 'text-purple-600',
  amber: 'text-amber-600',
  sky: 'text-sky-600',
  emerald: 'text-emerald-600',
  rose: 'text-rose-600',
};

function getProfileIcon(slug) {
  switch (slug) {
    case 'manuscript':
      return FiBookOpen;
    case 'cover-design':
      return FiLayers;
    case 'binding':
      return FiFolder;
    case 'transport':
      return FiTruck;
    default:
      return FiDollarSign;
  }
}

function getTodayDateInput() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateOnly(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function ExpenseMemoModal({ entry, profileName, onClose }) {
  if (!entry) return null;
  const due = Math.max(0, (Number(entry.billAmount) || 0) - (Number(entry.paidAmount) || 0));

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/60 p-4 print:static print:bg-white print:p-0"
    >
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #expense-payment-memo, #expense-payment-memo * { visibility: visible !important; }
          #expense-payment-memo {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            padding: 12mm !important;
            background: white !important;
          }
          @page { margin: 10mm; size: A4 portrait; }
        }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl bg-white shadow-xl print:shadow-none print:rounded-none"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 print:hidden">
          <span className="text-sm font-semibold text-slate-800">Payment Memo</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              title="Print Memo"
              aria-label="Print Memo"
              className="p-1.5 text-slate-700 hover:text-dark transition"
            >
              <FiPrinter size={18} />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close"
              aria-label="Close"
              className="p-1.5 text-slate-400 hover:text-dark transition"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        <div id="expense-payment-memo" className="p-6 text-xs text-slate-800 space-y-4">
          <div className="border-b border-slate-300 pb-3 text-center">
            <h2 className="font-heading text-xl font-bold text-slate-900">
              Hosonta Prokashon
            </h2>
            <p className="text-[11px] text-slate-500">
              38/2 Mannan Market, Banglabazar, Dhaka-1100 • Hotline: 01628-037591
            </p>
            <p className="mt-1.5 font-bold uppercase tracking-wider text-slate-800">
              Expense & Due Payment Memo
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p>
                <strong>Profile:</strong> {profileName || 'Expense'}
              </p>
              <p>
                <strong>Payee:</strong> {entry.vendorName}
              </p>
              {entry.bookTitle && (
                <p>
                  <strong>Book:</strong> {entry.bookTitle}
                </p>
              )}
              {entry.description && (
                <p>
                  <strong>Note:</strong> {entry.description}
                </p>
              )}
            </div>
            <div className="space-y-1 text-right">
              <p>
                <strong>Memo No:</strong> {entry.refNo}
              </p>
              <p>
                <strong>Date:</strong> {formatDateOnly(entry.createdAt)}
              </p>
              <p>
                <strong>Method:</strong> {entry.method || 'Cash'}
              </p>
              <p>
                <strong>Paid By:</strong> {entry.recordedByName} ({entry.recordedByRole})
              </p>
            </div>
          </div>

          <table className="w-full border border-slate-200 text-left">
            <thead className="border-b border-slate-200 bg-white">
              <tr>
                <th className="px-3 py-2 font-semibold">Description</th>
                <th className="px-3 py-2 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {entry.billAmount > 0 && (
                <tr>
                  <td className="px-3 py-2">Total Bill / Payable</td>
                  <td className="px-3 py-2 text-right font-semibold">
                    {formatCurrency(entry.billAmount)}
                  </td>
                </tr>
              )}
              <tr>
                <td className="px-3 py-2 font-semibold">Paid Amount</td>
                <td className="px-3 py-2 text-right font-bold text-emerald-700">
                  {formatCurrency(entry.paidAmount)}
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2">Remaining Due</td>
                <td className="px-3 py-2 text-right font-semibold text-rose-600">
                  {formatCurrency(due)}
                </td>
              </tr>
            </tbody>
          </table>

          {entry.authorizedBy && (
            <p className="text-[11px] text-slate-500">
              Approval / Source: {entry.authorizedBy}
            </p>
          )}

          <div className="grid grid-cols-2 gap-6 pt-8 text-center text-[11px] text-slate-500">
            <div className="border-t border-dashed border-slate-300 pt-1">
              Receiver Signature
            </div>
            <div className="border-t border-dashed border-slate-300 pt-1">
              Authorized Signature
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExpenseProfiles() {
  const { profileSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { books } = useData();
  const isAdmin = currentUser?.role === 'admin';

  const basePath = location.pathname.startsWith('/dashboard/all-users/expense-profiles')
    ? '/dashboard/all-users/expense-profiles'
    : '/dashboard/expense-profiles';

  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  const [overviewTab, setOverviewTab] = useState('profiles'); // 'profiles' | 'history'
  const [detailTab, setDetailTab] = useState('history'); // 'history' | 'payees'

  const [profileSearch, setProfileSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProfileId, setFilterProfileId] = useState('all');
  const [filterStaffName, setFilterStaffName] = useState('all');

  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [entryMode, setEntryMode] = useState('expense'); // 'expense' | 'pay' | 'bill'
  const [formState, setFormState] = useState({
    profileId: '',
    vendorId: '',
    customVendorName: '',
    customVendorPhone: '',
    billAmount: '',
    paidAmount: '',
    dueAmount: '',
    date: getTodayDateInput(),
    method: 'Cash',
    bookTitle: '',
    authorizedBy: '',
    description: '',
  });

  const [memoEntry, setMemoEntry] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [newProfileForm, setNewProfileForm] = useState({
    name: '',
    subtitle: '',
    color: 'indigo',
  });

  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [newVendorForm, setNewVendorForm] = useState({
    profileId: '',
    name: '',
    phone: '',
    notes: '',
  });

  const [confirmState, setConfirmState] = useState(null);

  const { profiles, vendors, ledger, enrichedProfiles, activeProfile, profileMap } =
    useMemo(() => {
      void refreshKey;
      const rawProfiles = getExpenseProfiles();
      const rawVendors = getExpenseVendors();
      const rawLedger = getExpenseLedger();
      const { profiles: summarized } = summarizeProfiles(
        rawProfiles,
        rawVendors,
        rawLedger,
      );
      const foundProfile = profileSlug
        ? summarized.find((p) => p.slug === profileSlug) || null
        : null;
      const map = new Map(summarized.map((p) => [p.id, p]));
      return {
        profiles: rawProfiles,
        vendors: rawVendors,
        ledger: rawLedger,
        enrichedProfiles: summarized,
        activeProfile: foundProfile,
        profileMap: map,
      };
    }, [profileSlug, refreshKey]);

  const filteredProfiles = useMemo(() => {
    const q = profileSearch.trim().toLowerCase();
    if (!q) return enrichedProfiles;
    return enrichedProfiles.filter((p) => p.name.toLowerCase().includes(q));
  }, [enrichedProfiles, profileSearch]);

  const activeProfileVendors = useMemo(() => {
    if (!activeProfile) return [];
    return summarizeVendors(activeProfile.id, vendors, ledger);
  }, [activeProfile, vendors, ledger]);

  const modalVendorBalances = useMemo(() => {
    const pid = formState.profileId || activeProfile?.id || profiles[0]?.id;
    if (!pid) return [];
    return summarizeVendors(pid, vendors, ledger);
  }, [formState.profileId, activeProfile, profiles, vendors, ledger]);

  const selectedVendorBalance = useMemo(() => {
    if (!formState.vendorId || formState.vendorId === '__new__') return null;
    return modalVendorBalances.find((v) => v.id === formState.vendorId) || null;
  }, [formState.vendorId, modalVendorBalances]);

  const uniqueStaffNames = useMemo(() => {
    const set = new Set(ledger.map((item) => item.recordedByName).filter(Boolean));
    return Array.from(set);
  }, [ledger]);

  const filteredLedger = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ledger.filter((entry) => {
      if (activeProfile && entry.profileId !== activeProfile.id) return false;
      if (!activeProfile && filterProfileId !== 'all' && entry.profileId !== filterProfileId) {
        return false;
      }
      if (filterStaffName !== 'all' && entry.recordedByName !== filterStaffName) {
        return false;
      }
      if (!q) return true;
      const profName = profileMap.get(entry.profileId)?.name || '';
      return [
        entry.refNo,
        entry.vendorName,
        entry.bookTitle,
        entry.description,
        entry.recordedByName,
        profName,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [ledger, activeProfile, filterProfileId, filterStaffName, searchQuery, profileMap]);

  function openQuickEntryModal({
    profileId = '',
    vendorId = '',
    mode = 'expense',
    suggestedPaid = '',
    suggestedBill = '',
    entry = null,
  } = {}) {
    if (entry) {
      setEditingEntry(entry);
      const entryDate = entry.createdAt ? String(entry.createdAt).slice(0, 10) : getTodayDateInput();
      const bill = Number(entry.billAmount) || 0;
      const paid = Number(entry.paidAmount) || 0;
      const due = Math.max(0, bill - paid);

      if (bill === 0 && paid > 0) setEntryMode('pay');
      else if (paid === 0 && bill > 0) setEntryMode('bill');
      else setEntryMode('expense');

      setFormState({
        profileId: entry.profileId,
        vendorId: entry.vendorId || '',
        customVendorName: entry.vendorName || '',
        customVendorPhone: '',
        billAmount: bill ? String(bill) : '',
        paidAmount: paid ? String(paid) : '',
        dueAmount: due ? String(due) : '',
        date: entryDate,
        method: entry.method || 'Cash',
        bookTitle: entry.bookTitle || '',
        authorizedBy: entry.authorizedBy || '',
        description: entry.description || '',
      });
      setEntryModalOpen(true);
      return;
    }

    const defaultPid = profileId || activeProfile?.id || profiles[0]?.id || 'prof-binding';
    const vendorsForProf = vendors.filter((v) => v.profileId === defaultPid);
    const initialVendorId =
      vendorId || (vendorsForProf.length ? vendorsForProf[0].id : '__new__');

    setEditingEntry(null);
    setEntryMode(mode);
    setFormState({
      profileId: defaultPid,
      vendorId: initialVendorId,
      customVendorName: '',
      customVendorPhone: '',
      billAmount: suggestedBill ? String(suggestedBill) : '',
      paidAmount: suggestedPaid ? String(suggestedPaid) : '',
      dueAmount: '',
      date: getTodayDateInput(),
      method: 'Cash',
      bookTitle: '',
      authorizedBy: isAdmin ? 'Self (Admin)' : 'Phone approval from Admin',
      description: '',
    });
    setEntryModalOpen(true);
  }

  function handleProfileChangeInModal(nextProfileId) {
    const vendorsForProf = vendors.filter((v) => v.profileId === nextProfileId);
    setFormState((prev) => ({
      ...prev,
      profileId: nextProfileId,
      vendorId: vendorsForProf[0]?.id || '__new__',
      customVendorName: '',
      customVendorPhone: '',
    }));
  }

  function saveEntryRecord(printAfter = false) {
    if (!formState.profileId) {
      toast.error('Please select an expense profile.');
      return;
    }

    const isCreatingVendor = formState.vendorId === '__new__' || !formState.vendorId;
    if (isCreatingVendor && !formState.customVendorName.trim()) {
      toast.error('Please select or enter a payee name.');
      return;
    }

    let billAmt = 0;
    let paidAmt = 0;

    if (entryMode === 'pay') {
      billAmt = 0;
      paidAmt = Math.max(0, Number(formState.paidAmount) || 0);
    } else if (entryMode === 'bill') {
      billAmt = Math.max(0, Number(formState.billAmount) || 0);
      paidAmt = 0;
    } else {
      paidAmt = Math.max(0, Number(formState.paidAmount) || 0);
      const dueAmt = Math.max(0, Number(formState.dueAmount) || 0);
      billAmt = paidAmt + dueAmt;
    }

    if (billAmt <= 0 && paidAmt <= 0) {
      toast.error('Enter an amount greater than 0.');
      return;
    }

    const entryIso = formState.date
      ? new Date(`${formState.date}T12:00:00`).toISOString()
      : new Date().toISOString();

    if (editingEntry) {
      let resolvedVendorId = formState.vendorId;
      let resolvedVendorName = formState.customVendorName;
      if (formState.vendorId === '__new__') {
        const createdV = addExpenseVendor({
          profileId: formState.profileId,
          name: formState.customVendorName,
          phone: formState.customVendorPhone,
        });
        if (createdV) {
          resolvedVendorId = createdV.id;
          resolvedVendorName = createdV.name;
        }
      } else {
        const matched = vendors.find((v) => v.id === formState.vendorId);
        if (matched) resolvedVendorName = matched.name;
      }

      const updated = updateExpenseEntry(editingEntry.id, {
        profileId: formState.profileId,
        vendorId: resolvedVendorId,
        vendorName: resolvedVendorName,
        billAmount: billAmt,
        paidAmount: paidAmt,
        method: formState.method,
        bookTitle: formState.bookTitle,
        authorizedBy: formState.authorizedBy,
        description: formState.description,
        createdAt: entryIso,
      });
      toast.success(`Updated entry ${editingEntry.refNo}.`);
      setEntryModalOpen(false);
      triggerRefresh();
      if (printAfter && updated) setMemoEntry(updated);
      return;
    }

    const created = addExpenseEntry({
      profileId: formState.profileId,
      vendorId: formState.vendorId === '__new__' ? '' : formState.vendorId,
      vendorName: formState.customVendorName,
      vendorPhone: formState.customVendorPhone,
      bookTitle: formState.bookTitle,
      description: formState.description,
      billAmount: billAmt,
      paidAmount: paidAmt,
      method: formState.method,
      recordedById: currentUser?.id || 'staff',
      recordedByName: currentUser?.name || 'Staff Member',
      recordedByRole: currentUser?.role || 'employee',
      authorizedBy: formState.authorizedBy,
      createdAt: entryIso,
    });

    if (!created) {
      toast.error('Could not save expense entry.');
      return;
    }

    const profName = profileMap.get(formState.profileId)?.name || 'Expense';
    if (currentUser?.role === 'employee' && currentUser?.id) {
      const actionSummary =
        paidAmt > 0
          ? `Paid ${formatCurrency(paidAmt)} (${formState.method}) to ${created.vendorName}`
          : `Logged bill ${formatCurrency(billAmt)} for ${created.vendorName}`;
      logEmployeeActivity(currentUser.id, {
        type: 'expense',
        title: `${profName} Expense (${created.refNo})`,
        description: `${actionSummary}${formState.description ? ` — ${formState.description}` : ''}`,
      });
    }

    toast.success(`${profName} entry saved.`);
    setEntryModalOpen(false);
    triggerRefresh();
    if (printAfter || (entryMode === 'pay' && paidAmt > 0)) {
      setMemoEntry(created);
    }
  }

  function handleSaveEntry(e) {
    e.preventDefault();
    saveEntryRecord(false);
  }

  function handleCreateProfile(e) {
    e.preventDefault();
    if (!newProfileForm.name.trim()) {
      toast.error('Profile name is required.');
      return;
    }
    const created = addExpenseProfile(newProfileForm);
    if (created) {
      toast.success(`Created "${created.name}".`);
      setProfileModalOpen(false);
      setNewProfileForm({ name: '', subtitle: '', color: 'indigo' });
      triggerRefresh();
    }
  }

  function handleCreateVendor(e) {
    e.preventDefault();
    const pid = newVendorForm.profileId || activeProfile?.id || profiles[0]?.id;
    if (!pid || !newVendorForm.name.trim()) {
      toast.error('Payee name is required.');
      return;
    }
    const created = addExpenseVendor({
      profileId: pid,
      name: newVendorForm.name,
      phone: newVendorForm.phone,
      notes: newVendorForm.notes,
    });
    if (created) {
      toast.success(`Added payee "${created.name}".`);
      setVendorModalOpen(false);
      setNewVendorForm({ profileId: '', name: '', phone: '', notes: '' });
      triggerRefresh();
    }
  }

  function executeConfirm() {
    if (!confirmState) return;
    if (confirmState.type === 'entry') {
      deleteExpenseEntry(confirmState.id);
      toast.success(`Deleted ${confirmState.label}.`);
      triggerRefresh();
    } else if (confirmState.type === 'profile') {
      const ok = deleteExpenseProfile(confirmState.id);
      if (ok) {
        toast.success(`Deleted "${confirmState.label}".`);
        if (activeProfile?.id === confirmState.id) navigate(basePath);
        triggerRefresh();
      } else {
        toast.error('Default profiles cannot be deleted.');
      }
    }
    setConfirmState(null);
  }

  if (profileSlug && !activeProfile) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <h2 className="text-base font-bold text-slate-900">Profile Not Found</h2>
        <Link
          to={basePath}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <FiArrowLeft />
          Back
        </Link>
      </div>
    );
  }

  const inputCls =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary';

  return (
    <div className="space-y-4">
      {activeProfile && (
        <div className="flex items-center justify-between">
          <Link
            to={basePath}
            title="Back to Expense Profiles"
            aria-label="Back to Expense Profiles"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-dark"
          >
            <FiArrowLeft size={16} />
          </Link>
        </div>
      )}

      <PageHeader
        title={activeProfile ? activeProfile.name : 'Expense Profiles'}
        action={
          <div className="flex items-center gap-2">
            {!activeProfile && isAdmin && (
              <button
                type="button"
                onClick={() => setProfileModalOpen(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300"
              >
                <FiPlus size={14} />
                <span>New Profile</span>
              </button>
            )}
            {activeProfile && (
              <button
                type="button"
                onClick={() => {
                  setNewVendorForm({
                    profileId: activeProfile.id,
                    name: '',
                    phone: '',
                    notes: '',
                  });
                  setVendorModalOpen(true);
                }}
                title="Add Payee"
                aria-label="Add Payee"
                className="p-2 text-slate-600 hover:text-dark transition"
              >
                <FiUsers size={17} />
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                openQuickEntryModal({
                  profileId: activeProfile?.id || '',
                  mode: 'expense',
                })
              }
              className="inline-flex items-center gap-1 rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-dark hover:bg-primary-hover"
            >
              <FiPlus size={14} />
              <span>Add Expense</span>
            </button>
          </div>
        }
      />

      {/* Inside Profile: Clean Minimal Summary Row */}
      {activeProfile && (
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-slate-500">Payable</p>
            <p className="mt-0.5 text-base font-bold text-slate-900">
              {formatCurrency(activeProfile.totalPayable)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Paid</p>
            <p className="mt-0.5 text-base font-bold text-emerald-700">
              {formatCurrency(activeProfile.totalPaid)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Due</p>
            <p
              className={`mt-0.5 text-base font-bold ${
                activeProfile.totalDue > 0 ? 'text-rose-600' : 'text-slate-700'
              }`}
            >
              {formatCurrency(activeProfile.totalDue)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Entries</p>
            <p className="mt-0.5 text-base font-bold text-slate-900">
              {activeProfile.entryCount}
            </p>
          </div>
        </div>
      )}

      {/* Navigation Tabs + Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2.5">
        {!activeProfile ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOverviewTab('profiles')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                overviewTab === 'profiles'
                  ? 'border border-slate-300 bg-white text-slate-900'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Profiles ({enrichedProfiles.length})
            </button>
            <button
              type="button"
              onClick={() => setOverviewTab('history')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                overviewTab === 'history'
                  ? 'border border-slate-300 bg-white text-slate-900'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All History ({ledger.length})
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDetailTab('history')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                detailTab === 'history'
                  ? 'border border-slate-300 bg-white text-slate-900'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              History ({filteredLedger.length})
            </button>
            <button
              type="button"
              onClick={() => setDetailTab('payees')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                detailTab === 'payees'
                  ? 'border border-slate-300 bg-white text-slate-900'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Payees ({activeProfileVendors.length})
            </button>
          </div>
        )}

        {!activeProfile && overviewTab === 'profiles' && (
          <div className="relative w-full sm:w-64">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              value={profileSearch}
              onChange={(e) => setProfileSearch(e.target.value)}
              placeholder="Search profile..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs text-slate-900 outline-none focus:border-primary"
            />
          </div>
        )}
      </div>

      {/* OVERVIEW: CLEAN PROFILES TABLE (Click row to open Profile) */}
      {!activeProfile && overviewTab === 'profiles' && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-white text-slate-500">
                <tr className="whitespace-nowrap">
                  <th className="px-4 py-3 font-semibold">Profile</th>
                  <th className="px-4 py-3 text-center font-semibold">Entries</th>
                  <th className="px-4 py-3 text-right font-semibold">Payable</th>
                  <th className="px-4 py-3 text-right font-semibold">Paid</th>
                  <th className="px-4 py-3 text-right font-semibold">Due</th>
                  <th className="px-4 py-3 font-semibold">Last Date</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProfiles.map((prof) => {
                  const Icon = getProfileIcon(prof.slug);
                  const iconColor = COLOR_ICON[prof.color] || 'text-slate-600';
                  return (
                    <tr
                      key={prof.id}
                      onClick={() => navigate(`${basePath}/${prof.slug}`)}
                      className="cursor-pointer transition hover:bg-slate-50/70"
                    >
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <Icon className={`shrink-0 text-base ${iconColor}`} />
                          <span className="text-sm font-semibold text-slate-900">
                            {prof.name}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-center font-medium text-slate-600">
                        {prof.entryCount}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold text-slate-900">
                        {formatCurrency(prof.totalPayable)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold text-emerald-700">
                        {formatCurrency(prof.totalPaid)}
                      </td>
                      <td
                        className={`whitespace-nowrap px-4 py-3.5 text-right font-semibold ${
                          prof.totalDue > 0 ? 'text-rose-600' : 'text-slate-500'
                        }`}
                      >
                        {formatCurrency(prof.totalDue)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">
                        {prof.latestEntry ? formatDateOnly(prof.latestEntry.createdAt) : '—'}
                      </td>
                      <td
                        className="whitespace-nowrap px-4 py-3.5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openQuickEntryModal({
                                profileId: prof.id,
                                mode: 'expense',
                              })
                            }
                            title="Add Payment"
                            aria-label="Add Payment"
                            className="p-1 text-emerald-600 hover:text-emerald-800 transition"
                          >
                            <FiPlus size={16} />
                          </button>
                          {!prof.isDefault && isAdmin && (
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmState({
                                  type: 'profile',
                                  id: prof.id,
                                  label: prof.name,
                                })
                              }
                              title="Delete Profile"
                              aria-label="Delete Profile"
                              className="p-1 text-rose-500 hover:text-rose-700 transition"
                            >
                              <FiTrash2 size={15} />
                            </button>
                          )}
                          <Link
                            to={`${basePath}/${prof.slug}`}
                            title="Open Profile"
                            aria-label="Open Profile"
                            className="p-1 text-slate-400 hover:text-dark transition"
                          >
                            <FiChevronRight size={16} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL VIEW -> PAYEES TABLE */}
      {activeProfile && detailTab === 'payees' && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {activeProfileVendors.length === 0 ? (
            <p className="py-10 text-center text-xs text-slate-500">
              No payees in {activeProfile.name} yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-white text-slate-500">
                  <tr className="whitespace-nowrap">
                    <th className="px-4 py-3 font-semibold">Payee</th>
                    <th className="px-4 py-3 font-semibold">Phone</th>
                    <th className="px-4 py-3 text-center font-semibold">Entries</th>
                    <th className="px-4 py-3 text-right font-semibold">Payable</th>
                    <th className="px-4 py-3 text-right font-semibold">Paid</th>
                    <th className="px-4 py-3 text-right font-semibold">Due</th>
                    <th className="px-4 py-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeProfileVendors.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-slate-900">
                        {v.name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">
                        {v.phone || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-center text-slate-600">
                        {v.entryCount}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right font-medium text-slate-900">
                        {formatCurrency(v.totalPayable)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold text-emerald-700">
                        {formatCurrency(v.totalPaid)}
                      </td>
                      <td
                        className={`whitespace-nowrap px-4 py-3.5 text-right font-semibold ${
                          v.totalDue > 0 ? 'text-rose-600' : 'text-slate-500'
                        }`}
                      >
                        {formatCurrency(v.totalDue)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            openQuickEntryModal({
                              profileId: activeProfile.id,
                              vendorId: v.id,
                              mode: v.totalDue > 0 ? 'pay' : 'expense',
                              suggestedPaid: v.totalDue > 0 ? v.totalDue : '',
                            })
                          }
                          title={v.totalDue > 0 ? 'Pay Due' : 'Add Payment'}
                          aria-label={v.totalDue > 0 ? 'Pay Due' : 'Add Payment'}
                          className="p-1 text-emerald-600 hover:text-emerald-800 transition"
                        >
                          <FiDollarSign size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* HISTORY TABLE (Inside Profile & Overview History Tab) */}
      {((!activeProfile && overviewTab === 'history') ||
        (activeProfile && detailTab === 'history')) && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search payee, book, note..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs text-slate-900 outline-none focus:border-primary"
              />
            </div>

            {!activeProfile && (
              <select
                value={filterProfileId}
                onChange={(e) => setFilterProfileId(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-primary"
              >
                <option value="all">All Profiles</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}

            <select
              value={filterStaffName}
              onChange={(e) => setFilterStaffName(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-primary"
            >
              <option value="all">By: Everyone</option>
              {uniqueStaffNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {filteredLedger.length === 0 ? (
              <p className="py-10 text-center text-xs text-slate-500">
                No transactions found.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-white text-slate-500">
                    <tr className="whitespace-nowrap">
                      <th className="px-4 py-3 font-semibold">Date</th>
                      {!activeProfile && <th className="px-4 py-3 font-semibold">Profile</th>}
                      <th className="px-4 py-3 font-semibold">Payee</th>
                      <th className="px-4 py-3 font-semibold">Book / Note</th>
                      <th className="px-4 py-3 text-right font-semibold">Paid</th>
                      <th className="px-4 py-3 text-right font-semibold">Due</th>
                      <th className="px-4 py-3 font-semibold">Method</th>
                      <th className="px-4 py-3 font-semibold">By</th>
                      <th className="px-4 py-3 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLedger.map((entry) => {
                      const prof = profileMap.get(entry.profileId);
                      const entryDue = Math.max(
                        0,
                        (Number(entry.billAmount) || 0) - (Number(entry.paidAmount) || 0),
                      );
                      return (
                        <tr key={entry.id} className="hover:bg-slate-50/70">
                          <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                            {formatDateOnly(entry.createdAt)}
                          </td>
                          {!activeProfile && (
                            <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-800">
                              {prof ? (
                                <Link to={`${basePath}/${prof.slug}`} className="hover:underline">
                                  {prof.name}
                                </Link>
                              ) : (
                                '—'
                              )}
                            </td>
                          )}
                          <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">
                            {entry.vendorName}
                          </td>
                          <td className="max-w-xs truncate px-4 py-3 text-slate-500" title={entry.description || entry.bookTitle}>
                            {entry.bookTitle || entry.description || '—'}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-emerald-700">
                            {entry.paidAmount > 0 ? formatCurrency(entry.paidAmount) : '—'}
                          </td>
                          <td
                            className={`whitespace-nowrap px-4 py-3 text-right font-semibold ${
                              entryDue > 0 ? 'text-rose-600' : 'text-slate-400'
                            }`}
                          >
                            {entryDue > 0 ? formatCurrency(entryDue) : '—'}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                            {entry.method || 'Cash'}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                            {entry.recordedByName}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setMemoEntry(entry)}
                                title="Print Memo"
                                aria-label="Print Memo"
                                className="p-1 text-slate-600 hover:text-dark transition"
                              >
                                <FiPrinter size={15} />
                              </button>
                              {isAdmin && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => openQuickEntryModal({ entry })}
                                    title="Edit"
                                    aria-label="Edit"
                                    className="p-1 text-slate-600 hover:text-dark transition"
                                  >
                                    <FiEdit2 size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setConfirmState({
                                        type: 'entry',
                                        id: entry.id,
                                        label: entry.refNo,
                                      })
                                    }
                                    title="Delete"
                                    aria-label="Delete"
                                    className="p-1 text-rose-500 hover:text-rose-700 transition"
                                  >
                                    <FiTrash2 size={14} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: RECORD EXPENSE / PAYMENT */}
      {entryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white p-5 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                {editingEntry ? `Edit ${editingEntry.refNo}` : 'Record Expense / Payment'}
              </h2>
              <button
                type="button"
                onClick={() => setEntryModalOpen(false)}
                title="Close"
                aria-label="Close"
                className="p-1 text-slate-400 hover:text-dark"
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'expense', label: 'Expense + Due' },
                  { id: 'pay', label: 'Pay Due' },
                  { id: 'bill', label: 'Bill Only' },
                ].map((modeOpt) => (
                  <button
                    key={modeOpt.id}
                    type="button"
                    onClick={() => setEntryMode(modeOpt.id)}
                    className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                      entryMode === modeOpt.id
                        ? 'border-primary bg-primary text-dark'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {modeOpt.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Profile
                  </label>
                  <select
                    value={formState.profileId}
                    onChange={(e) => handleProfileChangeInModal(e.target.value)}
                    className={inputCls}
                  >
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formState.date}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, date: e.target.value }))
                    }
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Payee
                </label>
                <select
                  value={formState.vendorId}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, vendorId: e.target.value }))
                  }
                  className={inputCls}
                >
                  {modalVendorBalances.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} {v.totalDue > 0 ? `(Due: ${formatCurrency(v.totalDue)})` : ''}
                    </option>
                  ))}
                  <option value="__new__">+ New Payee</option>
                </select>

                {selectedVendorBalance && selectedVendorBalance.totalDue > 0 && entryMode !== 'bill' && (
                  <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500">
                    <span>Current Due: {formatCurrency(selectedVendorBalance.totalDue)}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormState((prev) => ({
                          ...prev,
                          paidAmount: String(selectedVendorBalance.totalDue),
                        }))
                      }
                      className="font-semibold text-primary hover:underline"
                    >
                      Fill Due
                    </button>
                  </div>
                )}

                {formState.vendorId === '__new__' && (
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <input
                      type="text"
                      required
                      value={formState.customVendorName}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          customVendorName: e.target.value,
                        }))
                      }
                      placeholder="Payee name"
                      className={inputCls}
                    />
                    <input
                      type="text"
                      value={formState.customVendorPhone}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          customVendorPhone: e.target.value,
                        }))
                      }
                      placeholder="Phone (optional)"
                      className={inputCls}
                    />
                  </div>
                )}
              </div>

              {entryMode === 'expense' && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Amount Paid (৳) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={formState.paidAmount}
                      onChange={(e) =>
                        setFormState((prev) => ({ ...prev, paidAmount: e.target.value }))
                      }
                      placeholder="0"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Due Amount (৳, Optional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={formState.dueAmount}
                      onChange={(e) =>
                        setFormState((prev) => ({ ...prev, dueAmount: e.target.value }))
                      }
                      placeholder="0"
                      className={inputCls}
                    />
                  </div>
                </div>
              )}

              {entryMode === 'pay' && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Paid Amount (৳) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={formState.paidAmount}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, paidAmount: e.target.value }))
                    }
                    placeholder="0"
                    className={inputCls}
                  />
                </div>
              )}

              {entryMode === 'bill' && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Bill Amount (৳) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={formState.billAmount}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, billAmount: e.target.value }))
                    }
                    placeholder="0"
                    className={inputCls}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {entryMode !== 'bill' && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Payment Method
                    </label>
                    <select
                      value={formState.method}
                      onChange={(e) =>
                        setFormState((prev) => ({ ...prev, method: e.target.value }))
                      }
                      className={inputCls}
                    >
                      {EXPENSE_PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Related Book (Optional)
                  </label>
                  <select
                    value={formState.bookTitle}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, bookTitle: e.target.value }))
                    }
                    className={inputCls}
                  >
                    <option value="">None</option>
                    {(books || []).map((b) => (
                      <option key={b.id} value={b.title}>
                        {b.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Note
                </label>
                <input
                  type="text"
                  value={formState.description}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Optional note..."
                  className={inputCls}
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 pt-3">
                <button
                  type="button"
                  onClick={() => setEntryModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => saveEntryRecord(true)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-800 hover:border-slate-400"
                >
                  Save & Print Memo
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-dark hover:bg-primary-hover"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PRINTABLE PAYMENT MEMO */}
      {memoEntry && (
        <ExpenseMemoModal
          entry={memoEntry}
          profileName={profileMap.get(memoEntry.profileId)?.name}
          onClose={() => setMemoEntry(null)}
        />
      )}

      {/* MODAL: NEW EXPENSE PROFILE */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-base font-bold text-slate-900">New Expense Profile</h2>
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                title="Close"
                aria-label="Close"
                className="p-1 text-slate-400 hover:text-dark"
              >
                <FiX size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateProfile} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={newProfileForm.name}
                  onChange={(e) =>
                    setNewProfileForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Profile name"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Icon Color
                </label>
                <select
                  value={newProfileForm.color}
                  onChange={(e) =>
                    setNewProfileForm((p) => ({ ...p, color: e.target.value }))
                  }
                  className={inputCls}
                >
                  {PROFILE_COLORS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-dark"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD PAYEE */}
      {vendorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-base font-bold text-slate-900">Add Payee</h2>
              <button
                type="button"
                onClick={() => setVendorModalOpen(false)}
                title="Close"
                aria-label="Close"
                className="p-1 text-slate-400 hover:text-dark"
              >
                <FiX size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateVendor} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={newVendorForm.name}
                  onChange={(e) =>
                    setNewVendorForm((v) => ({ ...v, name: e.target.value }))
                  }
                  placeholder="Payee name"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Phone
                </label>
                <input
                  type="text"
                  value={newVendorForm.phone}
                  onChange={(e) =>
                    setNewVendorForm((v) => ({ ...v, phone: e.target.value }))
                  }
                  placeholder="01XXXXXXXXX"
                  className={inputCls}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVendorModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-dark"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE */}
      {confirmState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Confirm Delete</h3>
            <p className="mt-2 text-xs text-slate-600">
              Delete <strong>{confirmState.label}</strong>?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmState(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeConfirm}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
