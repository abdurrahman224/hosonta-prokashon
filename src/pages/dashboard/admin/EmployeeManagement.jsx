import { useMemo, useState } from 'react';
import {
  FiActivity,
  FiArrowLeft,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiEdit2,
  FiEye,
  FiGlobe,
  FiMail,
  FiPhone,
  FiSearch,
  FiShield,
  FiUserCheck,
  FiUserPlus,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../../components/dashboard/PageHeader';
import { useAuth } from '../../../context/useAuth';
import { addEmployeeExpense, getEmployeeExpenses } from '../../../utils/costStorage';
import {
  calculateShiftDuration,
  calculateTenure,
  formatDateTimeReadable,
  formatTime12h,
  getAllEmployeeActivities,
  getAllEmployeeAttendance,
  getAllEmployeeProfiles,
  getTodayDateStr,
  logEmployeeActivity,
  saveManualAttendanceRecord,
  toEmployeeRouteParam,
  upsertEmployeeProfile,
} from '../../../utils/employeeStorage';

const formatCurrency = (value) => {
  const num = Number(value || 0);
  return `৳${num.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
};

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

function formatShiftRange(start = '09:00', end = '18:00') {
  const toLabel = (hhmm) => {
    if (!hhmm || !hhmm.includes(':')) return hhmm || '—';
    const [h, m] = hhmm.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hr = h % 12 || 12;
    return `${String(hr).padStart(2, '0')}:${String(m || 0).padStart(2, '0')} ${period}`;
  };
  return `${toLabel(start)} – ${toLabel(end)}`;
}

/* ------------------------------------------------------------------ */
/* Modals                                                              */
/* ------------------------------------------------------------------ */

function AddOrEditEmployeeModal({
  mode, // 'add' | 'edit'
  initialEmployee,
  candidateUsers,
  onClose,
  onSave,
}) {
  const [assignType, setAssignType] = useState('new'); // 'new' | 'promote'
  const [selectedUserId, setSelectedUserId] = useState(
    candidateUsers[0]?.id || '',
  );
  const [form, setForm] = useState({
    name: initialEmployee?.name || '',
    email: initialEmployee?.email || '',
    password: 'employee123',
    phone: initialEmployee?.phone || '',
    designation: initialEmployee?.designation || 'Sales & Counter Executive',
    department: initialEmployee?.department || 'Showroom & Online Orders',
    joinedDate: initialEmployee?.joinedDate || getTodayDateStr(),
    monthlySalary: String(initialEmployee?.monthlySalary ?? 22000),
    shiftStart: initialEmployee?.shiftStart || '09:00',
    shiftEnd: initialEmployee?.shiftEnd || '18:00',
    address: initialEmployee?.address || 'Banglabazar, Dhaka-1100',
    emergencyContact: initialEmployee?.emergencyContact || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      mode,
      assignType,
      selectedUserId,
      form,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 backdrop-blur-xs sm:p-4">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-heading text-lg font-bold text-slate-900">
              {mode === 'edit' ? 'Edit Employee Profile' : 'Add / Assign Employee'}
            </h3>
            <p className="text-xs text-slate-500">
              {mode === 'edit'
                ? 'Update designation, joining date, base salary, and shift hours.'
                : 'Create a new employee account or promote an existing user to Employee.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {mode === 'add' && (
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setAssignType('new')}
                className={`rounded-lg py-2 text-xs font-semibold transition ${
                  assignType === 'new'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Create New Employee
              </button>
              <button
                type="button"
                onClick={() => setAssignType('promote')}
                className={`rounded-lg py-2 text-xs font-semibold transition ${
                  assignType === 'promote'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Assign Existing User
              </button>
            </div>
          )}

          {mode === 'add' && assignType === 'promote' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Select Existing User Account
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                required
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary"
              >
                {candidateUsers.length === 0 ? (
                  <option value="">No non-employee users available</option>
                ) : (
                  candidateUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email}) — {u.role}
                    </option>
                  ))
                )}
              </select>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Tariqul Islam"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  disabled={mode === 'edit'}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="employee@hosontoprokashon.com"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-primary disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
              {mode === 'add' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Temporary Password *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="017XX-XXXXXX"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Designation *
              </label>
              <input
                type="text"
                required
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Department
              </label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Joined Date *
              </label>
              <input
                type="date"
                required
                value={form.joinedDate}
                onChange={(e) => setForm({ ...form, joinedDate: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Monthly Base Salary (৳) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={form.monthlySalary}
                onChange={(e) => setForm({ ...form, monthlySalary: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Shift In Time
              </label>
              <input
                type="time"
                value={form.shiftStart}
                onChange={(e) => setForm({ ...form, shiftStart: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Shift Out Time
              </label>
              <input
                type="time"
                value={form.shiftEnd}
                onChange={(e) => setForm({ ...form, shiftEnd: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Address
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Emergency Contact
              </label>
              <input
                type="text"
                value={form.emergencyContact}
                onChange={(e) =>
                  setForm({ ...form, emergencyContact: e.target.value })
                }
                placeholder="018XX-XXXXXX"
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mode === 'add' && assignType === 'promote' && !selectedUserId}
              className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-dark transition hover:bg-primary-hover disabled:opacity-50"
            >
              {mode === 'edit' ? 'Save Changes' : 'Save Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PaySalaryModal({ employee, onClose, onPaid }) {
  const [expenseType, setExpenseType] = useState('Salary');
  const [amount, setAmount] = useState(String(employee?.monthlySalary || 20000));
  const [date, setDate] = useState(getTodayDateStr());
  const [note, setNote] = useState('Monthly salary disbursement');

  const handleSubmit = (e) => {
    e.preventDefault();
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast.error('Enter a valid payment amount.');
      return;
    }
    addEmployeeExpense({
      employeeId: employee.id,
      employeeName: employee.name,
      expenseType,
      amount: numericAmount,
      date,
      note: note.trim(),
    });
    logEmployeeActivity(employee.id, {
      type: 'salary',
      title: `${expenseType} Payment Recorded`,
      description: `${formatCurrency(numericAmount)} (${expenseType}) issued on ${formatDate(date)}.`,
    });
    toast.success(`${expenseType} payment recorded for ${employee.name}.`);
    onPaid();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 backdrop-blur-xs sm:p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-heading text-lg font-bold text-slate-900">
              Record Salary / Payout
            </h3>
            <p className="text-xs text-slate-500">{employee.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Payment Type
            </label>
            <select
              value={expenseType}
              onChange={(e) => setExpenseType(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="Salary">Monthly Salary</option>
              <option value="Bonus">Performance Bonus</option>
              <option value="Transport">Transport / Conveyance</option>
              <option value="Allowance">Overtime / Allowance</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Amount (৳) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Payment Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Note
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-dark hover:bg-primary-hover"
            >
              Confirm Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ManualAttendanceModal({ employee, onClose, onSaved }) {
  const [date, setDate] = useState(getTodayDateStr());
  const [inTime, setInTime] = useState('09:05');
  const [outTime, setOutTime] = useState('18:05');
  const [note, setNote] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    saveManualAttendanceRecord(employee.id, { date, inTime, outTime, note });
    toast.success(`Attendance saved for ${formatDate(date)}.`);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 backdrop-blur-xs sm:p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-heading text-lg font-bold text-slate-900">
              Log / Adjust Attendance
            </h3>
            <p className="text-xs text-slate-500">{employee.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Date *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                In Time
              </label>
              <input
                type="time"
                value={inTime}
                onChange={(e) => setInTime(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Out Time
              </label>
              <input
                type="time"
                value={outTime}
                onChange={(e) => setOutTime(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Remarks / Note
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional attendance note..."
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-dark hover:bg-primary-hover"
            >
              Save Attendance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dedicated Employee Summary View                                     */
/* ------------------------------------------------------------------ */

function EmployeeSummaryView({
  employee,
  onBack,
  onEdit,
  onOpenPayModal,
  onOpenAttendanceModal,
  onToggleStatus,
}) {
  const [activeTab, setActiveTab] = useState('attendance');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
        >
          <FiArrowLeft />
          <span>Back to Employees</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenAttendanceModal}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <FiClock />
            <span>Log Attendance</span>
          </button>
          <button
            type="button"
            onClick={onOpenPayModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-dark transition hover:bg-primary-hover"
          >
            <FiDollarSign />
            <span>Pay Salary / Bonus</span>
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <FiEdit2 />
            <span>Edit Info</span>
          </button>
          <button
            type="button"
            onClick={onToggleStatus}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              employee.status === 'active'
                ? 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <FiShield />
            <span>{employee.status === 'active' ? 'Suspend' : 'Activate'}</span>
          </button>
        </div>
      </div>

      {/* Employee Profile Summary Banner */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <img
              src={employee.avatar}
              alt={employee.name}
              className="h-16 w-16 rounded-2xl object-cover ring-2 ring-primary/30 sm:h-20 sm:w-20"
            />
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-heading text-xl font-bold text-slate-900 sm:text-2xl">
                  {employee.name}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    employee.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      employee.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                  {employee.status === 'active' ? 'Active' : 'Suspended'}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    employee.todayStatus === 'On Duty'
                      ? 'bg-blue-50 text-blue-700'
                      : employee.todayStatus === 'Checked Out'
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {employee.todayStatus}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span>Joined: <strong className="text-slate-700">{formatDate(employee.joinedDate)}</strong></span>
                <span className="inline-flex items-center gap-1">
                  <FiMail className="text-slate-400" /> {employee.email}
                </span>
                {employee.phone && (
                  <span className="inline-flex items-center gap-1">
                    <FiPhone className="text-slate-400" /> {employee.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs sm:text-right">
            <p className="text-slate-500">Shift: <strong className="text-slate-800">{formatShiftRange(employee.shiftStart, employee.shiftEnd)}</strong></p>
            <p className="mt-1 text-slate-500">
              Base Salary:{' '}
              <strong className="text-slate-900">
                {formatCurrency(employee.monthlySalary)}
              </strong>
            </p>
          </div>
        </div>
      </section>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Joined Date & Tenure</p>
          <p className="mt-1.5 font-heading text-lg font-bold text-slate-900 sm:text-xl">
            {formatDate(employee.joinedDate)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Tenure: <strong className="text-slate-700">{employee.tenure}</strong>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Today&apos;s In / Out</p>
          <p className="mt-1.5 font-heading text-base font-bold text-slate-900 sm:text-lg">
            {employee.todayAttendance?.inAt
              ? `${formatTime12h(employee.todayAttendance.inAt)} → ${
                  employee.todayAttendance.outAt
                    ? formatTime12h(employee.todayAttendance.outAt)
                    : 'Active'
                }`
              : 'Not Checked In'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Duration:{' '}
            <strong className="text-slate-700">
              {employee.todayAttendance?.inAt
                ? calculateShiftDuration(
                    employee.todayAttendance.inAt,
                    employee.todayAttendance.outAt,
                  )
                : '—'}
            </strong>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Attendance Days</p>
          <p className="mt-1.5 font-heading text-lg font-bold text-slate-900 sm:text-xl">
            {employee.attendanceLogs.length} days logged
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Activities:{' '}
            <strong className="text-slate-700">{employee.activities.length}</strong>{' '}
            recorded
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Total Salary Paid</p>
          <p className="mt-1.5 font-heading text-lg font-bold text-emerald-700 sm:text-xl">
            {formatCurrency(employee.totalPaid)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {employee.salaryRecords.length} payment{' '}
            {employee.salaryRecords.length === 1 ? 'record' : 'records'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="flex flex-wrap gap-1 border-b border-slate-100 p-2 sm:px-4">
          {[
            { id: 'attendance', label: 'Daily In / Out Log', icon: FiClock },
            { id: 'activity', label: 'Activity & Website Visits', icon: FiActivity },
            { id: 'salary', label: 'Salary & Payouts', icon: FiCreditCard },
            { id: 'summary', label: 'Profile & Summary', icon: FiUserCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                  active
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

        {/* Tab 1: Daily Attendance */}
        {activeTab === 'attendance' && (
          <div className="p-4 sm:p-5">
            {employee.attendanceLogs.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-500">
                No attendance logs recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-xs sm:text-sm">
                  <thead className="border-b border-slate-200 bg-white text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <tr className="whitespace-nowrap">
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Arrived</th>
                      <th className="px-4 py-3">Check In</th>
                      <th className="px-4 py-3">Check Out</th>
                      <th className="px-4 py-3">Hours</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employee.attendanceLogs.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/70">
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
                                : row.status === 'Checked Out'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-slate-100 text-slate-600'
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

        {/* Tab 2: Activity & Website Log */}
        {activeTab === 'activity' && (
          <div className="p-4 sm:p-5">
            {employee.activities.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-500">
                No activity logs recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {employee.activities.map((act) => (
                  <div
                    key={act.id}
                    className="flex flex-col justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3.5 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 shrink-0 text-base ${
                          act.type === 'attendance'
                            ? 'text-emerald-600'
                            : act.type === 'website'
                              ? 'text-blue-600'
                              : act.type === 'salary'
                                ? 'text-amber-600'
                                : 'text-slate-600'
                        }`}
                      >
                        {act.type === 'attendance' ? (
                          <FiClock />
                        ) : act.type === 'website' ? (
                          <FiGlobe />
                        ) : act.type === 'salary' ? (
                          <FiDollarSign />
                        ) : (
                          <FiActivity />
                        )}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {act.title}
                        </p>
                        {act.description && (
                          <p className="mt-0.5 text-xs text-slate-500">
                            {act.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-slate-500">
                      {formatDateTimeReadable(act.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Salary & Payouts */}
        {activeTab === 'salary' && (
          <div className="p-4 sm:p-5">
            {employee.salaryRecords.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-500">
                No salary payments recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-xs sm:text-sm">
                  <thead className="border-b border-slate-200 bg-white text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <tr className="whitespace-nowrap">
                      <th className="px-4 py-3">Ref ID</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Note</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employee.salaryRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">
                          {rec.id}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                          {formatDate(rec.date)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                            {rec.expenseType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {rec.note || '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-heading font-bold text-slate-900">
                          {formatCurrency(rec.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Profile & Summary */}
        {activeTab === 'summary' && (
          <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-500">
                Employment & Shift Summary
              </h4>
              <div className="mt-3 space-y-2.5 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Employee ID</span>
                  <span className="font-mono text-xs font-semibold text-slate-900">
                    {employee.id}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Joined Date</span>
                  <span className="font-medium text-slate-900">
                    {formatDate(employee.joinedDate)} ({employee.tenure})
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Standard Shift</span>
                  <span className="font-medium text-slate-900">
                    {formatShiftRange(employee.shiftStart, employee.shiftEnd)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Monthly Base Salary</span>
                  <span className="font-bold text-emerald-700">
                    {formatCurrency(employee.monthlySalary)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-500">
                Contact & Presence Summary
              </h4>
              <div className="mt-3 space-y-2.5 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Email</span>
                  <span className="font-medium text-slate-900">{employee.email}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Phone</span>
                  <span className="font-medium text-slate-900">
                    {employee.phone || 'Not provided'}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Emergency Contact</span>
                  <span className="font-medium text-slate-900">
                    {employee.emergencyContact || 'Not provided'}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Address</span>
                  <span className="text-right font-medium text-slate-900">
                    {employee.address || 'Dhaka'}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Last Website Visit</span>
                  <span className="text-right font-medium text-slate-900">
                    {formatDateTimeReadable(employee.lastWebsiteVisit)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Latest Activity</span>
                  <span className="text-right font-medium text-slate-900">
                    {employee.latestActivity?.title || 'No recent activity'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Employee Management Component                                  */
/* ------------------------------------------------------------------ */

function EmployeeManagement() {
  const {
    users = [],
    createEmployeeUser,
    updateUserRole,
    updateUserStatus,
  } = useAuth();
  const { employeeName: routeEmployeeName } = useParams();
  const navigate = useNavigate();

  const [refreshTick, setRefreshTick] = useState(0);
  const refresh = () => setRefreshTick((t) => t + 1);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'on-duty' | 'suspended'
  const [employeeModal, setEmployeeModal] = useState(null); // null | { mode: 'add' | 'edit', employee }
  const [payModalEmployee, setPayModalEmployee] = useState(null);
  const [attendanceModalEmployee, setAttendanceModalEmployee] = useState(null);

  const employeesData = useMemo(() => {
    void refreshTick;
    const profiles = getAllEmployeeProfiles();
    const allAttendance = getAllEmployeeAttendance();
    const allActivities = getAllEmployeeActivities();
    const allExpenses = getEmployeeExpenses();
    const todayStr = getTodayDateStr();

    return users
      .filter((u) => u.role === 'employee')
      .map((user) => {
        const profile = profiles[user.id] || {};
        const attendanceLogs = allAttendance.filter((a) => a.employeeId === user.id);
        const todayAttendance =
          attendanceLogs.find((a) => a.date === todayStr) || null;
        const activities = allActivities.filter((a) => a.employeeId === user.id);
        const salaryRecords = allExpenses.filter(
          (e) =>
            e.employeeId === user.id ||
            (e.employeeName && e.employeeName.includes(user.name)),
        );
        const totalPaid = salaryRecords.reduce(
          (sum, r) => sum + Number(r.amount || 0),
          0,
        );
        const joinedDate = profile.joinedDate || user.joinedDate || '2024-02-10';
        const todayStatus = todayAttendance?.outAt
          ? 'Checked Out'
          : todayAttendance?.inAt
            ? 'On Duty'
            : 'Not Checked In';

        return {
          ...user,
          phone: profile.phone || user.phone || '',
          designation: profile.designation || 'Staff Member',
          department: profile.department || 'Operations',
          joinedDate,
          tenure: calculateTenure(joinedDate),
          monthlySalary: Number(profile.monthlySalary ?? 20000),
          shiftStart: profile.shiftStart || '09:00',
          shiftEnd: profile.shiftEnd || '18:00',
          address: profile.address || user.address || 'Dhaka, Bangladesh',
          emergencyContact: profile.emergencyContact || '',
          lastWebsiteVisit:
            profile.lastWebsiteVisit ||
            todayAttendance?.websiteVisitAt ||
            activities[0]?.timestamp ||
            null,
          attendanceLogs,
          todayAttendance,
          todayStatus,
          activities,
          latestActivity: activities[0] || null,
          salaryRecords,
          totalPaid,
        };
      });
  }, [users, refreshTick]);

  const nonEmployeeUsers = useMemo(
    () => users.filter((u) => u.role !== 'employee' && u.role !== 'admin'),
    [users],
  );

  const selectedEmployee = useMemo(() => {
    if (!routeEmployeeName) return null;
    let decoded = routeEmployeeName;
    try {
      decoded = decodeURIComponent(routeEmployeeName);
    } catch {
      decoded = routeEmployeeName;
    }
    const normalized = decoded.trim().toLowerCase();
    return (
      employeesData.find((emp) => {
        const nameLower = emp.name.trim().toLowerCase();
        const hyphenated = emp.name.trim().replace(/\s+/g, '-').toLowerCase();
        return (
          hyphenated === normalized ||
          nameLower === normalized ||
          toEmployeeRouteParam(emp.name).toLowerCase() === routeEmployeeName.toLowerCase() ||
          String(emp.id).toLowerCase() === normalized
        );
      }) || null
    );
  }, [routeEmployeeName, employeesData]);

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employeesData.filter((emp) => {
      if (statusFilter === 'active' && emp.status !== 'active') return false;
      if (statusFilter === 'suspended' && emp.status !== 'suspended') return false;
      if (statusFilter === 'on-duty' && emp.todayStatus !== 'On Duty') return false;

      if (!q) return true;
      return (
        emp.name.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        emp.designation.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q) ||
        emp.phone.toLowerCase().includes(q)
      );
    });
  }, [employeesData, search, statusFilter]);

  const summary = useMemo(() => {
    const total = employeesData.length;
    const activeCount = employeesData.filter((e) => e.status === 'active').length;
    const onDutyToday = employeesData.filter(
      (e) => e.todayStatus === 'On Duty' || e.todayStatus === 'Checked Out',
    ).length;
    const liveOnDuty = employeesData.filter((e) => e.todayStatus === 'On Duty').length;
    const totalSalaryPaid = employeesData.reduce((s, e) => s + e.totalPaid, 0);
    const totalActivities = employeesData.reduce(
      (s, e) => s + e.activities.length,
      0,
    );
    return {
      total,
      activeCount,
      onDutyToday,
      liveOnDuty,
      totalSalaryPaid,
      totalActivities,
    };
  }, [employeesData]);

  const handleSaveEmployee = ({ mode, assignType, selectedUserId, form }) => {
    if (mode === 'edit' && employeeModal?.employee) {
      upsertEmployeeProfile(employeeModal.employee.id, {
        designation: form.designation,
        department: form.department,
        phone: form.phone,
        joinedDate: form.joinedDate,
        monthlySalary: Number(form.monthlySalary || 0),
        shiftStart: form.shiftStart,
        shiftEnd: form.shiftEnd,
        address: form.address,
        emergencyContact: form.emergencyContact,
      });
      toast.success('Employee profile updated.');
      setEmployeeModal(null);
      refresh();
      return;
    }

    if (assignType === 'promote') {
      const target = users.find((u) => u.id === selectedUserId);
      if (!target) return;
      const res = updateUserRole(target.id, 'employee');
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      upsertEmployeeProfile(target.id, {
        designation: form.designation,
        department: form.department,
        phone: form.phone || target.phone || '',
        joinedDate: form.joinedDate,
        monthlySalary: Number(form.monthlySalary || 0),
        shiftStart: form.shiftStart,
        shiftEnd: form.shiftEnd,
        address: form.address,
        emergencyContact: form.emergencyContact,
      });
      logEmployeeActivity(target.id, {
        type: 'profile',
        title: 'Assigned as Employee',
        description: `Role updated to Employee (${form.designation}).`,
      });
      toast.success(`${target.name} assigned as Employee.`);
      setEmployeeModal(null);
      refresh();
      return;
    }

    const res = createEmployeeUser({
      name: form.name,
      email: form.email,
      password: form.password,
      phone: form.phone,
    });
    if (!res.success) {
      toast.error(res.message);
      return;
    }
    upsertEmployeeProfile(res.user.id, {
      designation: form.designation,
      department: form.department,
      phone: form.phone,
      joinedDate: form.joinedDate,
      monthlySalary: Number(form.monthlySalary || 0),
      shiftStart: form.shiftStart,
      shiftEnd: form.shiftEnd,
      address: form.address,
      emergencyContact: form.emergencyContact,
    });
    logEmployeeActivity(res.user.id, {
      type: 'profile',
      title: 'Employee Account Created',
      description: `Joined as ${form.designation} (${formatDate(form.joinedDate)}).`,
    });
    toast.success(`${res.user.name} added to Employees.`);
    setEmployeeModal(null);
    refresh();
  };

  const handleToggleEmployeeStatus = (employee) => {
    const nextStatus = employee.status === 'active' ? 'suspended' : 'active';
    const res = updateUserStatus(employee.id, nextStatus);
    if (!res.success) {
      toast.error(res.message);
      return;
    }
    logEmployeeActivity(employee.id, {
      type: 'profile',
      title: `Account ${nextStatus === 'active' ? 'Activated' : 'Suspended'}`,
      description: `Admin changed employee status to ${nextStatus}.`,
    });
    toast.success(
      `${employee.name} is now ${nextStatus === 'active' ? 'Active' : 'Suspended'}.`,
    );
    refresh();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Management"
        action={
          !selectedEmployee ? (
            <button
              type="button"
              onClick={() => setEmployeeModal({ mode: 'add', employee: null })}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-dark transition hover:bg-primary-hover"
            >
              <FiUserPlus className="text-sm" />
              <span>Add Employee</span>
            </button>
          ) : null
        }
      />

      {selectedEmployee ? (
        <EmployeeSummaryView
          employee={selectedEmployee}
          onBack={() => navigate('/dashboard/all-users/employees')}
          onEdit={() =>
            setEmployeeModal({ mode: 'edit', employee: selectedEmployee })
          }
          onOpenPayModal={() => setPayModalEmployee(selectedEmployee)}
          onOpenAttendanceModal={() => setAttendanceModalEmployee(selectedEmployee)}
          onToggleStatus={() => handleToggleEmployeeStatus(selectedEmployee)}
        />
      ) : (
        <>
          {/* Summary KPI Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Employees</p>
                  <p className="mt-1 font-heading text-xl font-bold text-slate-900">
                    {summary.total}
                  </p>
                </div>
                <FiUsers className="text-base text-slate-600" />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Present Today</p>
                  <p className="mt-1 font-heading text-xl font-bold text-slate-900">
                    {summary.onDutyToday} / {summary.total}
                  </p>
                </div>
                <FiClock className="text-base text-emerald-600" />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Salary Paid</p>
                  <p className="mt-1 font-heading text-xl font-bold text-slate-900">
                    {formatCurrency(summary.totalSalaryPaid)}
                  </p>
                </div>
                <FiDollarSign className="text-base text-amber-600" />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Activity Logs</p>
                  <p className="mt-1 font-heading text-xl font-bold text-slate-900">
                    {summary.totalActivities}
                  </p>
                </div>
                <FiActivity className="text-base text-blue-600" />
              </div>
            </div>
          </div>

          {/* Directory Card */}
          <section className="rounded-2xl border border-slate-200/80 bg-white shadow-xs">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="relative w-full sm:max-w-xs">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search employee name, role, phone..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:bg-white"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'active', label: 'Active' },
                  { id: 'on-duty', label: 'On Duty' },
                  { id: 'suspended', label: 'Suspended' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setStatusFilter(f.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      statusFilter === f.id
                        ? 'bg-dark text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-white text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <tr className="whitespace-nowrap">
                    <th className="px-5 py-3.5">Employee Name</th>
                    <th className="px-4 py-3.5">Check-In / Out</th>
                    <th className="px-4 py-3.5 text-right">Salary Paid</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.map((emp) => (
                    <tr
                      key={emp.id}
                      onClick={() =>
                        navigate(
                          `/dashboard/all-users/employees/${toEmployeeRouteParam(emp.name)}`,
                        )
                      }
                      className="cursor-pointer transition hover:bg-slate-50/70"
                    >
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={emp.avatar}
                            alt={emp.name}
                            className="h-9 w-9 rounded-full object-cover border border-slate-200"
                          />
                          <span className="font-heading text-sm font-semibold text-slate-900">
                            {emp.name}
                          </span>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 text-xs">
                        <span className="font-semibold text-emerald-700">
                          In: {formatTime12h(emp.todayAttendance?.inAt)}
                        </span>{' '}
                        <span className="text-slate-300">|</span>{' '}
                        <span className="font-semibold text-slate-700">
                          Out: {formatTime12h(emp.todayAttendance?.outAt)}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 text-right font-heading text-sm font-bold text-slate-900">
                        {formatCurrency(emp.totalPaid)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold ${
                            emp.status === 'active'
                              ? 'text-emerald-700'
                              : 'text-rose-600'
                          }`}
                        >
                          {emp.status === 'active' ? 'Active' : 'Suspended'}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPayModalEmployee(emp);
                            }}
                            title="Pay Salary / Expense"
                            aria-label="Pay Salary / Expense"
                            className="p-1 text-emerald-600 hover:text-emerald-800 transition"
                          >
                            <FiDollarSign size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(
                                `/dashboard/all-users/employees/${toEmployeeRouteParam(emp.name)}`,
                              );
                            }}
                            title="View Profile"
                            aria-label="View Profile"
                            className="p-1 text-slate-500 hover:text-dark transition"
                          >
                            <FiEye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile & Tablet Cards */}
            <div className="grid gap-3 p-4 lg:hidden">
              {filteredEmployees.map((emp) => (
                <div
                  key={emp.id}
                  onClick={() =>
                    navigate(
                      `/dashboard/all-users/employees/${toEmployeeRouteParam(emp.name)}`,
                    )
                  }
                  className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 transition hover:border-primary"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={emp.avatar}
                        alt={emp.name}
                        className="h-10 w-10 rounded-full object-cover border border-slate-200"
                      />
                      <p className="font-heading text-sm font-bold text-slate-900">
                        {emp.name}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold ${
                        emp.status === 'active'
                          ? 'text-emerald-700'
                          : 'text-rose-600'
                      }`}
                    >
                      {emp.status === 'active' ? 'Active' : 'Suspended'}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-2.5 text-xs">
                    <div>
                      <p className="text-slate-500">In / Out</p>
                      <p className="font-semibold text-slate-800">
                        {formatTime12h(emp.todayAttendance?.inAt)} /{' '}
                        {formatTime12h(emp.todayAttendance?.outAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-500">Salary Paid</p>
                      <p className="font-bold text-slate-900">
                        {formatCurrency(emp.totalPaid)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredEmployees.length === 0 && (
              <div className="py-14 text-center">
                <FiUsers className="mx-auto text-4xl text-slate-300" />
                <p className="mt-2 text-sm font-semibold text-slate-700">
                  No employees found
                </p>
                <p className="text-xs text-slate-400">
                  Try another search keyword or add a new employee.
                </p>
              </div>
            )}
          </section>
        </>
      )}

      {employeeModal && (
        <AddOrEditEmployeeModal
          mode={employeeModal.mode}
          initialEmployee={employeeModal.employee}
          candidateUsers={nonEmployeeUsers}
          onClose={() => setEmployeeModal(null)}
          onSave={handleSaveEmployee}
        />
      )}

      {payModalEmployee && (
        <PaySalaryModal
          employee={payModalEmployee}
          onClose={() => setPayModalEmployee(null)}
          onPaid={refresh}
        />
      )}

      {attendanceModalEmployee && (
        <ManualAttendanceModal
          employee={attendanceModalEmployee}
          onClose={() => setAttendanceModalEmployee(null)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}

export default EmployeeManagement;
