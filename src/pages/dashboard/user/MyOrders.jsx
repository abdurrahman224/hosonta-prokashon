import { useMemo, useState } from 'react';
import {
  FiAlertCircle,
  FiBook,
  FiCopy,
  FiSearch,
  FiTruck,
  FiX,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import { useAuth } from '../../../context/useAuth';
import { useData } from '../../../context/useData';
import books from '../../../data/books';
import { getBookPath } from '../../../utils/bookSlug';

const statusTabs = [
  { value: '', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'In Transit' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Canceled' },
];

const formatDate = value => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// আইটেমে ছবি/লেখক/দাম না থাকলে books ডেটা থেকে নেওয়া হয়
const resolveItem = item => {
  const book = books.find(entry => String(entry.id) === String(item.bookId));
  return {
    ...item,
    image:
      item.image ||
      item.cover ||
      book?.image ||
      book?.cover ||
      book?.coverImage ||
      '',
    author: item.author || book?.author || '',
    qty: item.quantity ?? item.qty ?? 1,
    price: item.price ?? book?.price ?? 0,
  };
};

function MyOrders() {
  const { currentUser } = useAuth();
  const { orders, reviews } = useData();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');

  const mine = useMemo(
    () =>
      orders
        .filter(order => order.userId === currentUser.id)
        .map(order => ({
          ...order,
          items: order.items.map(resolveItem),
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [orders, currentUser.id],
  );

  const counts = useMemo(() => {
    const result = { '': mine.length };
    mine.forEach(order => {
      result[order.status] = (result[order.status] ?? 0) + 1;
    });
    return result;
  }, [mine]);

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    return mine.filter(
      order =>
        (!status || order.status === status) &&
        (!search ||
          `${order.id} ${order.items.map(item => item.title).join(' ')}`
            .toLowerCase()
            .includes(search)),
    );
  }, [mine, query, status]);

  const hasReview = item =>
    reviews.some(
      review =>
        review.userId === currentUser.id &&
        String(review.bookId) === String(item.bookId),
    );

  const copyId = async id => {
    try {
      await navigator.clipboard.writeText(String(id));
      toast.success('Order ID copied.');
    } catch {
      toast.error('Could not copy the order ID.');
    }
  };

  return (
    <>
      {/* Header */}
      <div className="mb-3 sm:mb-6">
        <h1 className="font-heading text-lg font-bold text-dark sm:text-3xl">
          My Orders
        </h1>
        <p className="mt-0.5 truncate text-xs text-dark-muted sm:mt-1 sm:text-base">
          Track your order status and shipment details.
        </p>
      </div>

      {/* Search + filter */}
      <div className="mb-3 space-y-2 sm:mb-5 sm:space-y-3">
        <div className="flex w-full items-center gap-2 rounded-lg border border-dark/15 bg-white px-3 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30 md:max-w-md">
          <FiSearch
            className="shrink-0 text-base text-dark-muted"
            aria-hidden="true"
          />
          <input
            type="text"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search order ID or book title..."
            aria-label="Search orders"
            className="min-w-0 flex-1 appearance-none border-0 bg-transparent py-2 text-base text-dark shadow-none outline-none ring-0 placeholder:text-dark-muted/60 focus:border-0 focus:shadow-none focus:outline-none focus:ring-0 sm:py-2.5"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="shrink-0 rounded-full p-1 text-dark-muted transition hover:bg-cream hover:text-dark"
            >
              <FiX />
            </button>
          )}
        </div>

        <div
          role="tablist"
          aria-label="Order status filter"
          className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:gap-2 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {statusTabs.map(tab => {
            const active = status === tab.value;
            return (
              <button
                key={tab.value || 'all'}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setStatus(tab.value)}
                className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold transition sm:gap-1.5 sm:px-4 sm:py-2 sm:text-sm ${
                  active
                    ? 'border-dark bg-dark text-white'
                    : 'border-dark/15 bg-white text-dark hover:bg-cream'
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-1.5 text-[10px] sm:text-xs ${
                    active ? 'bg-white/20' : 'bg-dark/5 text-dark-muted'
                  }`}
                >
                  {counts[tab.value] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Order cards */}
      <div className="space-y-3 sm:space-y-5">
        {visible.map(order => {
          const itemCount = order.items.reduce(
            (sum, item) => sum + Number(item.qty || 1),
            0,
          );
          return (
            <article
              key={order.id}
              className="overflow-hidden rounded-xl border border-dark/10 bg-white shadow-sm sm:rounded-2xl"
            >
              {/* Order header */}
              <div className="flex items-start justify-between gap-3 px-3.5 py-3 sm:px-6 sm:py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="truncate text-sm font-bold text-dark sm:text-base">
                      Order #{order.id}
                    </h2>
                    <button
                      type="button"
                      onClick={() => copyId(order.id)}
                      aria-label="Copy order ID"
                      title="Copy order ID"
                      className="shrink-0 rounded p-1 text-xs text-dark-muted transition hover:bg-cream hover:text-dark sm:text-sm"
                    >
                      <FiCopy />
                    </button>
                  </div>
                  {order.date && (
                    <p className="mt-0.5 text-[11px] text-dark-muted sm:text-sm">
                      Placed on {formatDate(order.date)}
                    </p>
                  )}
                </div>
                <span className="shrink-0">
                  <StatusBadge status={order.status} />
                </span>
              </div>

              {/* Items */}
              <ul className="divide-y divide-dark/10 border-t border-dark/10">
                {order.items.map(item => (
                  <li
                    key={`${order.id}-${item.bookId}`}
                    className="flex gap-3 px-3.5 py-3 sm:gap-4 sm:px-6 sm:py-4"
                  >
                    <Link
                      to={getBookPath(item.bookId, books)}
                      className="flex h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-dark/10 bg-cream sm:h-20 sm:w-16"
                      aria-label={item.title}
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <FiBook
                          className="text-dark-muted"
                          aria-hidden="true"
                        />
                      )}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={getBookPath(item.bookId, books)}
                        className="line-clamp-2 text-[13px] font-semibold leading-snug text-dark hover:underline sm:text-base"
                      >
                        {item.title}
                      </Link>
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-dark-muted sm:text-sm">
                        {item.author && <>Author: {item.author} · </>}Qty:{' '}
                        {item.qty}
                      </p>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-dark sm:text-base">
                          Tk {item.price}
                        </p>
                        {order.status === 'delivered' && (
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`${getBookPath(item.bookId, books)}#reviews`)
                            }
                            className="text-[11px] font-semibold text-blue-600 hover:underline sm:text-sm"
                          >
                            {hasReview(item) ? 'View Review' : 'Write Review'}
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Footer */}
              <div className="flex flex-col gap-2.5 border-t border-dark/10 bg-cream/60 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-3.5">
                <p className="text-xs text-dark-muted sm:text-sm">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  <span className="mx-2 text-dark/20">|</span>
                  Total{' '}
                  <span className="font-bold text-dark">Tk {order.total}</span>
                </p>
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  {order.status !== 'cancelled' && (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/dashboard/my-orders/${order.id}#issue`)
                      }
                      className="inline-flex items-center justify-center gap-1.5 rounded-md border border-red-300 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 sm:px-4 sm:text-sm"
                    >
                      <FiAlertCircle /> Submit Issue
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate(`/dashboard/my-orders/${order.id}`)}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-md border border-dark/15 bg-white px-3 py-2 text-xs font-semibold text-dark transition hover:bg-cream sm:px-4 sm:text-sm ${
                      order.status === 'cancelled' ? 'col-span-2' : ''
                    }`}
                  >
                    <FiTruck /> Track Order
                  </button>
                </div>
              </div>
            </article>
          );
        })}

        {visible.length === 0 && (
          <div className="rounded-xl border border-dashed border-dark/20 bg-white px-4 py-10 text-center sm:rounded-2xl sm:py-16">
            <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-cream text-lg text-dark-muted sm:h-12 sm:w-12 sm:text-xl">
              <FiSearch aria-hidden="true" />
            </span>
            <p className="mt-3 text-sm font-semibold text-dark sm:text-base">
              No orders found
            </p>
            <p className="mt-0.5 text-xs text-dark-muted sm:text-sm">
              {mine.length
                ? 'Try a different search or status.'
                : 'Your orders will appear here.'}
            </p>
          </div>
        )}
      </div>
    </>
  );
}

export default MyOrders;
