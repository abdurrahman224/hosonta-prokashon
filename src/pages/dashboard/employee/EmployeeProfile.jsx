import { useEffect, useMemo, useState } from 'react';
import {
  FiActivity,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiGlobe,
  FiLock,
  FiLogIn,
  FiLogOut,
  FiUser,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import PageHeader from '../../../components/dashboard/PageHeader';
import { useAuth } from '../../../context/useAuth';
import { getEmployeeExpenses } from '../../../utils/costStorage';
import {
  calculateShiftDuration,
  calculateTenure,
  checkInEmployee,
  checkOutEmployee,
  formatDateTimeReadable,
  formatTime12h,
  getEmployeeActivities,
  getEmployeeAttendance,
  getEmployeeProfile,
  getTodayAttendanceForEmployee,
  recordEmployeeWebsiteVisit,
  upsertEmployeeProfile,
} from '../../../utils/employeeStorage';

const formatCurrency = (value) =>
  `৳${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

function EmployeeProfile() {
  const { currentUser, updateProfile, changePassword } = useAuth();
  const [refreshTick, setRefreshTick] = useState(0);
  const [nowTick, setNowTick] = useState(() => new Date());
  const [shiftNote, setShiftNote] = useState('');
  const [activeTab, setActiveTab] = useState('attendance');

  const initialHrProfile = useMemo(
    () => getEmployeeProfile(currentUser?.id),
    [currentUser?.id],
  );

  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || '',
    phone: initialHrProfile.phone || currentUser?.phone || '',
    avatar: currentUser?.avatar || '',
    address: initialHrProfile.address || '',
    emergencyContact: initialHrProfile.emergencyContact || '',
  });
  const [passwords, setPasswords] = useState({ current: '', next: '' });

  // Update live clock every 30 seconds and log website visit
  useEffect(() => {
    if (currentUser?.id && currentUser?.role === 'employee') {
      recordEmployeeWebsiteVisit(currentUser.id, 'Employee Profile');
    }
    const timer = window.setInterval(() => setNowTick(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, [currentUser?.id, currentUser?.role]);

  const {
    hrProfile,
    todayRecord,
    attendanceLogs,
    activities,
    salaryRecords,
    totalPaid,
  } = useMemo(() => {
    void refreshTick;
    const empId = currentUser?.id;
    const prof = getEmployeeProfile(empId);
    const today = getTodayAttendanceForEmployee(empId);
    const att = getEmployeeAttendance(empId);
    const acts = getEmployeeActivities(empId);
    const expenses = getEmployeeExpenses().filter(
      (e) =>
        e.employeeId === empId ||
        (e.employeeName && currentUser?.name && e.employeeName.includes(currentUser.name)),
    );
    const paidSum = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return {
      hrProfile: prof,
      todayRecord: today,
      attendanceLogs: att,
      activities: acts,
      salaryRecords: expenses,
      totalPaid: paidSum,
    };
  }, [currentUser?.id, currentUser?.name, refreshTick]);

  const isCheckedIn = Boolean(todayRecord?.inAt);
  const isCheckedOut = Boolean(todayRecord?.outAt);

  const handleCheckIn = () => {
    if (!currentUser?.id) return;
    checkInEmployee(currentUser.id, shiftNote);
    setShiftNote('');
    setRefreshTick((t) => t + 1);
    toast.success(`Checked in at ${formatTime12h(new Date())}`);
  };

  const handleCheckOut = () => {
    if (!currentUser?.id) return;
    checkOutEmployee(currentUser.id, shiftNote);
    setShiftNote('');
    setRefreshTick((t) => t + 1);
    toast.success(`Checked out at ${formatTime12h(new Date())}`);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const res = updateProfile({
      name: profileForm.name,
      phone: profileForm.phone,
      avatar: profileForm.avatar,
    });
    if (!res.success) {
      toast.error(res.message);
      return;
    }
    upsertEmployeeProfile(currentUser.id, {
      phone: profileForm.phone,
      address: profileForm.address,
      emergencyContact: profileForm.emergencyContact,
    });
    setRefreshTick((t) => t + 1);
    toast.success('Profile updated successfully.');
  };

  const handleSavePassword = (e) => {
    e.preventDefault();
    if (passwords.next.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }
    const res = changePassword(passwords.current, passwords.next);
    if (res.success) {
      toast.success('Password updated successfully.');
      setPasswords({ current: '', next: '' });
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Employee Profile & Attendance"
        description="Check in/out for your daily shift, track working hours, and manage your profile details."
      />

      {/* Live Attendance In-Time / Out-Time Hero Card */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <img
              src={currentUser?.avatar}
              alt={currentUser?.name}
              className="h-16 w-16 rounded-2xl object-cover ring-2 ring-primary/40 sm:h-20 sm:w-20"
            />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-heading text-xl font-bold text-slate-900 sm:text-2xl">
                  {currentUser?.name}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    isCheckedIn && !isCheckedOut
                      ? 'bg-emerald-50 text-emerald-700'
                      : isCheckedOut
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isCheckedIn && !isCheckedOut
                        ? 'bg-emerald-500 animate-pulse'
                        : isCheckedOut
                          ? 'bg-slate-500'
                          : 'bg-amber-500'
                    }`}
                  />
                  {isCheckedIn && !isCheckedOut
                    ? 'On Duty'
                    : isCheckedOut
                      ? 'Shift Completed'
                      : 'Not Checked In'}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-700">
                {hrProfile.designation} •{' '}
                <span className="text-slate-500">{hrProfile.department}</span>
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span>
                  Shift:{' '}
                  <strong className="text-slate-700">
                    {hrProfile.shiftStart} – {hrProfile.shiftEnd}
                  </strong>
                </span>
                <span>
                  Joined:{' '}
                  <strong className="text-slate-700">
                    {formatDate(hrProfile.joinedDate)}
                  </strong>{' '}
                  ({calculateTenure(hrProfile.joinedDate)})
                </span>
              </div>
            </div>
          </div>

          {/* Clock + In/Out Action Controls */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Live Time • {nowTick.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
                <p className="font-heading text-2xl font-bold text-slate-900">
                  {formatTime12h(nowTick)}
                </p>
              </div>
              <div className="text-right text-xs">
                <p className="text-slate-500">
                  In Time:{' '}
                  <strong className="text-emerald-700">
                    {formatTime12h(todayRecord?.inAt)}
                  </strong>
                </p>
                <p className="text-slate-500">
                  Out Time:{' '}
                  <strong className="text-slate-800">
                    {formatTime12h(todayRecord?.outAt)}
                  </strong>
                </p>
              </div>
            </div>

            {!isCheckedOut && (
              <input
                type="text"
                value={shiftNote}
                onChange={(e) => setShiftNote(e.target.value)}
                placeholder={
                  isCheckedIn
                    ? 'Add handover / work summary before checking out...'
                    : 'Optional shift note before checking in...'
                }
                className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-primary"
              />
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {!isCheckedIn && (
                <button
                  type="button"
                  onClick={handleCheckIn}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700"
                >
                  <FiLogIn className="text-sm" />
                  <span>Check In (In Time)</span>
                </button>
              )}

              {isCheckedIn && !isCheckedOut && (
                <button
                  type="button"
                  onClick={handleCheckOut}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-rose-700"
                >
                  <FiLogOut className="text-sm" />
                  <span>Check Out (Out Time)</span>
                </button>
              )}

              {isCheckedOut && (
                <div className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700">
                  <FiCheckCircle className="text-sm" />
                  <span>
                    Completed ({calculateShiftDuration(todayRecord.inAt, todayRecord.outAt)})
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Joined Date</p>
          <p className="mt-1 font-heading text-lg font-bold text-slate-900">
            {formatDate(hrProfile.joinedDate)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Tenure: <strong>{calculateTenure(hrProfile.joinedDate)}</strong>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Today&apos;s Working Time</p>
          <p className="mt-1 font-heading text-lg font-bold text-slate-900">
            {todayRecord?.inAt
              ? calculateShiftDuration(todayRecord.inAt, todayRecord.outAt)
              : 'Not Started'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Arrival: {formatTime12h(todayRecord?.websiteVisitAt)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Attendance Logged</p>
          <p className="mt-1 font-heading text-lg font-bold text-slate-900">
            {attendanceLogs.length} days
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Activities: <strong>{activities.length}</strong> entries
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Total Salary Received</p>
          <p className="mt-1 font-heading text-lg font-bold text-emerald-700">
            {formatCurrency(totalPaid)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Base: {formatCurrency(hrProfile.monthlySalary)}/mo
          </p>
        </div>
      </div>

      {/* Tabs */}
      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="flex flex-wrap gap-1 border-b border-slate-100 p-2 sm:px-4">
          {[
            { id: 'attendance', label: 'My In / Out Log', icon: FiClock },
            { id: 'activity', label: 'Activity & Salary', icon: FiCreditCard },
            { id: 'profile', label: 'Profile & Password', icon: FiUser },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-primary text-dark shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="text-sm" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === 'attendance' && (
          <div className="p-4 sm:p-5">
            {attendanceLogs.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500">
                No attendance records yet. Click &quot;Check In (In Time)&quot; above to start today&apos;s shift.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-xs sm:text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Website Arrival</th>
                      <th className="px-4 py-3">In Time</th>
                      <th className="px-4 py-3">Out Time</th>
                      <th className="px-4 py-3">Hours</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendanceLogs.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/60">
                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">
                          {formatDate(row.date)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                          {formatTime12h(row.websiteVisitAt)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-emerald-700">
                          {formatTime12h(row.inAt)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-800">
                          {row.outAt ? formatTime12h(row.outAt) : '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                          {calculateShiftDuration(row.inAt, row.outAt)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                              row.status === 'On Duty'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="max-w-xs truncate px-4 py-3 text-xs text-slate-500">
                          {row.note || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="grid gap-6 p-4 sm:p-5 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 flex items-center gap-2 font-heading text-sm font-bold text-slate-900">
                <FiActivity className="text-primary-hover" /> Recent Activity Timeline
              </h3>
              <div className="space-y-2.5">
                {activities.length === 0 ? (
                  <p className="text-xs text-slate-500">No activities logged yet.</p>
                ) : (
                  activities.slice(0, 10).map((act) => (
                    <div
                      key={act.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/50 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-slate-900">{act.title}</p>
                        <span className="text-[11px] text-slate-400">
                          {formatDateTimeReadable(act.timestamp)}
                        </span>
                      </div>
                      {act.description && (
                        <p className="mt-1 text-xs text-slate-600">{act.description}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h3 className="mb-3 flex items-center gap-2 font-heading text-sm font-bold text-slate-900">
                <FiDollarSign className="text-emerald-600" /> Salary & Payout History
              </h3>
              <div className="space-y-2.5">
                {salaryRecords.length === 0 ? (
                  <p className="text-xs text-slate-500">No salary payments recorded yet.</p>
                ) : (
                  salaryRecords.map((rec) => (
                    <div
                      key={rec.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {rec.expenseType} • {formatDate(rec.date)}
                        </p>
                        <p className="text-[11px] text-slate-500">{rec.note || '—'}</p>
                      </div>
                      <span className="font-heading text-sm font-bold text-emerald-700">
                        {formatCurrency(rec.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="grid gap-6 p-4 sm:p-5 lg:grid-cols-2">
            <form
              onSubmit={handleSaveProfile}
              className="rounded-xl border border-slate-100 bg-slate-50/40 p-4 sm:p-5"
            >
              <h3 className="flex items-center gap-2 font-heading text-base font-bold text-slate-900">
                <FiUser /> Personal Details
              </h3>
              <div className="mt-4 space-y-3">
                {[
                  ['name', 'Full Name'],
                  ['phone', 'Phone Number'],
                  ['address', 'Address'],
                  ['emergencyContact', 'Emergency Contact'],
                  ['avatar', 'Avatar Image URL'],
                ].map(([key, label]) => (
                  <label key={key} className="block text-xs font-semibold text-slate-700">
                    {label}
                    <input
                      value={profileForm[key]}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, [key]: e.target.value })
                      }
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                    />
                  </label>
                ))}
              </div>
              <button
                type="submit"
                className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-dark transition hover:bg-primary-hover"
              >
                Save Profile
              </button>
            </form>

            <div className="space-y-5">
              <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-4 sm:p-5">
                <h3 className="flex items-center gap-2 font-heading text-base font-bold text-slate-900">
                  <FiGlobe /> Employment Summary
                </h3>
                <div className="mt-3 space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email</span>
                    <span className="font-medium text-slate-900">{currentUser?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Designation</span>
                    <span className="font-semibold text-slate-900">{hrProfile.designation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Department</span>
                    <span className="font-medium text-slate-900">{hrProfile.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Joined Date</span>
                    <span className="font-medium text-slate-900">
                      {formatDate(hrProfile.joinedDate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Monthly Base Salary</span>
                    <span className="font-bold text-emerald-700">
                      {formatCurrency(hrProfile.monthlySalary)}
                    </span>
                  </div>
                </div>
              </div>

              <form
                onSubmit={handleSavePassword}
                className="rounded-xl border border-slate-100 bg-slate-50/40 p-4 sm:p-5"
              >
                <h3 className="flex items-center gap-2 font-heading text-base font-bold text-slate-900">
                  <FiLock /> Change Password
                </h3>
                <div className="mt-3 space-y-3">
                  <label className="block text-xs font-semibold text-slate-700">
                    Current Password
                    <input
                      type="password"
                      value={passwords.current}
                      onChange={(e) =>
                        setPasswords({ ...passwords, current: e.target.value })
                      }
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    New Password
                    <input
                      type="password"
                      value={passwords.next}
                      onChange={(e) =>
                        setPasswords({ ...passwords, next: e.target.value })
                      }
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  className="mt-4 rounded-xl bg-dark px-5 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800"
                >
                  Update Password
                </button>
              </form>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default EmployeeProfile;
