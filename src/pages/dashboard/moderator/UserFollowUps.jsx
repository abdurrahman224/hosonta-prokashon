import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  FiEye,
  FiHeart,
  FiList,
  FiPhoneCall,
  FiSearch,
  FiShoppingCart,
  FiUsers,
} from 'react-icons/fi';
import FollowUpModal from '../../../components/dashboard/FollowUpModal';
import PageHeader from '../../../components/dashboard/PageHeader';
import { useAuth } from '../../../context/useAuth';
import { useData } from '../../../context/useData';
import {
  getFollowUpAssignments,
  getFollowUpLogs,
  getFollowUpSettings,
  getTodayFollowUpStats,
  getUserCartItems,
  getUserWishlistIds,
} from '../../../utils/followUpStorage';
import { UserDetailsView } from '../admin/UsersManagement';

const formatCurrency = (value) =>
  `৳${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

const formatDate = (isoString) => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const toEnDigits = (value) => {
  const bnDigits = '০১২৩৪৫৬৭৮৯';
  return String(value ?? '').replace(/[০-৯]/g, (d) =>
    String(bnDigits.indexOf(d))
  );
};

export default function UserFollowUps() {
  const { currentUser, users: authUsers = [] } = useAuth();
  const { orders = [], books = [] } = useData();
  const isModerator = currentUser?.role === 'moderator';

  const [refreshTick, setRefreshTick] = useState(0);
  const triggerRefresh = () => setRefreshTick((t) => t + 1);

  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'history'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState(isModerator ? 'mine' : 'all');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [quickFollowUpUser, setQuickFollowUpUser] = useState(null);

  const staffUsers = useMemo(
    () =>
      authUsers.filter((u) =>
        ['moderator', 'employee', 'admin'].includes(u.role)
      ),
    [authUsers]
  );

  const { settings, logs, processedUsers, todayStats } = useMemo(() => {
    void refreshTick;
    const cfg = getFollowUpSettings();
    const assignments = getFollowUpAssignments();
    const allLogs = getFollowUpLogs();

    const mapped = authUsers
      .filter((u) => u.role === 'user' || u.role === 'author')
      .map((user) => {
        const userOrders = orders.filter(
          (o) =>
            (o.userId && o.userId === user.id) ||
            (o.phone && user.phone && o.phone === user.phone) ||
            (o.customerName && user.name && o.customerName === user.name)
        );
        const orderCount = userOrders.length;
        const totalSpent = userOrders.reduce((s, o) => s + Number(o.total || 0), 0);
        const deliveredCount = userOrders.filter((o) => o.status === 'delivered').length;
        const deliveryRate =
          orderCount > 0
            ? Math.round((deliveredCount / orderCount) * 100)
            : user.deliveryRate ?? 100;
        const wishlistIds = getUserWishlistIds(user);
        const cartItems = getUserCartItems(user);
        const cartCount = cartItems.reduce((s, item) => s + Number(item.quantity || 1), 0);
        const followUpAssignment = assignments[user.id] || null;
        const followUpLogs = allLogs.filter((l) => String(l.userId) === String(user.id));

        return {
          ...user,
          phone: toEnDigits(user.phone || '01712-345678'),
          orderCount,
          totalSpent,
          deliveredCount,
          deliveryRate,
          wishlistIds,
          wishlistCount: wishlistIds.length,
          cartItems,
          cartCount,
          followUpAssignment,
          followUpLogs,
          latestLog: followUpLogs[0] || null,
        };
      });

    const stats = getTodayFollowUpStats(
      isModerator ? currentUser?.id : cfg.assignedModeratorId
    );

    return {
      settings: cfg,
      logs: allLogs,
      processedUsers: mapped,
      todayStats: stats,
    };
  }, [authUsers, orders, refreshTick, isModerator, currentUser?.id]);

  const activeProfileUser = useMemo(() => {
    if (!selectedUserId) return null;
    return processedUsers.find((u) => u.id === selectedUserId) || null;
  }, [selectedUserId, processedUsers]);

  const currentUserId = currentUser?.id;

  const filteredQueue = useMemo(() => {
    const q = search.trim().toLowerCase();
    return processedUsers.filter((u) => {
      if (scopeFilter === 'mine' && currentUserId) {
        if (String(u.followUpAssignment?.assignedToId) !== String(currentUserId)) {
          return false;
        }
      } else if (scopeFilter === 'assigned' && !u.followUpAssignment) {
        return false;
      }

      if (statusFilter !== 'all') {
        const curStatus = u.followUpAssignment?.status || 'Unassigned';
        if (statusFilter === 'pending' && curStatus !== 'Pending') return false;
        if (
          statusFilter === 'interested' &&
          !['Interested - Hot Lead', 'Will Order Soon', 'Callback Requested'].includes(curStatus)
        ) {
          return false;
        }
        if (statusFilter === 'ordered' && curStatus !== 'Placed Order') return false;
      }

      if (!q) return true;
      return [
        u.name,
        u.phone,
        u.email,
        u.followUpAssignment?.assignedToName,
        u.followUpAssignment?.status,
      ]
        .filter(Boolean)
        .some((val) => String(val).toLowerCase().includes(q));
    });
  }, [processedUsers, scopeFilter, statusFilter, search, currentUserId]);

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((log) => {
      if (scopeFilter === 'mine' && currentUserId) {
        if (String(log.followedById) !== String(currentUserId)) return false;
      }
      if (!q) return true;
      return [
        log.userName,
        log.userPhone,
        log.followedByName,
        log.outcome,
        log.retargetBooks,
        log.note,
      ]
        .filter(Boolean)
        .some((val) => String(val).toLowerCase().includes(q));
    });
  }, [logs, scopeFilter, search, currentUserId]);

  const quickHintBooks = quickFollowUpUser
    ? Array.from(
        new Set(
          [
            ...(quickFollowUpUser.cartItems || []).map(
              (c) => books.find((b) => String(b.id) === String(c.bookId))?.title
            ),
            ...(quickFollowUpUser.wishlistIds || []).map(
              (id) => books.find((b) => String(b.id) === String(id))?.title
            ),
          ].filter(Boolean)
        )
      )
        .slice(0, 3)
        .join(', ')
    : '';

  if (activeProfileUser) {
    return (
      <UserDetailsView
        user={activeProfileUser}
        onBack={() => setSelectedUserId(null)}
        allOrders={orders}
        allBooks={books}
        staffUsers={staffUsers}
        currentUser={currentUser}
        onRefresh={triggerRefresh}
      />
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="User Follow-Ups"
        action={
          <div className="text-xs text-slate-500">
            Daily Target:{' '}
            <strong className="text-slate-900">
              {todayStats.uniqueUsersToday} / {settings.dailyTarget}
            </strong>{' '}
            · Assigned: <strong className="text-slate-900">{settings.assignedModeratorName}</strong>
          </div>
        }
      />

      {/* Tabs + Scope Filter + Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('queue')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'queue'
                ? 'border border-slate-300 bg-white text-slate-900'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <FiUsers size={14} />
            <span>Follow-Up Queue ({filteredQueue.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'history'
                ? 'border border-slate-300 bg-white text-slate-900'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <FiList size={14} />
            <span>Call & Update History ({filteredLogs.length})</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-56">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user, phone, note..."
              className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 outline-none focus:border-primary"
            />
          </div>

          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-primary"
          >
            <option value="mine">My Follow-Ups</option>
            <option value="assigned">All Assigned</option>
            <option value="all">All Customers</option>
          </select>

          {activeTab === 'queue' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-primary"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="interested">Interested / Callback</option>
              <option value="ordered">Placed Order</option>
            </select>
          )}
        </div>
      </div>

      {/* TAB 1: FOLLOW-UP QUEUE TABLE */}
      {activeTab === 'queue' && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {filteredQueue.length === 0 ? (
            <p className="py-10 text-center text-xs text-slate-500">
              No customers match the selected filter.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-white text-slate-500">
                  <tr className="whitespace-nowrap">
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Phone</th>
                    <th className="px-4 py-3 text-center font-semibold">Orders</th>
                    <th className="px-4 py-3 text-right font-semibold">Spent</th>
                    <th className="px-4 py-3 text-center font-semibold">Cart / Wish</th>
                    <th className="px-4 py-3 font-semibold">Assigned To</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Latest Note</th>
                    <th className="px-4 py-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredQueue.map((u) => (
                    <tr
                      key={u.id}
                      onClick={() => setSelectedUserId(u.id)}
                      className="cursor-pointer transition hover:bg-slate-50/70"
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">
                        {u.name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-600">
                        {u.phone}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-center text-slate-700">
                        {u.orderCount}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900">
                        {formatCurrency(u.totalSpent)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-3 font-semibold">
                          <span className="inline-flex items-center gap-1 text-amber-700">
                            <FiShoppingCart size={12} />
                            <span>{u.cartCount}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 text-rose-600">
                            <FiHeart size={12} />
                            <span>{u.wishlistCount}</span>
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                        {u.followUpAssignment?.assignedToName || 'Unassigned'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-emerald-700">
                        {u.followUpAssignment?.status || 'Pending'}
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 text-slate-500">
                        {u.latestLog?.note || '—'}
                      </td>
                      <td
                        className="whitespace-nowrap px-4 py-3 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setQuickFollowUpUser(u)}
                            title="Follow Up / Log Note"
                            aria-label="Follow Up / Log Note"
                            className="p-1 text-emerald-600 hover:text-emerald-800 transition"
                          >
                            <FiPhoneCall size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedUserId(u.id)}
                            title="View Customer Data"
                            aria-label="View Customer Data"
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
          )}
        </div>
      )}

      {/* TAB 2: COMPLETE FOLLOW-UP & CALL AUDIT LOG */}
      {activeTab === 'history' && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {filteredLogs.length === 0 ? (
            <p className="py-10 text-center text-xs text-slate-500">
              No follow-up logs recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-white text-slate-500">
                  <tr className="whitespace-nowrap">
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Followed Up By</th>
                    <th className="px-4 py-3 font-semibold">Channel</th>
                    <th className="px-4 py-3 font-semibold">Outcome</th>
                    <th className="px-4 py-3 font-semibold">Retargeted Books</th>
                    <th className="px-4 py-3 font-semibold">Note</th>
                    <th className="px-4 py-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedUserId(log.userId)}
                      className="cursor-pointer transition hover:bg-slate-50/70"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">
                        {log.userName}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                        <strong>{log.followedByName}</strong> ({log.followedByRole})
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {log.channel}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-emerald-700">
                        {log.outcome}
                      </td>
                      <td className="max-w-[180px] truncate px-4 py-3 text-slate-600">
                        {log.retargetBooks || '—'}
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 text-slate-500">
                        {log.note}
                      </td>
                      <td
                        className="whitespace-nowrap px-4 py-3 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedUserId(log.userId)}
                          title="Open Customer Profile"
                          aria-label="Open Customer Profile"
                          className="p-1 text-slate-500 hover:text-dark transition"
                        >
                          <FiEye size={16} />
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

      {/* Quick Follow-Up Modal */}
      <FollowUpModal
        isOpen={Boolean(quickFollowUpUser)}
        user={quickFollowUpUser}
        retargetBooksHint={quickHintBooks}
        currentUser={currentUser}
        onClose={() => setQuickFollowUpUser(null)}
        onSaved={() => {
          toast.success('Follow-up update recorded.');
          triggerRefresh();
        }}
      />
    </div>
  );
}
