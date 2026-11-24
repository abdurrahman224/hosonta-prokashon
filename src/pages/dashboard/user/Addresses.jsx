import { useEffect, useState } from 'react';
import {
  FiBriefcase,
  FiCheck,
  FiEdit2,
  FiHome,
  FiMapPin,
  FiPhone,
  FiPlus,
  FiTrash2,
  FiX,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import ConfirmModal from '../../../components/dashboard/ConfirmModal';
import { useAuth } from '../../../context/useAuth';
import { getAddresses, saveAddresses } from '../../../utils/userStorage';

/* ───────── বাংলাদেশের বিভাগ ও জেলা ───────── */
const locations = {
  ঢাকা: [
    'ঢাকা',
    'গাজীপুর',
    'নারায়ণগঞ্জ',
    'নরসিংদী',
    'মানিকগঞ্জ',
    'মুন্সীগঞ্জ',
    'টাঙ্গাইল',
    'কিশোরগঞ্জ',
    'ফরিদপুর',
    'রাজবাড়ী',
    'গোপালগঞ্জ',
    'মাদারীপুর',
    'শরীয়তপুর',
  ],
  চট্টগ্রাম: [
    'চট্টগ্রাম',
    'কক্সবাজার',
    'কুমিল্লা',
    'ব্রাহ্মণবাড়িয়া',
    'চাঁদপুর',
    'ফেনী',
    'নোয়াখালী',
    'লক্ষ্মীপুর',
    'খাগড়াছড়ি',
    'রাঙ্গামাটি',
    'বান্দরবান',
  ],
  রাজশাহী: [
    'রাজশাহী',
    'নাটোর',
    'নওগাঁ',
    'চাঁপাইনবাবগঞ্জ',
    'পাবনা',
    'বগুড়া',
    'জয়পুরহাট',
    'সিরাজগঞ্জ',
  ],
  খুলনা: [
    'খুলনা',
    'বাগেরহাট',
    'সাতক্ষীরা',
    'যশোর',
    'ঝিনাইদহ',
    'মাগুরা',
    'নড়াইল',
    'কুষ্টিয়া',
    'চুয়াডাঙ্গা',
    'মেহেরপুর',
  ],
  বরিশাল: ['বরিশাল', 'ভোলা', 'পটুয়াখালী', 'পিরোজপুর', 'বরগুনা', 'ঝালকাঠি'],
  সিলেট: ['সিলেট', 'মৌলভীবাজার', 'হবিগঞ্জ', 'সুনামগঞ্জ'],
  রংপুর: [
    'রংপুর',
    'দিনাজপুর',
    'গাইবান্ধা',
    'কুড়িগ্রাম',
    'লালমনিরহাট',
    'নীলফামারী',
    'পঞ্চগড়',
    'ঠাকুরগাঁও',
  ],
  ময়মনসিংহ: ['ময়মনসিংহ', 'জামালপুর', 'নেত্রকোণা', 'শেরপুর'],
};
const divisions = Object.keys(locations);

const labelOptions = [
  { value: 'বাড়ি', icon: FiHome },
  { value: 'অফিস', icon: FiBriefcase },
  { value: 'অন্যান্য', icon: FiMapPin },
];

const emptyForm = {
  name: '',
  phone: '',
  division: '',
  district: '',
  area: '',
  detail: '',
  label: 'বাড়ি',
  isDefault: false,
};

const persist = (userId, list) => {
  try {
    saveAddresses(userId, list);
    return true;
  } catch {
    return false;
  }
};

const normalizeDigits = value =>
  value.replace(/[০-৯]/g, digit => '০১২৩৪৫৬৭৮৯'.indexOf(digit));

const isValidPhone = value =>
  /^01[3-9]\d{8}$/.test(normalizeDigits(value).replace(/[\s-]/g, ''));

// পুরনো ঠিকানায় শুধু `address` টেক্সট থাকে, নতুনে আলাদা আলাদা ফিল্ড
const fullAddress = address =>
  address.detail || address.area || address.district || address.division
    ? [address.detail, address.area, address.district, address.division]
        .filter(Boolean)
        .join(', ')
    : (address.address ?? '');

function Addresses() {
  const { currentUser } = useAuth();
  const [addresses, setAddresses] = useState(
    () => getAddresses(currentUser.id) ?? [],
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const save = next => {
    if (!persist(currentUser.id, next)) {
      toast.error('ঠিকানা সংরক্ষণ করা যায়নি।');
      return false;
    }
    setAddresses(next);
    return true;
  };

  const update = (name, value) => {
    setForm(current => {
      const next = { ...current, [name]: value };
      if (name === 'division') next.district = '';
      return next;
    });
    if (errors[name]) setErrors(current => ({ ...current, [name]: undefined }));
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      name: currentUser.name ?? '',
      isDefault: addresses.length === 0,
    });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = address => {
    setEditingId(address.id);
    setForm({
      ...emptyForm,
      ...address,
      label: address.label || 'বাড়ি',
      detail: address.detail ?? address.address ?? '',
    });
    setErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setErrors({});
  };

  const handleSubmit = event => {
    event.preventDefault();
    const nextErrors = {};
    if (form.name.trim().length < 3) nextErrors.name = 'পূর্ণ নাম লিখুন।';
    if (!isValidPhone(form.phone))
      nextErrors.phone = 'সঠিক নম্বর দিন (যেমন: 01712345678)।';
    if (!form.division) nextErrors.division = 'বিভাগ নির্বাচন করুন।';
    if (!form.district) nextErrors.district = 'জেলা নির্বাচন করুন।';
    if (!form.area.trim()) nextErrors.area = 'উপজেলা/থানা বা এলাকা লিখুন।';
    if (form.detail.trim().length < 5)
      nextErrors.detail = 'বাসা, রোড ও ল্যান্ডমার্কসহ ঠিকানা লিখুন।';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const cleaned = {
      ...form,
      name: form.name.trim(),
      phone: normalizeDigits(form.phone).replace(/[\s-]/g, ''),
      area: form.area.trim(),
      detail: form.detail.trim(),
    };
    cleaned.address = fullAddress(cleaned); // আগের ডেটার সাথে সামঞ্জস্যের জন্য

    let next = editingId
      ? addresses.map(item =>
          item.id === editingId ? { ...item, ...cleaned } : item,
        )
      : [{ ...cleaned, id: `address-${Date.now()}` }, ...addresses];
    const targetId = editingId ?? next[0].id;
    if (cleaned.isDefault || next.length === 1) {
      next = next.map(item => ({ ...item, isDefault: item.id === targetId }));
    } else if (!next.some(item => item.isDefault)) {
      next[0] = { ...next[0], isDefault: true };
    }

    if (!save(next)) return;
    toast.success(
      editingId ? 'ঠিকানা আপডেট হয়েছে।' : 'নতুন ঠিকানা যোগ হয়েছে।',
    );
    closeModal();
  };

  const makeDefault = id => {
    const next = addresses
      .map(item => ({ ...item, isDefault: item.id === id }))
      .sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
    if (save(next)) toast.success('ডিফল্ট ঠিকানা পরিবর্তন হয়েছে।');
  };

  const confirmDelete = () => {
    let next = addresses.filter(item => item.id !== deleteTarget.id);
    if (next.length && !next.some(item => item.isDefault)) {
      next = next.map((item, index) => ({ ...item, isDefault: index === 0 }));
    }
    if (save(next)) toast.success('ঠিকানা মুছে ফেলা হয়েছে।');
    setDeleteTarget(null);
  };

  const editingIsDefault = Boolean(
    editingId && addresses.find(a => a.id === editingId)?.isDefault,
  );

  return (
    <>
      {/* হেডার */}
      <div className="mb-4 flex items-center justify-between gap-3 sm:mb-6">
        <div className="min-w-0">
          <h1 className="font-heading text-lg font-bold text-dark sm:text-3xl">
            আমার ঠিকানা
          </h1>
          <p className="mt-0.5 truncate text-xs text-dark-muted sm:mt-1 sm:text-base">
            ডেলিভারির ঠিকানা যোগ ও পরিচালনা করুন।
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-dark shadow-sm transition hover:bg-primary-hover sm:px-5 sm:py-3 sm:text-base"
        >
          <FiPlus className="text-sm sm:text-lg" /> নতুন ঠিকানা
        </button>
      </div>

      {/* ঠিকানার তালিকা */}
      {addresses.length ? (
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
          {addresses.map(address => {
            const Icon =
              address.label === 'অফিস'
                ? FiBriefcase
                : address.label === 'বাড়ি'
                  ? FiHome
                  : FiMapPin;
            return (
              <article
                key={address.id}
                className={`flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm sm:rounded-2xl ${
                  address.isDefault ? 'border-primary' : 'border-dark/10'
                }`}
              >
                <div className="flex-1 p-3.5 sm:p-5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream text-base text-dark sm:h-10 sm:w-10 sm:text-lg">
                      <Icon />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-sm font-bold text-dark sm:text-base">
                        {address.name}
                      </h2>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-dark-muted sm:text-sm">
                        <FiPhone
                          className="shrink-0 text-[11px] sm:text-xs"
                          aria-hidden="true"
                        />
                        {address.phone}
                      </p>
                    </div>
                    {address.label && (
                      <span className="shrink-0 rounded-full bg-dark/5 px-2.5 py-0.5 text-[11px] font-semibold text-dark-muted sm:text-xs">
                        {address.label}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 line-clamp-2 text-xs leading-5 text-dark-muted sm:line-clamp-3 sm:text-sm sm:leading-6">
                    {fullAddress(address)}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-dark/10 bg-cream/50 px-3.5 py-2 sm:px-5 sm:py-2.5">
                  {address.isDefault ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-dark sm:text-sm">
                      <FiCheck
                        className="rounded-full bg-primary p-0.5 text-base"
                        aria-hidden="true"
                      />
                      ডিফল্ট ঠিকানা
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => makeDefault(address.id)}
                      className="text-xs font-semibold text-dark-muted underline-offset-2 transition hover:text-dark hover:underline sm:text-sm"
                    >
                      ডিফল্ট করুন
                    </button>
                  )}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEdit(address)}
                      aria-label="ঠিকানা এডিট করুন"
                      title="এডিট"
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-dark/15 bg-white text-sm text-dark transition hover:bg-cream"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(address)}
                      aria-label="ঠিকানা ডিলিট করুন"
                      title="ডিলিট"
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-red-200 bg-white text-sm text-red-600 transition hover:bg-red-50"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}

          {/* নতুন ঠিকানা কার্ড (ডেস্কটপ) */}
          <button
            type="button"
            onClick={openAdd}
            className="hidden min-h-[9rem] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-dark/20 bg-white/60 text-sm font-semibold text-dark-muted transition hover:border-primary hover:bg-white hover:text-dark md:flex"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cream text-lg">
              <FiPlus />
            </span>
            নতুন ঠিকানা যোগ করুন
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-dark/20 bg-white px-4 py-10 text-center sm:rounded-2xl sm:py-16">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-cream text-lg text-dark-muted sm:h-14 sm:w-14 sm:text-2xl">
            <FiMapPin aria-hidden="true" />
          </span>
          <p className="mt-3 text-sm font-semibold text-dark sm:text-base">
            কোনো ঠিকানা সংরক্ষিত নেই
          </p>
          <p className="mt-0.5 text-xs text-dark-muted sm:text-sm">
            দ্রুত অর্ডারের জন্য একটি ডেলিভারি ঠিকানা যোগ করুন।
          </p>
          <button
            type="button"
            onClick={openAdd}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-dark transition hover:bg-primary-hover sm:px-5 sm:py-3 sm:text-base"
          >
            <FiPlus /> নতুন ঠিকানা যোগ করুন
          </button>
        </div>
      )}

      {/* ঠিকানা মডাল */}
      {modalOpen && (
        <AddressModal
          title={editingId ? 'ঠিকানা এডিট করুন' : 'নতুন ঠিকানা যোগ করুন'}
          form={form}
          errors={errors}
          update={update}
          onSubmit={handleSubmit}
          onClose={closeModal}
          submitLabel={editingId ? 'আপডেট করুন' : 'ঠিকানা সংরক্ষণ করুন'}
          defaultLocked={addresses.length === 0 || editingIsDefault}
        />
      )}

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="ঠিকানা মুছে ফেলবেন?"
        message="এই কাজটি পরে ফিরিয়ে আনা যাবে না।"
        confirmLabel="ডিলিট"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

/* ───────── মডাল: মোবাইলে নিচ থেকে ওঠা শিট, ডেস্কটপে মাঝখানে ───────── */
function AddressModal({
  title,
  form,
  errors,
  update,
  onSubmit,
  onClose,
  submitLabel,
  defaultLocked,
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = event => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const labels = labelOptions.some(item => item.value === form.label)
    ? labelOptions
    : [...labelOptions, { value: form.label, icon: FiMapPin }];

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="বন্ধ করুন"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-dark/60"
        tabIndex={-1}
      />

      <form
        onSubmit={onSubmit}
        noValidate
        className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-h-[90dvh] sm:max-w-xl sm:rounded-2xl"
      >
        {/* হেডার */}
        <div className="flex items-center justify-between border-b border-dark/10 px-4 py-3 sm:px-6 sm:py-4">
          <h2 className="font-heading text-base font-bold text-dark sm:text-xl">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-dark-muted transition hover:bg-cream hover:text-dark"
          >
            <FiX />
          </button>
        </div>

        {/* বডি (স্ক্রল হয়) */}
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:space-y-5 sm:px-6 sm:py-5">
          <Section title="যোগাযোগের তথ্য">
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              <Field
                label="পূর্ণ নাম"
                value={form.name}
                error={errors.name}
                onChange={v => update('name', v)}
                placeholder="প্রাপকের নাম"
                autoComplete="name"
              />
              <Field
                label="মোবাইল নম্বর"
                value={form.phone}
                error={errors.phone}
                onChange={v => update('phone', v)}
                placeholder="01XXXXXXXXX"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
              />
            </div>
          </Section>

          <Section title="ডেলিভারি ঠিকানা">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <Select
                label="বিভাগ"
                value={form.division}
                error={errors.division}
                onChange={v => update('division', v)}
                placeholder="বিভাগ"
                options={divisions}
              />
              <Select
                label="জেলা"
                value={form.district}
                error={errors.district}
                onChange={v => update('district', v)}
                placeholder={form.division ? 'জেলা' : 'আগে বিভাগ'}
                options={locations[form.division] ?? []}
                disabled={!form.division}
              />
              <div className="col-span-2">
                <Field
                  label="উপজেলা / থানা / এলাকা"
                  value={form.area}
                  error={errors.area}
                  onChange={v => update('area', v)}
                  placeholder="যেমন: মিরপুর, ধানমন্ডি"
                />
              </div>
              <div className="col-span-2">
                <Field
                  label="বিস্তারিত ঠিকানা"
                  value={form.detail}
                  error={errors.detail}
                  onChange={v => update('detail', v)}
                  placeholder="বাসা/ফ্ল্যাট নম্বর, রোড, ল্যান্ডমার্ক"
                  textarea
                  rows={2}
                />
              </div>
            </div>
          </Section>

          <Section title="ঠিকানার ধরন">
            <div className="grid grid-cols-3 gap-2">
              {labels.map(({ value, icon: Icon }) => {
                const active = form.label === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => update('label', value)}
                    aria-pressed={active}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold transition sm:py-2.5 sm:text-sm ${
                      active
                        ? 'border-dark bg-dark text-white'
                        : 'border-dark/15 bg-white text-dark hover:bg-cream'
                    }`}
                  >
                    <Icon /> {value}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* ডিফল্ট সুইচ */}
          <label
            className={`flex items-center justify-between gap-3 rounded-lg border border-dark/10 bg-cream/50 px-3 py-2.5 ${defaultLocked ? 'opacity-60' : 'cursor-pointer'}`}
          >
            <span className="text-xs font-semibold text-dark sm:text-sm">
              ডিফল্ট ঠিকানা হিসেবে সেট করুন
            </span>
            <input
              type="checkbox"
              role="switch"
              checked={form.isDefault}
              disabled={defaultLocked}
              onChange={event => update('isDefault', event.target.checked)}
              className="peer sr-only"
            />
            <span
              className="relative h-5 w-9 shrink-0 rounded-full bg-dark/20 transition peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/50 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-4"
              aria-hidden="true"
            />
          </label>
        </div>

        {/* ফুটার */}
        <div className="flex gap-2 border-t border-dark/10 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:justify-end sm:gap-3 sm:px-6 sm:py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-dark/15 px-4 py-2.5 text-sm font-semibold text-dark transition hover:bg-cream sm:flex-none sm:px-6 sm:py-3 sm:text-base"
          >
            বাতিল
          </button>
          <button
            type="submit"
            className="flex-[2] rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-dark transition hover:bg-primary-hover sm:flex-none sm:px-8 sm:py-3 sm:text-base"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <fieldset>
      <legend className="mb-2 text-[11px] font-semibold text-dark-muted sm:text-xs">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

// ইনপুটের ফন্ট ১৬px রাখা হয়েছে, নইলে iPhone-এ ফোকাস করলে পেজ অটো-জুম হয়
const inputClass = error =>
  `w-full rounded-lg border bg-white px-3 py-2 text-base text-dark outline-none transition placeholder:text-dark-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:bg-cream disabled:text-dark-muted sm:px-3.5 sm:py-2.5 ${
    error ? 'border-red-500' : 'border-dark/15'
  }`;

function Field({
  label,
  value,
  error,
  onChange,
  placeholder,
  textarea = false,
  rows,
  type = 'text',
  ...rest
}) {
  const Element = textarea ? 'textarea' : 'input';
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-dark sm:text-sm">
        {label}
      </span>
      <Element
        type={textarea ? undefined : type}
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        rows={textarea ? rows : undefined}
        className={`${inputClass(error)} ${textarea ? 'resize-none leading-6' : ''}`}
        {...rest}
      />
      {error && (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      )}
    </label>
  );
}

function Select({
  label,
  value,
  error,
  onChange,
  placeholder,
  options,
  disabled = false,
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-dark sm:text-sm">
        {label}
      </span>
      <select
        value={value}
        disabled={disabled}
        onChange={event => onChange(event.target.value)}
        className={inputClass(error)}
      >
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error && (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      )}
    </label>
  );
}

export default Addresses;
