import { useState, useMemo } from 'react';
import {
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiHeart,
  FiMail,
  FiMapPin,
  FiPackage,
  FiPhone,
  FiSearch,
  FiShoppingBag,
  FiTrendingUp,
  FiTruck,
  FiUser,
  FiUsers,
  FiXCircle,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../../components/dashboard/PageHeader';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import { useAuth } from '../../../context/useAuth';
import { useData } from '../../../context/useData';
import { formatCurrency } from '../../../utils/format';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const toBnNum = (value) => {
  const bnDigits = '০১২৩৪৫৬৭৮৯';
  return String(value ?? '').replace(/\d/g, (d) => bnDigits[Number(d)]);
};

const formatDate = (isoString) => {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
};

function readWishlistIds(userId) {
  try {
    const stored = localStorage.getItem(`hosonta_wishlist_${userId}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/* User Profile Details View                                          */
/* ------------------------------------------------------------------ */

function UserDetailsView({ user, onBack, allOrders, allBooks }) {
  const [activeTab, setActiveTab] = useState('orders');

  // Filter orders of this user
  const userOrders = useMemo(() => {
    return allOrders.filter(
      (o) =>
        (o.userId && o.userId === user.id) ||
        (o.phone && user.phone && o.phone === user.phone) ||
        (o.customerName && user.name && o.customerName === user.name)
    );
  }, [allOrders, user]);

  // Wishlist books
  const userWishlistBooks = useMemo(() => {
    const ids = user.wishlistIds || [];
    return allBooks.filter((book) =>
      ids.some((id) => String(id) === String(book.id))
    );
  }, [allBooks, user]);

  return (
    <div className="space-y-6">
      {/* Top back button & title */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-xs ring-1 ring-slate-200/80 transition hover:bg-slate-50 hover:text-dark"
        >
          <FiArrowLeft className="text-base" />
          <span>সকল গ্রাহক তালিকায় ফিরুন</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">ইউজার আইডি:</span>
          <code className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono font-medium text-slate-700">
            {user.id}
          </code>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-18 w-18 shrink-0 sm:h-20 sm:w-20">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-full w-full rounded-2xl object-cover ring-2 ring-primary/30"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-2xl bg-primary/20 text-2xl font-bold text-dark">
                  {user.name.charAt(0)}
                </div>
              )}
              <span
                className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white ${
                  user.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
                title={user.status === 'active' ? 'সক্রিয়' : 'স্থগিত'}
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-xl font-bold text-slate-900 sm:text-2xl">
                  {user.name}
                </h1>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    user.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {user.status === 'active' ? 'সক্রিয় অ্যাকাউন্ট' : 'স্থগিত'}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  {user.role === 'admin'
                    ? 'অ্যাডমিন'
                    : user.role === 'author'
                    ? 'লেখক'
                    : 'সাধারণ গ্রাহক'}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 sm:text-sm">
                <span className="flex items-center gap-1.5">
                  <FiMail className="text-slate-400" />
                  <a
                    href={`mailto:${user.email}`}
                    className="hover:text-primary-hover hover:underline"
                  >
                    {user.email}
                  </a>
                </span>
                {user.phone && (
                  <span className="flex items-center gap-1.5">
                    <FiPhone className="text-slate-400" />
                    <a
                      href={`tel:${user.phone}`}
                      className="font-medium text-slate-700 hover:text-primary-hover"
                    >
                      {user.phone}
                    </a>
                  </span>
                )}
                {user.city && (
                  <span className="flex items-center gap-1.5">
                    <FiMapPin className="text-slate-400" />
                    <span>{user.city}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick contact buttons */}
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 md:border-0 md:pt-0">
            {user.phone && (
              <a
                href={`tel:${user.phone}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                <FiPhone /> কল করুন
              </a>
            )}
            {user.phone && (
              <a
                href={`https://wa.me/${user.phone.replace(/[^\d]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                <FaWhatsapp /> হোয়াটসঅ্যাপ
              </a>
            )}
            <a
              href={`mailto:${user.email}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-dark transition hover:bg-primary-hover"
            >
              <FiMail /> ইমেইল পাঠান
            </a>
          </div>
        </div>
      </div>

      {/* 4 Key Statistics Cards */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FiShoppingBag className="text-xl" />
            </span>
            <span className="text-[11px] font-medium text-slate-400">সর্বমোট অর্ডার</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {toBnNum(user.orderCount)} টি
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            সফল সম্পন্ন: {toBnNum(user.deliveredCount)} টি
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <FiTrendingUp className="text-xl" />
            </span>
            <span className="text-[11px] font-medium text-slate-400">মোট ক্রয়মূল্য</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {formatCurrency(user.totalSpent)}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">মোট লেনদেনের পরিমাণ</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                user.deliveryRate >= 90
                  ? 'bg-emerald-50 text-emerald-600'
                  : user.deliveryRate >= 80
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-rose-50 text-rose-600'
              }`}
            >
              <FiTruck className="text-xl" />
            </span>
            <span className="text-[11px] font-medium text-slate-400">ডেলিভারি সাকসেস</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {toBnNum(user.deliveryRate)}%
            </span>
            <span className="text-xs font-semibold text-emerald-600">
              {user.deliveryRate >= 90 ? 'খুব ভালো' : 'সাধারণ'}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">পার্সেল গ্রহণ করার হার</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <FiHeart className="text-xl" />
            </span>
            <span className="text-[11px] font-medium text-slate-400">উইশলিস্ট সংরক্ষিত</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {toBnNum(user.wishlistCount)} টি
          </p>
          <p className="mt-0.5 text-xs text-slate-500">পছন্দের তালিকায় রাখা বই</p>
        </div>
      </div>

      {/* Tabs: Orders / Wishlist / Contact Info */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-4 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`border-b-2 px-4 py-3 text-xs sm:text-sm font-semibold transition ${
              activeTab === 'orders'
                ? 'border-primary text-dark font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            অর্ডারের ইতিহাস ({toBnNum(userOrders.length)})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('wishlist')}
            className={`border-b-2 px-4 py-3 text-xs sm:text-sm font-semibold transition ${
              activeTab === 'wishlist'
                ? 'border-primary text-dark font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            উইশলিস্টে থাকা বই ({toBnNum(userWishlistBooks.length)})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`border-b-2 px-4 py-3 text-xs sm:text-sm font-semibold transition ${
              activeTab === 'info'
                ? 'border-primary text-dark font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            ঠিকানা ও বিবরণ
          </button>
        </div>

        {/* Tab 1: Orders Tab */}
        {activeTab === 'orders' && (
          <div className="p-4 sm:p-5">
            {userOrders.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <FiPackage className="mx-auto text-4xl text-slate-300" />
                <p className="mt-2 text-sm font-medium">এই ব্যবহারকারীর কোনো অর্ডার পাওয়া যায়নি।</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500">
                      <th className="pb-3 pr-4">অর্ডার আইডি</th>
                      <th className="pb-3 pr-4">তারিখ</th>
                      <th className="pb-3 pr-4">আইটেম বিবরণ</th>
                      <th className="pb-3 pr-4 text-right">মোট টাকা</th>
                      <th className="pb-3 pr-4 text-center">পেমেন্ট</th>
                      <th className="pb-3 text-right">স্ট্যাটাস</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {userOrders.map((order) => {
                      const itemCount = (order.items || []).reduce(
                        (sum, i) => sum + (i.quantity || i.qty || 1),
                        0
                      );
                      return (
                        <tr key={order.id} className="transition hover:bg-slate-50/70">
                          <td className="py-3.5 pr-4 font-mono font-medium text-slate-900">
                            {order.id}
                          </td>
                          <td className="whitespace-nowrap py-3.5 pr-4 text-xs text-slate-500">
                            {formatDate(order.date)}
                          </td>
                          <td className="py-3.5 pr-4">
                            <p className="max-w-xs truncate text-xs font-medium text-slate-800">
                              {(order.items || []).map((i) => i.title).join(', ') || 'বই অর্ডার'}
                            </p>
                            <span className="text-[11px] text-slate-400">
                              মোট {toBnNum(itemCount)}টি বই
                            </span>
                          </td>
                          <td className="whitespace-nowrap py-3.5 pr-4 text-right font-bold text-slate-900">
                            {formatCurrency(order.total || 0)}
                          </td>
                          <td className="whitespace-nowrap py-3.5 pr-4 text-center">
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium uppercase text-slate-700">
                              {order.paymentMethod || 'COD'}
                            </span>
                          </td>
                          <td className="whitespace-nowrap py-3.5 text-right">
                            <StatusBadge status={order.status} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Wishlist Tab */}
        {activeTab === 'wishlist' && (
          <div className="p-4 sm:p-5">
            {userWishlistBooks.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <FiHeart className="mx-auto text-4xl text-slate-300" />
                <p className="mt-2 text-sm font-medium">উইশলিস্টে কোনো বই সংরক্ষিত নেই।</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {userWishlistBooks.map((book) => (
                  <div
                    key={book.id}
                    className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-2.5 transition hover:shadow-md"
                  >
                    <div className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-slate-100">
                      <img
                        src={book.cover || book.image}
                        alt={book.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="mt-2 flex flex-1 flex-col">
                      <p className="font-heading text-xs font-bold text-slate-900 line-clamp-1">
                        {book.title}
                      </p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {book.author}
                      </p>
                      <p className="mt-auto pt-1 font-heading text-xs font-bold text-slate-900">
                        {formatCurrency(book.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Detailed Information Tab */}
        {activeTab === 'info' && (
          <div className="p-4 sm:p-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-500">
                  যোগাযোগ ও ডেলিভারি ঠিকানা
                </h4>
                <div className="mt-3 space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">পূর্ণ নাম:</span>
                    <span className="font-medium text-slate-900">{user.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ইমেইল:</span>
                    <span className="font-medium text-slate-900">{user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">মোবাইল নাম্বার:</span>
                    <span className="font-medium text-slate-900">{user.phone || 'দেওয়া হয়নি'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">শহর/জেলা:</span>
                    <span className="font-medium text-slate-900">{user.city || 'ঢাকা'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">বিস্তারিত ঠিকানা:</span>
                    <span className="max-w-xs text-right font-medium text-slate-900">
                      {user.address || 'তথ্য পাওয়া যায়নি'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-500">
                  অ্যাকাউন্ট ও মেম্বারশিপ বিবরণ
                </h4>
                <div className="mt-3 space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">অ্যাকাউন্ট রোল:</span>
                    <span className="font-semibold text-slate-800">
                      {user.role === 'admin'
                        ? 'অ্যাডমিন'
                        : user.role === 'author'
                        ? 'লেখক'
                        : 'সাধারণ ক্রেতা/পাঠক'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">অ্যাকাউন্ট স্ট্যাটাস:</span>
                    <span className="font-semibold text-emerald-600">
                      {user.status === 'active' ? 'সক্রিয় (Active)' : 'স্থগিত (Suspended)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">যোগদানের তারিখ:</span>
                    <span className="font-medium text-slate-900">
                      {formatDate(user.joinedDate || '2024-05-15')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ডেলিভারি রেট হিসেব:</span>
                    <span className="font-medium text-slate-900">
                      {toBnNum(user.deliveredCount)} / {toBnNum(user.orderCount)} সফল পার্সেল
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Users List View (Table & Metrics)                                  */
/* ------------------------------------------------------------------ */

function UsersManagement() {
  const { users: authUsers = [] } = useAuth();
  const { orders = [], books = [] } = useData();
  const { id: routeUserId } = useParams();
  const navigate = useNavigate();

  const [selectedUserId, setSelectedUserId] = useState(routeUserId || null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('orders');

  // Compute metrics for each user
  const processedUsers = useMemo(() => {
    return authUsers.map((user) => {
      // Find orders matching this user
      const userOrders = orders.filter(
        (o) =>
          (o.userId && o.userId === user.id) ||
          (o.phone && user.phone && o.phone === user.phone) ||
          (o.customerName && user.name && o.customerName === user.name)
      );

      const orderCount = userOrders.length;
      const totalSpent = userOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
      const deliveredCount = userOrders.filter((o) => o.status === 'delivered').length;

      // Delivery rate %
      const deliveryRate =
        orderCount > 0
          ? Math.round((deliveredCount / orderCount) * 100)
          : user.deliveryRate ?? 100;

      // Wishlist items
      const localWishlist = readWishlistIds(user.id);
      const wishlistIds = localWishlist.length > 0 ? localWishlist : user.wishlist || [];
      const wishlistCount = wishlistIds.length;

      return {
        ...user,
        phone: user.phone || '০১৭১২-৩৪৫৬৭৮',
        orderCount,
        totalSpent,
        deliveredCount,
        deliveryRate,
        wishlistIds,
        wishlistCount,
      };
    });
  }, [authUsers, orders]);

  // Active view: selected user if ID matched
  const activeUser = useMemo(() => {
    const targetId = routeUserId || selectedUserId;
    if (!targetId) return null;
    return processedUsers.find((u) => u.id === targetId) || null;
  }, [routeUserId, selectedUserId, processedUsers]);

  // Filtered & sorted list
  const visibleUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return processedUsers
      .filter((user) => {
        if (statusFilter !== 'all') {
          if (statusFilter === 'active' && user.status !== 'active') return false;
          if (statusFilter === 'user' && user.role !== 'user') return false;
          if (statusFilter === 'author' && user.role !== 'author') return false;
        }
        if (!q) return true;
        return [user.name, user.email, user.phone]
          .filter(Boolean)
          .some((val) => String(val).toLowerCase().includes(q));
      })
      .sort((a, b) => {
        if (sortBy === 'orders') return b.orderCount - a.orderCount;
        if (sortBy === 'spent') return b.totalSpent - a.totalSpent;
        if (sortBy === 'deliveryRate') return b.deliveryRate - a.deliveryRate;
        if (sortBy === 'wishlist') return b.wishlistCount - a.wishlistCount;
        return a.name.localeCompare(b.name, 'bn');
      });
  }, [processedUsers, search, statusFilter, sortBy]);

  // Overall summary metrics
  const totalUsersCount = processedUsers.length;
  const totalOrdersCount = processedUsers.reduce((s, u) => s + u.orderCount, 0);
  const totalSpentAll = processedUsers.reduce((s, u) => s + u.totalSpent, 0);
  const avgDeliveryRate =
    totalUsersCount > 0
      ? Math.round(
          processedUsers.reduce((s, u) => s + u.deliveryRate, 0) / totalUsersCount
        )
      : 100;

  // Handle open user details
  const handleSelectUser = (user) => {
    setSelectedUserId(user.id);
    navigate(`/dashboard/all-users/users/${user.id}`);
  };

  // Handle back to list
  const handleBackToList = () => {
    setSelectedUserId(null);
    navigate('/dashboard/all-users/users');
  };

  // If a user is selected, render the rich detail view
  if (activeUser) {
    return (
      <UserDetailsView
        user={activeUser}
        onBack={handleBackToList}
        allOrders={orders}
        allBooks={books}
      />
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="ব্যবহারকারী ব্যবস্থাপনা"
        description="নিবন্ধিত সকল গ্রাহকদের তালিকা, ফোন নাম্বার, ইমেইল, ডেলিভারি রেট, মোট অর্ডার ও উইশলিস্ট তথ্য।"
      />

      {/* 4 Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FiUsers className="text-xl" />
            </span>
            <span className="text-xs font-semibold text-slate-500">সর্বমোট ইউজার</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {toBnNum(totalUsersCount)} জন
          </p>
          <p className="mt-0.5 text-xs text-slate-500">নিবন্ধিত ক্রেতা ও ব্যবহারকারী</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <FiPackage className="text-xl" />
            </span>
            <span className="text-xs font-semibold text-slate-500">মোট অর্ডার</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {toBnNum(totalOrdersCount)} টি
          </p>
          <p className="mt-0.5 text-xs text-slate-500">গ্রাহকদের দেওয়া মোট অর্ডার</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <FiTrendingUp className="text-xl" />
            </span>
            <span className="text-xs font-semibold text-slate-500">মোট বিক্রি</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {formatCurrency(totalSpentAll)}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">গ্রাহকদের অর্ডারের সমষ্টি</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <FiTruck className="text-xl" />
            </span>
            <span className="text-xs font-semibold text-slate-500">গড় ডেলিভারি রেট</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {toBnNum(avgDeliveryRate)}%
          </p>
          <p className="mt-0.5 text-xs text-slate-500">সফলভাবে পার্সেল গ্রহণের হার</p>
        </div>
      </div>

      {/* Main Table Card */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {/* Controls: Search, Filter, Sort */}
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 border-b border-slate-100">
          <div className="relative w-full sm:w-72">
            <FiSearch
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="নাম, ইমেইল বা ফোন নাম্বার খুঁজুন..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-primary focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status & Role filters */}
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
              {[
                ['all', 'সকল ইউজার'],
                ['user', 'সাধারণ গ্রাহক'],
                ['author', 'লেখক'],
                ['active', 'সক্রিয়'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                    statusFilter === key
                      ? 'bg-white text-dark shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Sort by */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-primary cursor-pointer"
            >
              <option value="orders">অর্ডার সংখ্যা (বেশি থেকে কম)</option>
              <option value="spent">মোট খরচ (বেশি থেকে কম)</option>
              <option value="deliveryRate">ডেলিভারি রেট (বেশি থেকে কম)</option>
              <option value="wishlist">উইশলিস্ট বই (বেশি থেকে কম)</option>
              <option value="name">নামানুসারে</option>
            </select>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold text-slate-500">
                <th className="px-5 py-3.5">ব্যবহারকারী (নাম ও রোল)</th>
                <th className="px-5 py-3.5">যোগাযোগের তথ্য</th>
                <th className="px-5 py-3.5 text-center">ডেলিভারি রেট</th>
                <th className="px-5 py-3.5 text-center">অর্ডার সংখ্যা</th>
                <th className="px-5 py-3.5 text-right">মোট ক্রয়মূল্য</th>
                <th className="px-5 py-3.5 text-center">উইশলিস্ট</th>
                <th className="px-5 py-3.5 text-center">স্ট্যাটাস</th>
                <th className="px-5 py-3.5 text-right">পদক্ষেপ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleUsers.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className="group transition-colors hover:bg-slate-50/80 cursor-pointer"
                >
                  {/* User name & avatar */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-200"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-dark">
                            {user.name.charAt(0)}
                          </div>
                        )}
                        <span
                          className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-white ${
                            user.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900 group-hover:text-primary-hover transition-colors">
                          {user.name}
                        </p>
                        <span className="inline-block rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-medium text-slate-600">
                          {user.role === 'admin'
                            ? 'অ্যাডমিন'
                            : user.role === 'author'
                            ? 'লেখক'
                            : 'গ্রাহক'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Email & Phone */}
                  <td className="px-5 py-3.5">
                    <p className="truncate text-xs font-medium text-slate-700">
                      {user.email}
                    </p>
                    <p className="truncate text-xs text-slate-500 font-mono">
                      {user.phone}
                    </p>
                  </td>

                  {/* Delivery Rate */}
                  <td className="whitespace-nowrap px-5 py-3.5 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          user.deliveryRate >= 90
                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60'
                            : user.deliveryRate >= 80
                            ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60'
                            : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/60'
                        }`}
                      >
                        {toBnNum(user.deliveryRate)}%
                      </span>
                      <div className="mt-1 h-1 w-14 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full ${
                            user.deliveryRate >= 90
                              ? 'bg-emerald-500'
                              : user.deliveryRate >= 80
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${user.deliveryRate}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Total Orders */}
                  <td className="whitespace-nowrap px-5 py-3.5 text-center">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50/70 px-2.5 py-1 text-xs font-bold text-blue-700">
                      <FiShoppingBag className="text-[11px]" />
                      <span>{toBnNum(user.orderCount)} বার</span>
                    </span>
                  </td>

                  {/* Total Spent */}
                  <td className="whitespace-nowrap px-5 py-3.5 text-right">
                    <p className="font-heading text-sm font-bold text-slate-900">
                      {formatCurrency(user.totalSpent)}
                    </p>
                  </td>

                  {/* Wishlist count */}
                  <td className="whitespace-nowrap px-5 py-3.5 text-center">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600">
                      <FiHeart className="text-rose-500 fill-rose-500/20" />
                      <span>{toBnNum(user.wishlistCount)} টি</span>
                    </span>
                  </td>

                  {/* Status */}
                  <td className="whitespace-nowrap px-5 py-3.5 text-center">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        user.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          user.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                      {user.status === 'active' ? 'সক্রিয়' : 'স্থগিত'}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="whitespace-nowrap px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectUser(user);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-primary hover:text-dark"
                    >
                      <FiEye className="text-xs" />
                      <span>বিস্তারিত</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {visibleUsers.length === 0 && (
            <div className="py-14 text-center">
              <FiUsers className="mx-auto text-4xl text-slate-300" />
              <p className="mt-2 text-sm font-semibold text-slate-700">কোনো ইউজার পাওয়া যায়নি</p>
              <p className="text-xs text-slate-400">অন্য কোনো নাম বা নাম্বার দিয়ে সার্চ করুন।</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 p-4 text-xs font-medium text-slate-500 sm:px-5">
          <span>
            সর্বমোট {toBnNum(totalUsersCount)} জনের মধ্যে {toBnNum(visibleUsers.length)} জন প্রদর্শিত হচ্ছে
          </span>
          <span className="text-[11px] text-slate-400">
            যে কোনো ইউজারের উপর ক্লিক করে তার সম্পূর্ণ প্রোফাইল ও অর্ডার বিবরণ দেখুন
          </span>
        </div>
      </section>
    </div>
  );
}

export default UsersManagement;
