import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  FiCamera,
  FiEye,
  FiEyeOff,
  FiFacebook,
  FiGlobe,
  FiInstagram,
  FiLock,
  FiSave,
  FiTrash2,
  FiUser,
} from 'react-icons/fi';
import PageHeader from '../../../components/dashboard/PageHeader';
import { useAuth } from '../../../context/useAuth';

const BIO_LIMIT = 300;

function getStrength(password) {
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

const STRENGTH_LABELS = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = [
  'bg-dark/10',
  'bg-red-500',
  'bg-amber-500',
  'bg-lime-500',
  'bg-emerald-600',
];

function MyProfile() {
  const { currentUser, updateProfile, changePassword } = useAuth();
  const [profile, setProfile] = useState({
    name: currentUser.name,
    bio: currentUser.bio ?? '',
    facebook: currentUser.facebook ?? '',
    instagram: currentUser.instagram ?? '',
    website: currentUser.website ?? '',
    avatar: currentUser.avatar,
  });
  const [passwords, setPasswords] = useState({
    current: '',
    next: '',
    confirm: '',
  });
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const strength = getStrength(passwords.next);

  const handleAvatar = event => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () =>
      setProfile(current => ({ ...current, avatar: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const removeAvatar = () =>
    setProfile(current => ({ ...current, avatar: '' }));

  const saveProfile = event => {
    event.preventDefault();
    if (!profile.name.trim()) {
      setProfileError('Name is required.');
      return;
    }
    updateProfile(profile);
    setProfileError('');
    toast.success('Profile updated.');
  };

  const savePassword = event => {
    event.preventDefault();
    if (!passwords.current) {
      setPasswordError('Enter your current password.');
      return;
    }
    if (passwords.next.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (passwords.next !== passwords.confirm) {
      setPasswordError('New passwords do not match.');
      return;
    }
    const result = changePassword(passwords.current, passwords.next);
    if (!result.success) {
      setPasswordError(result.message);
      return;
    }
    setPasswords({ current: '', next: '', confirm: '' });
    setPasswordError('');
    toast.success('Password changed.');
  };

  return (
    <>
      <PageHeader
        title="My profile"
        description="Manage your personal details and social links."
      />

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
        {/* Profile form */}
        <form
          onSubmit={saveProfile}
          className="overflow-hidden rounded-2xl border border-dark/10 bg-white shadow-sm"
        >
          <div className="h-28 bg-gradient-to-r from-dark via-dark to-dark-gray" />

          <div className="px-6 pb-8 sm:px-8">
            <div className="-mt-14 flex flex-wrap items-end gap-5">
              <div className="relative">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={`${profile.name || 'User'} profile photo`}
                    className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-md"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-cream text-dark/40 shadow-md">
                    <FiUser size={40} />
                  </div>
                )}
                <label
                  className="absolute bottom-1 right-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-primary text-dark shadow ring-2 ring-white transition hover:bg-primary-hover focus-within:ring-dark"
                  title="Change photo"
                >
                  <FiCamera size={16} />
                  <span className="sr-only">Change photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatar}
                    className="sr-only"
                  />
                </label>
              </div>

              <div className="min-w-0 flex-1 pb-1">
                <p className="truncate font-heading text-2xl font-bold text-dark">
                  {profile.name || 'Your name'}
                </p>
                
              </div>

              {profile.avatar && (
                <button
                  type="button"
                  onClick={removeAvatar}
                  className="inline-flex items-center gap-2 rounded-lg border border-dark/10 px-3.5 py-2 text-sm font-medium text-dark/70 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                >
                  <FiTrash2 size={15} /> Remove photo
                </button>
              )}
            </div>

            {profileError && <ErrorMessage>{profileError}</ErrorMessage>}

            <div className="mt-8 space-y-6">
              <Field
                label="Full name"
                icon={FiUser}
                value={profile.name}
                onChange={value => setProfile({ ...profile, name: value })}
                placeholder="Your full name"
                autoComplete="name"
              />

              <Field
                label="Bio"
                value={profile.bio}
                onChange={value =>
                  setProfile({ ...profile, bio: value.slice(0, BIO_LIMIT) })
                }
                placeholder="Tell readers a little about yourself"
                hint={`${profile.bio.length}/${BIO_LIMIT}`}
                textarea
              />

              <div className="border-t border-dark/10 pt-6">
                <h3 className="font-heading text-lg font-bold text-dark">
                  Social links
                </h3>
                <p className="mt-1 text-sm text-dark/60">
                  Add the links you want visitors to see on your profile.
                </p>
                <div className="mt-5 space-y-5">
                  <Field
                    label="Facebook"
                    icon={FiFacebook}
                    value={profile.facebook}
                    onChange={value =>
                      setProfile({ ...profile, facebook: value })
                    }
                    placeholder="https://facebook.com/yourpage"
                    type="url"
                  />
                  <Field
                    label="Instagram"
                    icon={FiInstagram}
                    value={profile.instagram}
                    onChange={value =>
                      setProfile({ ...profile, instagram: value })
                    }
                    placeholder="https://instagram.com/yourhandle"
                    type="url"
                  />
                  <Field
                    label="Website"
                    icon={FiGlobe}
                    value={profile.website}
                    onChange={value =>
                      setProfile({ ...profile, website: value })
                    }
                    placeholder="https://yourwebsite.com"
                    type="url"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end border-t border-dark/10 pt-6">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-dark shadow-sm transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-dark focus-visible:ring-offset-2"
              >
                <FiSave /> Save changes
              </button>
            </div>
          </div>
        </form>

        {/* Password form */}
        <form
          onSubmit={savePassword}
          className="rounded-2xl border border-dark/10 bg-white p-6 shadow-sm sm:p-8 xl:sticky xl:top-6"
        >
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-dark text-primary">
              <FiLock size={20} />
            </span>
            <div>
              <h2 className="font-heading text-xl font-bold text-dark">
                Change password
              </h2>
              <p className="mt-1 text-sm text-dark/60">
                Use at least 6 characters. A longer password is safer.
              </p>
            </div>
          </div>

          {passwordError && <ErrorMessage>{passwordError}</ErrorMessage>}

          <div className="mt-7 space-y-5">
            <PasswordField
              label="Current password"
              value={passwords.current}
              onChange={value => setPasswords({ ...passwords, current: value })}
              autoComplete="current-password"
            />
            <div>
              <PasswordField
                label="New password"
                value={passwords.next}
                onChange={value => setPasswords({ ...passwords, next: value })}
                autoComplete="new-password"
              />
              {passwords.next && (
                <div className="mt-3" aria-live="polite">
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map(level => (
                      <span
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          strength >= level
                            ? STRENGTH_COLORS[strength]
                            : 'bg-dark/10'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-1.5 text-xs font-medium text-dark/60">
                    Strength: {STRENGTH_LABELS[strength]}
                  </p>
                </div>
              )}
            </div>
            <PasswordField
              label="Confirm new password"
              value={passwords.confirm}
              onChange={value => setPasswords({ ...passwords, confirm: value })}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="mt-7 w-full rounded-lg bg-dark px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-dark-gray focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Update password
          </button>
        </form>
      </div>
    </>
  );
}

function ErrorMessage({ children }) {
  return (
    <p
      role="alert"
      className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
    >
      {children}
    </p>
  );
}

const inputClasses =
  'w-full rounded-lg border border-dark/10 bg-cream/60 py-3 text-dark placeholder:text-dark/35 outline-none transition hover:border-dark/25 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/25';

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  textarea,
  icon: Icon,
  hint,
  autoComplete,
}) {
  const Component = textarea ? 'textarea' : 'input';
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between text-sm font-semibold text-dark">
        {label}
        {hint && <span className="font-normal text-dark/50">{hint}</span>}
      </span>
      <span className="relative block">
        {Icon && (
          <Icon
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-dark/40"
            size={17}
          />
        )}
        <Component
          type={textarea ? undefined : type}
          value={value}
          onChange={event => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          rows={textarea ? 5 : undefined}
          className={`${inputClasses} ${Icon ? 'pl-11 pr-4' : 'px-4'} ${
            textarea ? 'resize-y' : ''
          }`}
        />
      </span>
    </label>
  );
}

function PasswordField({ label, value, onChange, autoComplete }) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-dark">
        {label}
      </span>
      <span className="relative block">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={event => onChange(event.target.value)}
          autoComplete={autoComplete}
          className={`${inputClasses} pl-4 pr-12`}
        />
        <button
          type="button"
          onClick={() => setVisible(current => !current)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-dark/50 transition hover:bg-dark/5 hover:text-dark"
        >
          {visible ? <FiEyeOff size={17} /> : <FiEye size={17} />}
        </button>
      </span>
    </label>
  );
}

export default MyProfile;
