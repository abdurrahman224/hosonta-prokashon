import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  FiFileText,
  FiMinus,
  FiPlus,
  FiPrinter,
  FiSearch,
  FiShoppingBag,
  FiTrash2,
  FiX,
} from 'react-icons/fi';
import PageHeader from '../../../components/dashboard/PageHeader';
import { useAuth } from '../../../context/useAuth';
import { useData } from '../../../context/useData';
import { formatCurrency } from '../../../utils/format';

const PRESET_COMMISSIONS = [0, 20, 25, 30, 35, 40, 45];
const FREQUENT_SHOPS = [
  'বাতিঘর বুকশপ',
  'বুক পয়েন্ট, বাংলাবাজার',
  'আজিজ সুপার বুক কর্নার',
  'বিদ্যা নিকেতন লাইব্রেরি',
  'পাঠক সমাবেশ',
  'খুচরা সাধারণ ক্রেতা',
];

export default function CounterOrders() {
  const { currentUser } = useAuth();
  const { books, orders, createOrder } = useData();

  // Tab State: 'new' = New Sale POS, 'history' = Sales Archive
  const [activeTab, setActiveTab] = useState('new');

  // New Sale Form State
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [representative, setRepresentative] = useState('');
  const [address, setAddress] = useState('');
  const [commission, setCommission] = useState(35);
  const [customCommission, setCustomCommission] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [amountPaidInput, setAmountPaidInput] = useState('');
  const [notes, setNotes] = useState('');

  // Cart / Items State
  const [cartItems, setCartItems] = useState([]);
  const [bookSearchQuery, setBookSearchQuery] = useState('');

  // Active Memo / Invoice to View & Print
  const [activeInvoice, setActiveInvoice] = useState(null);

  // History Filters
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('all');
  const [historyDateFilter, setHistoryDateFilter] = useState('all');

  // Available Published Books
  const availableBooks = useMemo(() => {
    return books.filter(b => b.status === 'published' || b.stock > 0);
  }, [books]);

  // Filtered Books for POS search
  const searchedBooks = useMemo(() => {
    const q = bookSearchQuery.trim().toLowerCase();
    if (!q) return availableBooks.slice(0, 10);
    return availableBooks
      .filter(
        b =>
          b.title?.toLowerCase().includes(q) ||
          b.author?.toLowerCase().includes(q) ||
          String(b.id).includes(q),
      )
      .slice(0, 15);
  }, [availableBooks, bookSearchQuery]);

  // Effective commission rate
  const effectiveCommission = useMemo(() => {
    if (customCommission !== '') {
      const parsed = parseFloat(customCommission);
      return isNaN(parsed) ? 0 : Math.max(0, Math.min(100, parsed));
    }
    return commission;
  }, [commission, customCommission]);

  // Calculations for current cart
  const subtotal = useMemo(() => {
    return cartItems.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0,
    );
  }, [cartItems]);

  const totalCopies = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + Number(item.quantity), 0);
  }, [cartItems]);

  const commissionAmount = useMemo(() => {
    return Math.round((subtotal * effectiveCommission) / 100);
  }, [subtotal, effectiveCommission]);

  const netPayable = useMemo(() => {
    return Math.max(0, subtotal - commissionAmount);
  }, [subtotal, commissionAmount]);

  const paidAmount = useMemo(() => {
    if (amountPaidInput === '') {
      return paymentStatus === 'paid' ? netPayable : 0;
    }
    const val = parseFloat(amountPaidInput);
    return isNaN(val) ? 0 : val;
  }, [amountPaidInput, paymentStatus, netPayable]);

  const dueAmount = useMemo(() => {
    return Math.max(0, netPayable - paidAmount);
  }, [netPayable, paidAmount]);

  const changeReturn = useMemo(() => {
    return Math.max(0, paidAmount - netPayable);
  }, [paidAmount, netPayable]);

  // Filter counter orders for History tab
  const counterOrders = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return orders
      .filter(o => o.orderType === 'counter' || o.shopName)
      .filter(o => {
        if (!historySearch.trim()) return true;
        const q = historySearch.toLowerCase();
        return (
          o.id?.toLowerCase().includes(q) ||
          o.shopName?.toLowerCase().includes(q) ||
          o.customerName?.toLowerCase().includes(q) ||
          o.phone?.includes(q)
        );
      })
      .filter(o => {
        if (historyStatusFilter === 'all') return true;
        return o.paymentStatus === historyStatusFilter;
      })
      .filter(o => {
        if (historyDateFilter === 'all') return true;
        if (historyDateFilter === 'today') return o.date === todayStr;
        if (historyDateFilter === 'week') {
          const age = (Date.now() - new Date(o.date).getTime()) / 86400000;
          return age <= 7;
        }
        return true;
      });
  }, [orders, historySearch, historyStatusFilter, historyDateFilter]);

  // Summary Metrics for Counter Sales
  const metrics = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayCounter = orders.filter(
      o => (o.orderType === 'counter' || o.shopName) && o.date === todayStr,
    );
    const todaySales = todayCounter.reduce(
      (sum, o) => sum + Number(o.total || 0),
      0,
    );
    const todayGross = todayCounter.reduce(
      (sum, o) => sum + Number(o.subtotal || o.total || 0),
      0,
    );
    const allCounter = orders.filter(
      o => o.orderType === 'counter' || o.shopName,
    );
    const allTotal = allCounter.reduce(
      (sum, o) => sum + Number(o.total || 0),
      0,
    );

    return {
      todayCount: todayCounter.length,
      todaySales,
      todayGross,
      totalCount: allCounter.length,
      allTotal,
    };
  }, [orders]);

  // Add Item to Cart
  const handleAddToCart = book => {
    if (!book) return;
    const existing = cartItems.find(
      item => String(item.bookId) === String(book.id),
    );
    const currentQtyInCart = existing ? existing.quantity : 0;
    const availableStock = Number(book.stock || 0);

    if (currentQtyInCart + 1 > availableStock) {
      toast.error(
        `"${book.title}" has insufficient stock (available: ${availableStock} copies)`,
      );
      return;
    }

    const unitPrice = Number(book.price || book.offerPrice || 0);

    if (existing) {
      setCartItems(
        cartItems.map(item =>
          String(item.bookId) === String(book.id)
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      setCartItems([
        ...cartItems,
        {
          bookId: book.id,
          title: book.title,
          author: book.author || 'Unknown Author',
          price: unitPrice,
          quantity: 1,
          stock: availableStock,
        },
      ]);
    }
    toast.success(`"${book.title}" added to the order`);
  };

  // Update item quantity
  const handleUpdateQuantity = (bookId, delta) => {
    setCartItems(
      cartItems
        .map(item => {
          if (String(item.bookId) === String(bookId)) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            if (nextQty > item.stock) {
              toast.error(`Maximum available stock: ${item.stock} copies`);
              return item;
            }
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter(Boolean),
    );
  };

  // Remove Item
  const handleRemoveItem = bookId => {
    setCartItems(
      cartItems.filter(item => String(item.bookId) !== String(bookId)),
    );
  };

  // Reset form
  const handleResetForm = () => {
    setShopName('');
    setPhone('');
    setRepresentative('');
    setAddress('');
    setCommission(35);
    setCustomCommission('');
    setPaymentMethod('cash');
    setPaymentStatus('paid');
    setAmountPaidInput('');
    setNotes('');
    setCartItems([]);
  };

  // Complete Order
  const handleSubmitCounterOrder = e => {
    e.preventDefault();
    if (!shopName.trim()) {
      toast.error('Please enter the shop name');
      return;
    }
    if (!phone.trim()) {
      toast.error('Please enter the phone number');
      return;
    }
    if (cartItems.length === 0) {
      toast.error('Add at least one book to the order');
      return;
    }

    const orderData = {
      orderType: 'counter',
      shopName: shopName.trim(),
      customerName: representative.trim()
        ? `${shopName.trim()} (${representative.trim()})`
        : shopName.trim(),
      representative: representative.trim(),
      phone: phone.trim(),
      address: address.trim() || 'Showroom Counter',
      commission: effectiveCommission,
      commissionAmount,
      subtotal,
      total: netPayable,
      amountPaid: paidAmount,
      dueAmount,
      paymentMethod,
      paymentStatus:
        dueAmount > 0 ? (paidAmount > 0 ? 'partial' : 'due') : 'paid',
      status: 'delivered', // Counter orders are handed over immediately
      notes: notes.trim(),
      servedBy: currentUser?.name || 'Counter Executive',
      items: cartItems.map(item => ({
        bookId: item.bookId,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
      })),
    };

    const res = createOrder(orderData);
    if (res.success) {
      toast.success('Counter order completed successfully!');
      setActiveInvoice(res.order);
      handleResetForm();
    } else {
      toast.error(res.message || 'Could not complete the order');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Counter Sales & POS"
          description="Manage shop sales, wholesale commissions and cash memos."
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('new')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === 'new'
                ? 'bg-primary text-dark shadow-sm'
                : 'border border-dark/15 bg-white text-dark hover:bg-cream'
            }`}
          >
            <FiPlus />
            <span>New Counter Order</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === 'history'
                ? 'bg-primary text-dark shadow-sm'
                : 'border border-dark/15 bg-white text-dark hover:bg-cream'
            }`}
          >
            <FiFileText />
            <span>Invoice & Memo History ({metrics.totalCount})</span>
          </button>
        </div>
      </div>

      {/* Mini Performance Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-dark/10 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-dark-muted">
            Today's Counter Sales
          </p>
          <div className="mt-1 flex items-baseline justify-between">
            <h3 className="font-heading text-2xl font-bold text-dark">
              {formatCurrency(metrics.todaySales)}
            </h3>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
              {metrics.todayCount} sales
            </span>
          </div>
          <p className="mt-1 text-xs text-dark-muted">
            Gross value: {formatCurrency(metrics.todayGross)}
          </p>
        </div>

        <div className="rounded-xl border border-dark/10 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-dark-muted">
            Today's Commission
          </p>
          <div className="mt-1 flex items-baseline justify-between">
            <h3 className="font-heading text-2xl font-bold text-amber-600">
              {formatCurrency(metrics.todayGross - metrics.todaySales)}
            </h3>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
              Discount
            </span>
          </div>
          <p className="mt-1 text-xs text-dark-muted">Wholesale & showroom discount</p>
        </div>

        <div className="rounded-xl border border-dark/10 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-dark-muted">
            Total Counter Memos
          </p>
          <div className="mt-1 flex items-baseline justify-between">
            <h3 className="font-heading text-2xl font-bold text-dark">
              {metrics.totalCount}
            </h3>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800">
              Lifetime
            </span>
          </div>
          <p className="mt-1 text-xs text-dark-muted">
            Total sales: {formatCurrency(metrics.allTotal)}
          </p>
        </div>

        <div className="rounded-xl border border-dark/10 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-dark-muted">
            Counter Operator
          </p>
          <div className="mt-1 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 font-bold text-dark">
              {currentUser?.name ? currentUser.name.charAt(0) : 'E'}
            </div>
            <div>
              <p className="text-sm font-bold text-dark leading-tight">
                {currentUser?.name || 'Employee'}
              </p>
              <p className="text-[11px] text-dark-muted">Sales desk active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'new' ? (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Column: Form & Book Selector (7 cols) */}
          <div className="space-y-6 lg:col-span-7">
            {/* Customer / Shop Information Card */}
            <div className="rounded-2xl border border-dark/10 bg-white p-5 shadow-xs sm:p-6">
              <div className="mb-4 flex items-center justify-between border-b border-dark/10 pb-3">
                <h2 className="font-heading text-lg font-bold text-dark">
                  1. Shop & Customer Information
                </h2>
                <span className="text-xs text-dark-muted">
                  * Required fields
                </span>
              </div>

              {/* Quick shop suggestions */}
              <div className="mb-4">
                <p className="mb-1.5 text-xs font-semibold text-dark-muted">
                  Frequent shops (quick select):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {FREQUENT_SHOPS.map(shop => (
                    <button
                      key={shop}
                      type="button"
                      onClick={() => setShopName(shop)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                        shopName === shop
                          ? 'bg-primary font-bold text-dark'
                          : 'bg-cream text-dark hover:bg-dark/10'
                      }`}
                    >
                      {shop}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-dark">
                    Shop Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={e => setShopName(e.target.value)}
                    placeholder="Enter shop or library name..."
                    className="mt-1 w-full rounded-xl border border-dark/15 bg-white px-3.5 py-2.5 text-sm text-dark placeholder:text-dark-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-dark">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="Example: 01711123456"
                    className="mt-1 w-full rounded-xl border border-dark/15 bg-white px-3.5 py-2.5 text-sm text-dark placeholder:text-dark-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-dark">
                    Representative / Owner Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={representative}
                    onChange={e => setRepresentative(e.target.value)}
                    placeholder="Example: Abdul Hamid / Sales Representative"
                    className="mt-1 w-full rounded-xl border border-dark/15 bg-white px-3.5 py-2.5 text-sm text-dark placeholder:text-dark-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-dark">
                    Shop Address / District (Optional)
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Example: Banglabazar, Dhaka"
                    className="mt-1 w-full rounded-xl border border-dark/15 bg-white px-3.5 py-2.5 text-sm text-dark placeholder:text-dark-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            {/* Commission Settings Card */}
            <div className="rounded-2xl border border-dark/10 bg-white p-5 shadow-xs sm:p-6">
              <div className="mb-3 flex items-center justify-between border-b border-dark/10 pb-3">
                <div>
                  <h2 className="font-heading text-lg font-bold text-dark">
                    2. Set Commission Rate
                  </h2>
                  <p className="text-xs text-dark-muted">
                    Commission applicable to wholesale and showroom sales (%)
                  </p>
                </div>
                <span className="rounded-xl bg-amber-100 px-3 py-1 font-heading text-sm font-bold text-amber-900">
                  Current Commission: {effectiveCommission}%
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {PRESET_COMMISSIONS.map(pct => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => {
                      setCommission(pct);
                      setCustomCommission('');
                    }}
                    className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                      effectiveCommission === pct && customCommission === ''
                        ? 'bg-primary text-dark shadow-xs'
                        : 'border border-dark/15 bg-cream/70 text-dark hover:bg-cream'
                    }`}
                  >
                    {pct === 0 ? '0% (Retail)' : `${pct}%`}
                  </button>
                ))}

                <div className="flex items-center gap-1.5 pl-2">
                  <span className="text-xs font-medium text-dark-muted">
                    Or custom:
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={customCommission}
                    onChange={e => setCustomCommission(e.target.value)}
                    placeholder="%"
                    className="w-16 rounded-lg border border-dark/20 bg-white px-2 py-1.5 text-center text-xs font-bold text-dark focus:border-primary focus:outline-none"
                  />
                  <span className="text-xs text-dark-muted">%</span>
                </div>
              </div>
            </div>

            {/* Book Selection & Dynamic Search */}
            <div className="rounded-2xl border border-dark/10 bg-white p-5 shadow-xs sm:p-6">
              <div className="mb-4 flex items-center justify-between border-b border-dark/10 pb-3">
                <div>
                  <h2 className="font-heading text-lg font-bold text-dark">
                    3. Select Books
                  </h2>
                  <p className="text-xs text-dark-muted">
                    Search by book title or author and add to the order
                  </p>
                </div>
                <span className="text-xs font-semibold text-primary-hover">
                  Total catalog: {availableBooks.length} books
                </span>
              </div>

              {/* Book search input */}
              <div className="relative mb-4">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark/40" />
                <input
                  type="text"
                  value={bookSearchQuery}
                  onChange={e => setBookSearchQuery(e.target.value)}
                  placeholder="Search by book title or author..."
                  className="w-full rounded-xl border border-dark/15 bg-cream/40 py-2.5 pl-10 pr-4 text-sm text-dark placeholder:text-dark-muted/60 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {bookSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setBookSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark/40 hover:text-dark"
                  >
                    <FiX />
                  </button>
                )}
              </div>

              {/* Books List to Pick */}
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
                {searchedBooks.map(book => {
                  const inCart = cartItems.find(
                    item => String(item.bookId) === String(book.id),
                  );
                  const isOutOfStock = Number(book.stock || 0) <= 0;

                  return (
                    <div
                      key={book.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-dark/5 bg-cream/30 p-2.5 transition hover:border-primary/50 hover:bg-cream/70"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {book.cover ? (
                          <img
                            src={book.cover}
                            alt={book.title}
                            className="h-12 w-9 rounded-md object-cover shadow-2xs"
                          />
                        ) : (
                          <div className="flex h-12 w-9 items-center justify-center rounded-md bg-dark/10 text-xs font-bold text-dark/60">
                            Book
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-dark">
                            {book.title}
                          </p>
                          <p className="truncate text-xs text-dark-muted">
                            {book.author || 'Author'}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2 text-xs">
                            <span className="font-semibold text-emerald-700">
                              Gross Price:{' '}
                              {formatCurrency(
                                book.price || book.offerPrice || 0,
                              )}
                            </span>
                            <span
                              className={`rounded px-1.5 py-0.2 text-[10px] font-semibold ${
                                isOutOfStock
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              Stock: {book.stock || 0} copies
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {inCart && (
                          <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-bold text-dark">
                            In Order: {inCart.quantity}
                          </span>
                        )}
                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => handleAddToCart(book)}
                          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                            isOutOfStock
                              ? 'cursor-not-allowed bg-dark/10 text-dark-muted'
                              : 'bg-primary text-dark hover:bg-primary-hover shadow-2xs'
                          }`}
                        >
                          <FiPlus />
                          <span>{inCart ? 'Add More' : 'Add'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Books in Cart */}
            <div className="rounded-2xl border border-dark/10 bg-white p-5 shadow-xs sm:p-6">
              <div className="mb-4 flex items-center justify-between border-b border-dark/10 pb-3">
                <div>
                  <h2 className="font-heading text-lg font-bold text-dark">
                    4. Order Items ({cartItems.length} items,{' '}
                    {totalCopies} copies)
                  </h2>
                </div>
                {cartItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCartItems([])}
                    className="text-xs font-semibold text-rose-600 hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {cartItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-dark/20 p-8 text-center">
                  <FiShoppingBag className="mx-auto text-3xl text-dark-muted" />
                  <p className="mt-2 text-sm font-semibold text-dark">
                    No books selected yet
                  </p>
                  <p className="mt-1 text-xs text-dark-muted">
                    Search the list above and click &quot;Add&quot;
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-dark/10 text-xs font-bold text-dark-muted">
                        <th className="pb-2.5">Book Details</th>
                        <th className="pb-2.5 text-center">Unit Price</th>
                        <th className="pb-2.5 text-center">Quantity</th>
                        <th className="pb-2.5 text-right">Total (Gross)</th>
                        <th className="pb-2.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark/5">
                      {cartItems.map(item => (
                        <tr key={item.bookId} className="hover:bg-cream/40">
                          <td className="py-3">
                            <p className="font-semibold text-dark">
                              {item.title}
                            </p>
                            <p className="text-xs text-dark-muted">
                              {item.author}
                            </p>
                          </td>
                          <td className="py-3 text-center font-medium">
                            {formatCurrency(item.price)}
                          </td>
                          <td className="py-3 text-center">
                            <div className="inline-flex items-center rounded-lg border border-dark/15 bg-white">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateQuantity(item.bookId, -1)
                                }
                                className="p-1.5 text-dark-muted hover:bg-cream hover:text-dark"
                              >
                                <FiMinus size={12} />
                              </button>
                              <span className="w-8 text-center text-xs font-bold text-dark">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateQuantity(item.bookId, 1)
                                }
                                className="p-1.5 text-dark-muted hover:bg-cream hover:text-dark"
                              >
                                <FiPlus size={12} />
                              </button>
                            </div>
                          </td>
                          <td className="py-3 text-right font-bold text-dark">
                            {formatCurrency(item.price * item.quantity)}
                          </td>
                          <td className="py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.bookId)}
                              className="rounded p-1 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                              title="Remove"
                            >
                              <FiTrash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Checkout Summary & Payment (5 cols) */}
          <div className="space-y-6 lg:col-span-5">
            <div className="sticky top-6 rounded-2xl border border-dark/10 bg-white p-5 shadow-sm sm:p-6">
              <div className="border-b border-dark/10 pb-4">
                <h2 className="font-heading text-xl font-bold text-dark">
                  Billing & Payment Summary
                </h2>
                <p className="text-xs text-dark-muted">
                  Real-time invoice and cash memo calculator
                </p>
              </div>

              {/* Financial Calculation Box */}
              <div className="mt-4 space-y-3 rounded-xl bg-cream/60 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-dark-muted">Total Books:</span>
                  <span className="font-bold text-dark">{totalCopies} copies</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-dark-muted">
                    Gross Value:
                  </span>
                  <span className="font-bold text-dark">
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-dark-muted">
                    Commission Discount ({effectiveCommission}%):
                  </span>
                  <span className="font-bold text-rose-600">
                    - {formatCurrency(commissionAmount)}
                  </span>
                </div>

                <div className="border-t border-dark/10 pt-3">
                  <div className="flex items-baseline justify-between">
                    <span className="font-heading text-base font-bold text-dark">
                      Net Payable:
                    </span>
                    <span className="font-heading text-2xl font-extrabold text-primary-hover">
                      {formatCurrency(netPayable)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-dark">
                    Payment Method
                  </label>
                  <div className="mt-1.5 grid grid-cols-3 gap-2">
                    {[
                      { id: 'cash', label: 'Cash' },
                      { id: 'bkash', label: 'bKash' },
                      { id: 'nagad', label: 'Nagad' },
                      { id: 'bank', label: 'Bank' },
                      { id: 'due', label: 'Due' },
                    ].map(pm => (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(pm.id);
                          if (pm.id === 'due') {
                            setPaymentStatus('due');
                            setAmountPaidInput('0');
                          } else if (paymentStatus === 'due') {
                            setPaymentStatus('paid');
                            setAmountPaidInput('');
                          }
                        }}
                        className={`rounded-xl p-2 text-center text-xs font-semibold transition ${
                          paymentMethod === pm.id
                            ? 'bg-dark text-white'
                            : 'border border-dark/15 bg-cream/30 text-dark hover:bg-cream'
                        }`}
                      >
                        {pm.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-dark">
                      Payment Status
                    </label>
                    <select
                      value={paymentStatus}
                      onChange={e => {
                        setPaymentStatus(e.target.value);
                        if (e.target.value === 'due') setAmountPaidInput('0');
                        if (e.target.value === 'paid') setAmountPaidInput('');
                      }}
                      className="mt-1 w-full rounded-xl border border-dark/15 bg-white px-3 py-2 text-xs font-medium text-dark focus:border-primary focus:outline-none"
                    >
                      <option value="paid">Paid</option>
                      <option value="partial">Partial</option>
                      <option value="due">Due</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-dark">
                      Amount Paid (৳)
                    </label>
                    <input
                      type="number"
                      value={amountPaidInput}
                      onChange={e => setAmountPaidInput(e.target.value)}
                      placeholder={
                        paymentStatus === 'paid' ? String(netPayable) : '0'
                      }
                      className="mt-1 w-full rounded-xl border border-dark/15 bg-white px-3 py-2 text-xs font-bold text-dark focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                {/* Change or Due indicator */}
                <div className="rounded-xl border border-dark/10 bg-cream/30 p-3 text-xs">
                  {dueAmount > 0 ? (
                    <div className="flex items-center justify-between font-bold text-rose-600">
                      <span>Remaining Due:</span>
                      <span>{formatCurrency(dueAmount)}</span>
                    </div>
                  ) : changeReturn > 0 ? (
                    <div className="flex items-center justify-between font-bold text-emerald-700">
                      <span>Change to Return:</span>
                      <span>{formatCurrency(changeReturn)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between font-medium text-emerald-700">
                      <span>Payment Status:</span>
                      <span className="font-bold">Fully Paid</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-dark">
                    Invoice / Memo Note
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Example: Banglabazar invoice"
                    className="mt-1 w-full rounded-xl border border-dark/15 bg-white px-3 py-2 text-xs text-dark focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="mt-6 space-y-2">
                <button
                  type="button"
                  onClick={handleSubmitCounterOrder}
                  disabled={cartItems.length === 0}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition shadow-sm ${
                    cartItems.length === 0
                      ? 'cursor-not-allowed bg-dark/15 text-dark-muted'
                      : 'bg-primary text-dark hover:bg-primary-hover hover:shadow-md'
                  }`}
                >
                  <FiPrinter size={16} />
                  <span>Complete Order & View Memo</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetForm}
                  className="w-full rounded-xl py-2 text-xs font-semibold text-dark-muted hover:bg-cream hover:text-dark"
                >
                  Reset Form
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* History & Previous Invoices Tab */
        <div className="space-y-4 rounded-2xl border border-dark/10 bg-white p-5 shadow-xs sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-lg font-bold text-dark">
                Counter Sales History & Cash Memo
              </h2>
              <p className="text-xs text-dark-muted">
                Previous showroom and counter invoices
              </p>
            </div>

            {/* History Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark/40" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  placeholder="Search by shop or memo number..."
                  className="rounded-lg border border-dark/15 bg-cream/40 py-1.5 pl-9 pr-3 text-xs text-dark focus:border-primary focus:outline-none"
                />
              </div>

              <select
                value={historyDateFilter}
                onChange={e => setHistoryDateFilter(e.target.value)}
                className="rounded-lg border border-dark/15 bg-white py-1.5 px-3 text-xs text-dark focus:border-primary focus:outline-none"
              >
                <option value="all">All Dates</option>
                <option value="today">Today's Sales</option>
                <option value="week">Last 7 Days</option>
              </select>

              <select
                value={historyStatusFilter}
                onChange={e => setHistoryStatusFilter(e.target.value)}
                className="rounded-lg border border-dark/15 bg-white py-1.5 px-3 text-xs text-dark focus:border-primary focus:outline-none"
              >
                <option value="all">All Payment Statuses</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="due">Due</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-dark/10 text-xs font-bold text-dark-muted">
                  <th className="py-3 px-3">Memo No.</th>
                  <th className="py-3 px-3">Shop Name & Phone</th>
                  <th className="py-3 px-3">Book Quantity</th>
                  <th className="py-3 px-3">Gross Value</th>
                  <th className="py-3 px-3">Commission</th>
                  <th className="py-3 px-3">Net Total</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3 text-center">Receipt / Memo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark/5">
                {counterOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="py-8 text-center text-sm text-dark-muted"
                    >
                      No counter orders found.
                    </td>
                  </tr>
                ) : (
                  counterOrders.map(order => (
                    <tr key={order.id} className="hover:bg-cream/40">
                      <td className="py-3.5 px-3 font-semibold text-dark">
                        {order.id}
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="font-bold text-dark">
                          {order.shopName || order.customerName}
                        </p>
                        <p className="text-xs text-dark-muted">{order.phone}</p>
                      </td>
                      <td className="py-3.5 px-3 font-medium text-dark">
                        {order.items?.reduce(
                          (s, i) => s + Number(i.quantity),
                          0,
                        ) || 1}{' '}
                        copies
                      </td>
                      <td className="py-3.5 px-3 text-dark-muted">
                        {formatCurrency(order.subtotal || order.total)}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                          {order.commission || 0}%
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-dark">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            order.paymentStatus === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.paymentStatus === 'due'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {order.paymentStatus === 'paid'
                            ? 'Paid'
                            : order.paymentStatus === 'due'
                              ? 'Due'
                              : 'Partial'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-xs text-dark-muted">
                        {order.date}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setActiveInvoice(order)}
                          className="inline-flex items-center gap-1 rounded-lg border border-dark/15 bg-white px-2.5 py-1 text-xs font-semibold text-dark transition hover:bg-primary hover:text-dark"
                        >
                          <FiPrinter size={13} />
                          <span>View Memo</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cash Memo & Invoice Modal */}
      {activeInvoice && (
        <CashMemoModal
          order={activeInvoice}
          onClose={() => setActiveInvoice(null)}
        />
      )}
    </div>
  );
}

// Cash Memo Modal Component
function CashMemoModal({ order, onClose }) {
  const items = order.items || [];
  const subtotal =
    order.subtotal ||
    items.reduce((s, i) => s + Number(i.price * i.quantity), 0);
  const commission = order.commission || 0;
  const commissionDeduction =
    order.commissionAmount || Math.round((subtotal * commission) / 100);
  const total = order.total || subtotal - commissionDeduction;
  const paid = order.amountPaid !== undefined ? order.amountPaid : total;
  const due =
    order.dueAmount !== undefined ? order.dueAmount : Math.max(0, total - paid);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-dark/70 p-4 backdrop-blur-xs print:static print:p-0 print:bg-white">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl print:max-h-none print:w-full print:shadow-none print:rounded-none">
        {/* Actions Bar (hidden on print) */}
        <div className="flex items-center justify-between border-b border-dark/10 p-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <h3 className="font-heading text-lg font-bold text-dark">
              Counter Cash Memo / Invoice
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-dark transition hover:bg-primary-hover shadow-xs"
            >
              <FiPrinter />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-dark-muted hover:bg-cream"
              aria-label="Close"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* Printable Memo Content */}
        <div className="p-6 md:p-8 print:p-4">
          {/* Memo Header */}
          <div className="border-b-2 border-dark pb-4 text-center">
            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-dark">
              Hosonta Prokashon
            </h1>
            <p className="text-xs text-dark-muted mt-0.5">
              Quality Book Publishing & Distribution
            </p>
            <p className="text-[11px] text-dark-muted">
              Banglabazar / Dhaka, Bangladesh • Phone: +8801711-000001 • Email:
              info@hosontoprokashon.com
            </p>
            <div className="mt-2 inline-block rounded-md bg-dark px-4 py-1 text-xs font-bold uppercase tracking-wider text-white">
              Counter Cash Memo / Wholesale Invoice
            </div>
          </div>

          {/* Invoice Meta Grid */}
          <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl bg-cream/40 p-4 text-xs">
            <div>
              <p>
                <strong className="text-dark">Shop / Customer:</strong>{' '}
                <span className="font-semibold text-dark">
                  {order.shopName || order.customerName}
                </span>
              </p>
              {order.representative && (
                <p className="mt-1">
                  <strong>Representative:</strong> {order.representative}
                </p>
              )}
              <p className="mt-1">
                <strong>Phone:</strong> {order.phone}
              </p>
              <p className="mt-1">
                <strong>Address:</strong> {order.address || 'Showroom Counter'}
              </p>
            </div>
            <div className="text-right">
              <p>
                <strong className="text-dark">Memo No:</strong>{' '}
                <span className="font-bold text-dark">{order.id}</span>
              </p>
              <p className="mt-1">
                <strong>Date:</strong> {order.date}
              </p>
              <p className="mt-1">
                <strong>Payment Method:</strong>{' '}
                {order.paymentMethod === 'cash'
                  ? 'Cash'
                  : order.paymentMethod === 'bkash'
                    ? 'bKash'
                    : order.paymentMethod === 'nagad'
                      ? 'Nagad'
                      : order.paymentMethod === 'bank'
                        ? 'Bank'
                        : 'Due'}
              </p>
              <p className="mt-1">
                <strong>Served By:</strong> {order.servedBy || 'Counter Staff'}
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-y border-dark/20 bg-cream/70 font-bold text-dark">
                  <th className="py-2 px-2 text-center w-8">#</th>
                  <th className="py-2 px-2">Book Title</th>
                  <th className="py-2 px-2 text-center">Quantity</th>
                  <th className="py-2 px-2 text-right">Unit Price</th>
                  <th className="py-2 px-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark/10">
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className="py-2.5 px-2 text-center font-medium text-dark-muted">
                      {index + 1}
                    </td>
                    <td className="py-2.5 px-2 font-semibold text-dark">
                      {item.title}
                    </td>
                    <td className="py-2.5 px-2 text-center font-bold text-dark">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 px-2 text-right text-dark-muted">
                      ৳{item.price}
                    </td>
                    <td className="py-2.5 px-2 text-right font-bold text-dark">
                      ৳{Number(item.price) * Number(item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="mt-4 border-t border-dark/20 pt-3">
            <div className="flex justify-end">
              <div className="w-64 space-y-1.5 text-xs">
                <div className="flex justify-between text-dark-muted">
                  <span>Gross Value:</span>
                  <span className="font-semibold text-dark">৳{subtotal}</span>
                </div>
                <div className="flex justify-between text-dark-muted">
                  <span>Commission Discount ({commission}%):</span>
                  <span className="font-semibold text-rose-600">
                    - ৳{commissionDeduction}
                  </span>
                </div>
                <div className="flex justify-between border-t border-dark/20 pt-1.5 font-bold text-sm text-dark">
                  <span>Final Net Total:</span>
                  <span className="text-primary-hover">৳{total}</span>
                </div>
                <div className="flex justify-between text-dark-muted">
                  <span>Paid Amount:</span>
                  <span className="font-semibold text-emerald-700">
                    ৳{paid}
                  </span>
                </div>
                {due > 0 && (
                  <div className="flex justify-between font-bold text-rose-600">
                    <span>Due Amount:</span>
                    <span>৳{due}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {order.notes && (
            <div className="mt-4 rounded-lg bg-cream/30 p-2.5 text-xs text-dark-muted">
              <strong>Note:</strong> {order.notes}
            </div>
          )}

          {/* Signatures */}
          <div className="mt-14 grid grid-cols-2 gap-8 text-center text-xs text-dark-muted">
            <div>
              <div className="mx-auto w-36 border-t border-dashed border-dark/40 pt-1">
                Customer / Representative Signature
              </div>
            </div>
            <div>
              <div className="mx-auto w-36 border-t border-dashed border-dark/40 pt-1">
                Approved by Hosonta Prokashon
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <p className="mt-8 text-center text-[10px] text-dark-muted">
            Thank you for choosing Hosonta Prokashon. Sold books are not returnable;
            defective items may be exchanged.
          </p>
        </div>
      </div>
    </div>
  );
}
