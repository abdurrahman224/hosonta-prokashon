import { useMemo, useState } from 'react';
import { FiCheckCircle, FiSearch, FiUsers } from 'react-icons/fi';
import { LuBanknote } from 'react-icons/lu';
import PageHeader from '../../../components/dashboard/PageHeader';
import RoleBadge from '../../../components/dashboard/RoleBadge';
import { useAuth } from '../../../context/useAuth';
import { formatCurrency } from '../../../utils/format';
import { ROLE_LABELS, ROLES } from '../../../utils/roles';

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

/* Set USE_DUMMY_DATA to false to use real users from useAuth().
   Real users can carry: user.salary (monthly amount),
   user.salaryPaid (true/false) and user.status ('active' | ...). */
const USE_DUMMY_DATA = true;

const STAFF_ROLES = [ROLES.ADMIN, ROLES.MODERATOR, ROLES.EMPLOYEE];

const currentMonth = new Date().toLocaleDateString('en-GB', {
  month: 'long',
  year: 'numeric',
});

const DUMMY_STAFF = [
  {
    id: 's1',
    name: 'Rahim Uddin',
    email: 'rahim.admin@example.com',
    role: ROLES.ADMIN,
    salary: 60000,
    salaryPaid: true,
    status: 'active',
  },
  {
    id: 's2',
    name: 'Nusrat Jahan',
    email: 'nusrat.admin@example.com',
    role: ROLES.ADMIN,
    salary: 55000,
    salaryPaid: true,
    status: 'active',
  },
  {
    id: 's3',
    name: 'Tanvir Ahmed',
    email: 'tanvir.mod@example.com',
    role: ROLES.MODERATOR,
    salary: 35000,
    salaryPaid: true,
    status: 'active',
  },
  {
    id: 's4',
    name: 'Sadia Islam',
    email: 'sadia.mod@example.com',
    role: ROLES.MODERATOR,
    salary: 32000,
    salaryPaid: false,
    status: 'active',
  },
  {
    id: 's5',
    name: 'Mehedi Hasan',
    email: 'mehedi.mod@example.com',
    role: ROLES.MODERATOR,
    salary: 30000,
    salaryPaid: true,
    status: 'inactive',
  },
  {
    id: 's6',
    name: 'Farhana Akter',
    email: 'farhana@example.com',
    role: ROLES.EMPLOYEE,
    salary: 18000,
    salaryPaid: true,
    status: 'active',
  },
  {
    id: 's7',
    name: 'Imran Hossain',
    email: 'imran@example.com',
    role: ROLES.EMPLOYEE,
    salary: 16000,
    salaryPaid: true,
    status: 'active',
  },
  {
    id: 's8',
    name: 'Maliha Rahman',
    email: 'maliha@example.com',
    role: ROLES.EMPLOYEE,
    salary: 15000,
    salaryPaid: false,
    status: 'active',
  },
  {
    id: 's9',
    name: 'Shakib Khan',
    email: 'shakib@example.com',
    role: ROLES.EMPLOYEE,
    salary: 15000,
    salaryPaid: true,
    status: 'inactive',
  },
  {
    id: 's10',
    name: 'Jannatul Ferdous',
    email: 'jannatul@example.com',
    role: ROLES.EMPLOYEE,
    salary: 14000,
    salaryPaid: true,
    status: 'active',
  },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const isActive = user =>
  String(user.status ?? 'active').toLowerCase() === 'active';
const salaryOf = user => Number(user.salary ?? user.monthlySalary ?? 0);
const isPaid = user => Boolean(user.salaryPaid ?? user.paid ?? false);
/* Amount actually given this month: salary if paid, otherwise 0 */
const paidAmount = user => (isPaid(user) ? salaryOf(user) : 0);

function Avatar({ user, active }) {
  const src = user.avatar ?? user.photo ?? user.image ?? user.profileImage;
  const initials = (user.name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();

  return (
    <div className="relative h-10 w-10 shrink-0">
      {src ? (
        <img
          src={src}
          alt={user.name}
          className="h-10 w-10 rounded-full object-cover"
        />
      ) : (
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-600">
          {initials}
        </span>
      )}
      <span
        title={active ? 'Active' : 'Inactive'}
        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
          active ? 'bg-emerald-500' : 'bg-slate-300'
        }`}
      />
    </div>
  );
}

function ActiveBadge({ active }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      Inactive
    </span>
  );
}

function PaidBadge({ paid }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        paid ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
      }`}
    >
      {paid ? 'Paid' : 'Pending'}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Staff list                                                          */
/* ------------------------------------------------------------------ */

function StaffList() {
  const { users } = useAuth();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const staff = useMemo(() => {
    const pool = USE_DUMMY_DATA ? DUMMY_STAFF : (users ?? []);
    return pool.filter(user => STAFF_ROLES.includes(user.role));
  }, [users]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return staff.filter(user => {
      if (roleFilter !== 'all' && user.role !== roleFilter) return false;
      if (!q) return true;
      return [user.name, user.email]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(q));
    });
  }, [staff, search, roleFilter]);

  const totalPaid = staff.reduce((sum, user) => sum + paidAmount(user), 0);
  const activeCount = staff.filter(isActive).length;

  const summary = [
    { label: 'Total Staff', value: staff.length, icon: FiUsers },
    { label: 'Active Now', value: activeCount, icon: FiCheckCircle },
    {
      label: `Salary Paid (${currentMonth})`,
      value: formatCurrency(totalPaid),
      icon: LuBanknote,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        {summary.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Icon size={17} />
            </span>
            <p className="mt-3 text-xs text-slate-500">{label}</p>
            <p className="text-xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <h2 className="font-heading text-base font-bold text-slate-900 sm:text-lg">
            Staff &amp; Roles
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Who holds which role, and salary given in {currentMonth}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="relative">
            <FiSearch
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search name or email..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-blue-500 sm:w-64"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              ['all', 'All'],
              ...STAFF_ROLES.map(role => [role, ROLE_LABELS[role] ?? role]),
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setRoleFilter(value)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  roleFilter === value
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50/70 text-xs font-medium text-slate-500">
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3 text-right">Monthly Salary</th>
                <th className="px-5 py-3 text-right">Given This Month</th>
                <th className="px-5 py-3">Salary</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map(user => (
                <tr key={user.id} className="transition hover:bg-slate-50/60">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar user={user} active={isActive(user)} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {user.name}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-right text-sm text-slate-600">
                    {formatCurrency(salaryOf(user))}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-right text-sm font-bold text-slate-900">
                    {formatCurrency(paidAmount(user))}
                  </td>
                  <td className="px-5 py-3.5">
                    <PaidBadge paid={isPaid(user)} />
                  </td>
                  <td className="px-5 py-3.5">
                    <ActiveBadge active={isActive(user)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-400">
              No staff found.
            </p>
          )}
        </div>

        <div className="border-t border-slate-100 p-4 text-sm text-slate-500 sm:px-5">
          Showing {visible.length} of {staff.length} staff
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function UsersManagement() {
  return (
    <>
      <PageHeader
        title="Roles"
        description="See who is an admin, moderator or employee, and the salary given this month."
      />
      <StaffList />
    </>
  );
}

export default UsersManagement;
