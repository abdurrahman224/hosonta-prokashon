import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiCalendar,
  FiCheck,
  FiChevronUp,
  FiDownload,
  FiMail,
  FiMapPin,
  FiMinus,
  FiPhone,
  FiPlus,
  FiPrinter,
  FiRotateCcw,
  FiSave,
  FiSearch,
  FiShoppingBag,
  FiTrash2,
  FiUser,
  FiUserCheck,
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../../context/useAuth';
import { useData } from '../../../../context/useData';
import { formatCurrency } from '../../../../utils/format';
import { FREQUENT_SHOPS, PRESET_COMMISSIONS } from './dummyData';
import CashMemoModal from './CashMemoModal';
import {
  PAYMENT_METHODS,
  PUBLISHER,
  buildInvoiceHtml,
  paymentLabel,
} from './invoiceUtils';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
const normalizeDigits = str =>
  String(str || '').replace(/[০-৯]/g, d => String(BN_DIGITS.indexOf(d)));
const normalizePhone = str => normalizeDigits(str).replace(/\D/g, '');
const todayLocal = () => new Date().toLocaleDateString('en-CA');
const round2 = n => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const clampPct = n => Math.max(0, Math.min(100, Number.isFinite(n) ? n : 0));
const toNum = raw => {
  const v = parseFloat(normalizeDigits(raw));
  return Number.isFinite(v) ? v : 0;
};
const DRAFT_KEY = 'counterOrderDraft';
let paymentSeq = 1;
const newPayment = (method = 'cash') => ({
  id: paymentSeq++,
  method,
  amount: '',
  txnId: '',
});

/* ------------------------------------------------------------------ */
/* Small UI pieces (outside the page so inputs never remount)          */
/* ------------------------------------------------------------------ */
const inputCls =
  'h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm leading-[1.65] text-gray-800 shadow-xs placeholder:text-gray-400 focus:border-[#465fff] focus:outline-none focus-visible:outline-none';
const iconInputCls = `${inputCls} pl-11`;
const cellInputCls =
  'h-9 w-full rounded-lg border border-gray-300 bg-white px-2.5 text-sm text-gray-800 focus:border-[#465fff] focus:outline-none focus-visible:outline-none';
const labelCls = 'mb-1.5 block text-sm font-medium text-gray-700';
const cardCls = 'rounded-2xl border border-gray-200 bg-white';
const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-[#465fff] px-5 py-3 text-sm font-medium text-white shadow-xs transition hover:bg-[#3641f5] disabled:cursor-not-allowed disabled:bg-[#465fff]/40';
const btnOutline =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-xs transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50';

function IconField({ icon: Icon, children }) {
  return (
    <div className="relative">
      <Icon
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        size={16}
      />
      {children}
    </div>
  );
}

function CardHeader({ title, desc, right }) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 py-4 sm:px-6 sm:py-5">
      <div>
        <h3 className="text-base font-medium text-gray-800">{title}</h3>
        {desc && <p className="mt-0.5 text-sm text-gray-500">{desc}</p>}
      </div>
      {right}
    </div>
  );
}

function Kbd({ children }) {
  return (
    <kbd className="rounded border border-gray-300 bg-gray-50 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
      {children}
    </kbd>
  );
}

function SumRow({ label, value, tone, strong }) {
  const toneCls =
    tone === 'minus'
      ? 'text-[#d92d20]'
      : tone === 'plus'
        ? 'text-gray-800'
        : 'text-gray-600';
  return (
    <div
      className={`flex items-center justify-between gap-3 py-1.5 text-sm ${
        strong ? 'font-semibold text-gray-900' : toneCls
      }`}
    >
      <span>{label}</span>
      <span className={strong ? 'text-base' : 'font-medium'}>{value}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function CounterOrderEntry() {
  const { currentUser } = useAuth();
  const { books, createOrder, orders = [], customers = [] } = useData();

  // Retailer
  const [phone, setPhone] = useState('');
  const [shopName, setShopName] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [representative, setRepresentative] = useState('');
  const [salesRep, setSalesRep] = useState('');
  const [orderDate, setOrderDate] = useState(todayLocal());
  const [retailer, setRetailer] = useState(null); // matched saved retailer
  const [suggestOpen, setSuggestOpen] = useState(null); // 'phone' | 'shop' | null

  // Commission / discount / payment
  const [commissionInput, setCommissionInput] = useState('35');
  const [orderDiscountInput, setOrderDiscountInput] = useState('');
  const [previousDueInput, setPreviousDueInput] = useState('');
  const [payments, setPayments] = useState(() => [newPayment('cash')]);
  const [paymentDate, setPaymentDate] = useState(todayLocal());
  const [paymentRef, setPaymentRef] = useState('');
  const [notes, setNotes] = useState('');

  // Books
  const [cartItems, setCartItems] = useState([]);
  const [bookQuery, setBookQuery] = useState('');
  const [bookOpen, setBookOpen] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState(null);

  // UI
  const [completedOrder, setCompletedOrder] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hasDraft, setHasDraft] = useState(() => {
    try {
      return Boolean(localStorage.getItem(DRAFT_KEY));
    } catch {
      return false;
    }
  });

  const customerBoxRef = useRef(null);
  const bookBoxRef = useRef(null);
  const phoneInputRef = useRef(null);
  const bookInputRef = useRef(null);
  const paidInputRef = useRef(null);
  const composingRef = useRef(false);
  const submittingRef = useRef(false);
  const shortcutRef = useRef(null);

  /* ----- Bengali IME-safe inputs ----- */
  const onCompStart = () => {
    composingRef.current = true;
  };
  const onCompEnd = (event, setValue) => {
    composingRef.current = false;
    setValue(event.currentTarget.value);
  };
  const onTextChange = (event, setValue) => {
    if (event.nativeEvent?.isComposing || composingRef.current) return;
    setValue(event.target.value);
  };

  useEffect(() => {
    const close = e => {
      if (customerBoxRef.current && !customerBoxRef.current.contains(e.target))
        setSuggestOpen(null);
      if (bookBoxRef.current && !bookBoxRef.current.contains(e.target))
        setBookOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  /* ----- retailer directory (saved customers + past counter orders) ----- */
  const directory = useMemo(() => {
    const map = new Map();
    const push = c => {
      const name = (c.shopName || c.name || '').trim();
      const ph = normalizePhone(c.phone);
      if (!name && !ph) return;
      const key = ph || `name:${name.toLowerCase()}`; // phone = unique key, no duplicates
      const prev = map.get(key) || {};
      map.set(key, {
        shopName: name || prev.shopName || '',
        phone: c.phone || prev.phone || '',
        address: c.address || prev.address || '',
        email: c.email || prev.email || '',
        representative: c.representative || prev.representative || '',
        commission: c.commission ?? c.defaultCommission ?? prev.commission,
        creditLimit: c.creditLimit ?? prev.creditLimit,
      });
    };
    FREQUENT_SHOPS.forEach(s => push({ shopName: s }));
    customers.forEach(push);
    orders.filter(o => o.orderType === 'counter').forEach(push);
    return [...map.values()];
  }, [customers, orders]);

  const customerSuggestions = useMemo(() => {
    const q =
      suggestOpen === 'phone'
        ? normalizePhone(phone)
        : shopName.trim().toLowerCase();
    if (!q) return directory.slice(0, 6);
    return directory
      .filter(c =>
        suggestOpen === 'phone'
          ? normalizePhone(c.phone).includes(q)
          : c.shopName.toLowerCase().includes(q) ||
            normalizePhone(c.phone).includes(normalizePhone(q)),
      )
      .slice(0, 6);
  }, [directory, phone, shopName, suggestOpen]);

  const applyRetailer = c => {
    setShopName(c.shopName || '');
    setPhone(c.phone || '');
    setAddress(c.address || '');
    setEmail(c.email || '');
    setRepresentative(c.representative || '');
    if (c.commission != null && c.commission !== '')
      setCommissionInput(String(c.commission));
    setRetailer(c);
    setPreviousDueInput('');
    setSuggestOpen(null);
  };

  const handlePhoneChange = value => {
    setPhone(value);
    setRetailer(null);
    const n = normalizePhone(value);
    if (n.length >= 11) {
      const hit = directory.find(c => normalizePhone(c.phone) === n);
      if (hit) {
        applyRetailer({ ...hit, phone: value });
        toast.success(`Retailer found: "${hit.shopName}"`);
      }
    }
  };

  const isNewRetailer =
    !retailer &&
    normalizePhone(phone).length >= 11 &&
    !directory.some(c => normalizePhone(c.phone) === normalizePhone(phone));

  /* ----- commission priority: book override > retailer default > global ----- */
  const globalCommission = useMemo(
    () => clampPct(toNum(commissionInput)),
    [commissionInput],
  );
  const defaultCommission =
    retailer?.commission != null && retailer.commission !== ''
      ? clampPct(Number(retailer.commission))
      : globalCommission;

  /* ----- order lines & live bill ----- */
  const lines = useMemo(
    () =>
      cartItems.map(item => {
        const price = Number(item.price) || 0;
        const qty = Number(item.quantity) || 0;
        const custom = item.commission !== null;
        const pct = custom ? clampPct(item.commission) : defaultCommission;
        const gross = round2(price * qty);
        const commissionAmt = round2((gross * pct) / 100);
        const discount = Math.min(
          round2(gross - commissionAmt),
          Math.max(0, Number(item.discount) || 0),
        );
        const lineTotal = round2(gross - commissionAmt - discount);
        const netPrice =
          qty > 0 ? round2(lineTotal / qty) : round2(price * (1 - pct / 100));
        return {
          ...item,
          price,
          qty,
          pct,
          custom,
          gross,
          commissionAmt,
          discount,
          lineTotal,
          netPrice,
        };
      }),
    [cartItems, defaultCommission],
  );

  const totals = useMemo(() => {
    const copies = lines.reduce((s, l) => s + l.qty, 0);
    const gross = round2(lines.reduce((s, l) => s + l.gross, 0));
    const commissionAmount = round2(
      lines.reduce((s, l) => s + l.commissionAmt, 0),
    );
    const itemDiscount = round2(lines.reduce((s, l) => s + l.discount, 0));
    const afterItems = round2(gross - commissionAmount - itemDiscount);
    const orderDiscount = Math.min(
      afterItems,
      Math.max(0, toNum(orderDiscountInput)),
    );
    const netBill = round2(Math.max(0, afterItems - orderDiscount));
    return {
      copies,
      gross,
      commissionAmount,
      itemDiscount,
      afterItems,
      orderDiscount,
      netBill,
    };
  }, [lines, orderDiscountInput]);

  const { netBill } = totals;

  const previousDueAuto = useMemo(() => {
    const n = normalizePhone(phone);
    if (n.length < 11) return 0;
    return orders
      .filter(o => o.orderType === 'counter' && normalizePhone(o.phone) === n)
      .reduce((sum, o) => sum + Number(o.dueAmount || 0), 0);
  }, [orders, phone]);
  const previousDue =
    previousDueInput === ''
      ? previousDueAuto
      : Math.max(0, toNum(previousDueInput));

  const totalPayable = round2(previousDue + netBill);

  // Untouched payment rows = full payment of this bill (same as before)
  const paymentsTouched = payments.some(p => p.amount !== '');
  const paidAmount = paymentsTouched
    ? round2(payments.reduce((s, p) => s + Math.max(0, toNum(p.amount)), 0))
    : netBill;
  const dueAmount = round2(Math.max(0, netBill - paidAmount)); // this order's own due
  const totalDue = round2(Math.max(0, totalPayable - paidAmount)); // incl. previous due
  const paymentStatus =
    dueAmount > 0 ? (paidAmount > 0 ? 'partial' : 'due') : 'paid';

  const creditLimit = Number(retailer?.creditLimit) || 0;
  const availableCredit = creditLimit
    ? Math.max(0, creditLimit - previousDue)
    : null;
  const overCredit = creditLimit > 0 && totalDue > creditLimit;

  const usedMethods = [
    ...new Set(
      (paymentsTouched
        ? payments.filter(p => toNum(p.amount) > 0)
        : payments
      ).map(p => paymentLabel(p.method)),
    ),
  ].join(' + ');

  const orderNumber = useMemo(
    () =>
      `CO-${String(orders.filter(o => o.orderType === 'counter').length + 1).padStart(4, '0')}`,
    [orders],
  );

  /* ----- payments ----- */
  const patchPayment = (id, patch) =>
    setPayments(list => list.map(p => (p.id === id ? { ...p, ...patch } : p)));
  const removePayment = id =>
    setPayments(list =>
      list.length > 1 ? list.filter(p => p.id !== id) : list,
    );

  /* ----- books ----- */
  const availableBooks = useMemo(
    () =>
      books.filter(b => b.status === 'published' || Number(b.stock || 0) > 0),
    [books],
  );

  const bookResults = useMemo(() => {
    const q = bookQuery.trim().toLowerCase();
    const list = q
      ? availableBooks.filter(b =>
          [b.title, b.author, b.isbn, b.sku, b.barcode].some(v =>
            String(v ?? '')
              .toLowerCase()
              .includes(q),
          ),
        )
      : availableBooks;
    return list.slice(0, 8);
  }, [availableBooks, bookQuery]);

  const addBook = book => {
    const stock = Number(book.stock || 0);
    const existing = cartItems.find(i => String(i.bookId) === String(book.id));
    if ((Number(existing?.quantity) || 0) + 1 > stock) {
      toast.error(
        `"${book.title}" does not have enough stock (available: ${stock})`,
      );
      return;
    }
    if (existing) {
      setCartItems(
        cartItems.map(i =>
          i === existing ? { ...i, quantity: Number(i.quantity) + 1 } : i,
        ),
      );
    } else {
      setCartItems([
        ...cartItems,
        {
          bookId: book.id,
          title: book.title,
          author: book.author || '',
          sku: book.sku || book.isbn || book.barcode || '',
          price: Number(book.price || book.offerPrice || 0),
          quantity: 1,
          stock,
          commission: null,
          discount: 0,
        },
      ]);
    }
    setSelectedRowId(book.id);
    setBookQuery('');
    setBookOpen(false);
  };

  // Barcode scanners type the code and press Enter
  const handleBookKeyDown = e => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const q = bookQuery.trim().toLowerCase();
    if (!q) return;
    const exact = availableBooks.find(b =>
      [b.sku, b.isbn, b.barcode].some(v => String(v ?? '').toLowerCase() === q),
    );
    const target = exact || (bookResults.length === 1 ? bookResults[0] : null);
    if (target) addBook(target);
    else toast.error('Pick a book from the list');
  };

  const patchItem = (bookId, patch) =>
    setCartItems(list =>
      list.map(i =>
        String(i.bookId) === String(bookId) ? { ...i, ...patch } : i,
      ),
    );

  const setQuantity = (item, raw) => {
    if (raw === '') return patchItem(item.bookId, { quantity: '' });
    let q = Math.floor(Number(normalizeDigits(raw)));
    if (isNaN(q) || q < 0) q = 0;
    if (q > item.stock) {
      toast.error(`Maximum available stock: ${item.stock}`);
      q = item.stock;
    }
    patchItem(item.bookId, { quantity: q });
  };

  const stepQuantity = (item, delta) =>
    setQuantity(
      item,
      String(Math.max(1, (Number(item.quantity) || 0) + delta)),
    );

  const setItemCommission = (item, raw) => {
    if (raw === '') return patchItem(item.bookId, { commission: null });
    const v = parseFloat(normalizeDigits(raw));
    patchItem(item.bookId, { commission: isNaN(v) ? null : clampPct(v) });
  };

  const setItemDiscount = (item, raw) =>
    patchItem(item.bookId, { discount: Math.max(0, toNum(raw)) });

  // Editing the discount price back-calculates this book's commission
  const setDiscountPrice = (line, raw) => {
    if (raw === '') return patchItem(line.bookId, { commission: null });
    const v = parseFloat(normalizeDigits(raw));
    if (isNaN(v) || line.price <= 0) return;
    patchItem(line.bookId, {
      commission: round2(clampPct((1 - v / line.price) * 100)),
      discount: 0,
    });
  };

  const removeItem = bookId => {
    setCartItems(list => list.filter(i => String(i.bookId) !== String(bookId)));
    setSelectedRowId(null);
  };

  /* ----- invoice ----- */
  const invoiceData = () => ({
    orderNumber,
    shopName: shopName.trim() || '—',
    phone,
    address,
    email,
    representative: representative.trim(),
    orderDate,
    notes,
    totalCopies: totals.copies,
    subtotal: totals.gross,
    disTotal: totals.afterItems,
    commissionAmount: totals.commissionAmount,
    itemDiscount: totals.itemDiscount,
    orderDiscount: totals.orderDiscount,
    netPayable: netBill,
    previousDue,
    paidAmount,
    totalDue,
    paymentLabel: usedMethods || paymentLabel(payments[0]?.method),
    items: lines.map(l => ({
      title: l.title,
      price: l.price,
      commission: l.pct,
      netPrice: l.netPrice,
      quantity: l.qty,
      lineTotal: l.lineTotal,
      discount: l.discount,
    })),
  });

  const ensureReady = () => {
    if (!phone.trim() || !shopName.trim() || !address.trim()) {
      toast.error('Enter phone number, shop name, and address');
      return false;
    }
    if (lines.length === 0) {
      toast.error('Add at least one book to the invoice');
      return false;
    }
    return true;
  };

  const downloadInvoice = () => {
    if (!ensureReady()) return;
    const blob = new Blob([buildInvoiceHtml(invoiceData())], {
      type: 'text/html;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${(shopName || 'counter').trim().replace(/\s+/g, '-')}-${orderDate}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openPrintWindow = html => {
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) {
      toast.error('Popup blocked. Please allow popups');
      return;
    }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  const printInvoice = () => {
    if (!ensureReady()) return;
    openPrintWindow(buildInvoiceHtml(invoiceData()));
  };

  /* ----- draft ----- */
  const saveDraft = () => {
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          phone,
          shopName,
          address,
          email,
          representative,
          salesRep,
          orderDate,
          commissionInput,
          orderDiscountInput,
          previousDueInput,
          notes,
          cartItems,
        }),
      );
      setHasDraft(true);
      toast.success('Draft saved on this device');
    } catch {
      toast.error('Could not save the draft');
    }
  };

  const restoreDraft = () => {
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      if (!d) return;
      setPhone(d.phone || '');
      setShopName(d.shopName || '');
      setAddress(d.address || '');
      setEmail(d.email || '');
      setRepresentative(d.representative || '');
      setSalesRep(d.salesRep || '');
      setOrderDate(d.orderDate || todayLocal());
      setCommissionInput(d.commissionInput ?? '35');
      setOrderDiscountInput(d.orderDiscountInput || '');
      setPreviousDueInput(d.previousDueInput || '');
      setNotes(d.notes || '');
      setCartItems(Array.isArray(d.cartItems) ? d.cartItems : []);
      toast.success('Draft restored');
    } catch {
      toast.error('Could not restore the draft');
    }
  };

  const discardDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
    setHasDraft(false);
  };

  /* ----- submit ----- */
  const resetForm = () => {
    setPhone('');
    setShopName('');
    setAddress('');
    setEmail('');
    setRepresentative('');
    setSalesRep('');
    setRetailer(null);
    setCartItems([]);
    setPayments([newPayment('cash')]);
    setPaymentRef('');
    setPaymentDate(todayLocal());
    setPreviousDueInput('');
    setOrderDiscountInput('');
    setNotes('');
    setOrderDate(todayLocal());
    setSelectedRowId(null);
  };

  const validate = () => {
    if (!shopName.trim()) return 'Please enter the shop name';
    if (!phone.trim()) return 'Please enter the phone number';
    if (!address.trim()) return 'Please enter the shop address';
    if (lines.length === 0) return 'Add at least one book to the order';
    if (lines.some(l => l.qty <= 0))
      return 'Each book quantity must be at least 1';
    if (lines.some(l => l.qty > l.stock))
      return 'A quantity is higher than the available stock';
    if (overCredit)
      return `Credit limit exceeded (limit ${formatCurrency(creditLimit)})`;
    const needsTxn = payments.find(p => {
      const m = String(p.method).toLowerCase();
      return (
        ['bkash', 'nagad', 'rocket', 'bank'].some(k => m.includes(k)) &&
        toNum(p.amount) > 0 &&
        !p.txnId.trim()
      );
    });
    if (needsTxn)
      return `Enter the transaction ID for ${paymentLabel(needsTxn.method)}`;
    return null;
  };

  const handleConfirm = (mode = 'confirm') => {
    if (submittingRef.current) return; // block double clicks
    const problem = validate();
    if (problem) return toast.error(problem);
    if (
      !window.confirm(
        `Confirm order ${orderNumber} for ${shopName.trim()}?\nNet bill: ${formatCurrency(netBill)}  |  Paid: ${formatCurrency(paidAmount)}  |  Due: ${formatCurrency(totalDue)}`,
      )
    )
      return;

    submittingRef.current = true;
    const printHtml = mode === 'print' ? buildInvoiceHtml(invoiceData()) : null;

    const res = createOrder({
      orderType: 'counter',
      shopName: shopName.trim(),
      customerName: representative.trim()
        ? `${shopName.trim()} (${representative.trim()})`
        : shopName.trim(),
      representative: representative.trim(),
      salesRep: salesRep.trim(),
      phone: phone.trim(),
      address: address.trim(),
      email: email.trim(),
      orderDate,
      orderNumber,
      previousDue,
      totalDue,
      commission: defaultCommission,
      commissionAmount: totals.commissionAmount,
      itemDiscount: totals.itemDiscount,
      orderDiscount: totals.orderDiscount,
      subtotal: totals.gross,
      total: netBill,
      amountPaid: paidAmount,
      dueAmount,
      paymentMethod: payments[0]?.method,
      payments: payments
        .filter(p => toNum(p.amount) > 0)
        .map(p => ({
          method: p.method,
          amount: round2(toNum(p.amount)),
          transactionId: p.txnId.trim(),
          reference: paymentRef.trim(),
          date: paymentDate,
          receivedBy: currentUser?.name || 'Counter Staff',
        })),
      paymentStatus,
      status: 'delivered',
      notes: notes.trim(),
      servedBy: currentUser?.name || 'Counter Staff',
      items: lines.map(l => ({
        bookId: l.bookId,
        title: l.title,
        sku: l.sku,
        price: l.price, // MRP snapshot
        commission: l.pct, // commission % snapshot
        commissionAmount: l.commissionAmt,
        discount: l.discount,
        netPrice: l.netPrice,
        quantity: l.qty,
        lineTotal: l.lineTotal,
      })),
    });

    submittingRef.current = false;
    if (res.success) {
      toast.success('Counter order created successfully!');
      if (printHtml) openPrintWindow(printHtml);
      else if (mode === 'confirm') setCompletedOrder(res.order);
      discardDraft();
      resetForm();
      setMobileOpen(false);
      if (mode === 'new') phoneInputRef.current?.focus();
    } else {
      toast.error(res.message || 'Could not create the order');
    }
  };

  /* ----- keyboard shortcuts ----- */
  shortcutRef.current = e => {
    const tag = e.target?.tagName;
    const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      bookInputRef.current?.focus();
    } else if (e.key === 'F2') {
      e.preventDefault();
      phoneInputRef.current?.focus();
    } else if (e.key === 'F4') {
      e.preventDefault();
      paidInputRef.current?.focus();
    } else if (e.key === 'F8') {
      e.preventDefault();
      handleConfirm('confirm');
    } else if (e.key === 'Escape') {
      setSuggestOpen(null);
      setBookOpen(false);
      setMobileOpen(false);
    } else if (e.key === 'Delete' && !typing && selectedRowId != null) {
      removeItem(selectedRowId);
    }
  };
  useEffect(() => {
    const handler = e => shortcutRef.current?.(e);
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  /* ----- render helpers ----- */
  const renderSuggest = () =>
    suggestOpen && customerSuggestions.length > 0 ? (
      <div className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg">
        {customerSuggestions.map((c, i) => (
          <button
            key={`${c.phone}-${c.shopName}-${i}`}
            type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={() => applyRetailer(c)}
            className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-gray-100"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-gray-800">
                {c.shopName || '—'}
              </span>
              <span className="block truncate text-xs text-gray-500">
                {c.address || 'No address'}
              </span>
            </span>
            <span className="shrink-0 text-xs text-gray-500">{c.phone}</span>
          </button>
        ))}
      </div>
    ) : null;

  const breakdown = (
    <div className="divide-y divide-gray-100">
      <div className="pb-2">
        <SumRow
          label={`Gross (MRP × ${totals.copies} copies)`}
          value={formatCurrency(totals.gross)}
        />
        <SumRow
          label="Retailer commission"
          value={`− ${formatCurrency(totals.commissionAmount)}`}
          tone="minus"
        />
        {totals.itemDiscount > 0 && (
          <SumRow
            label="Item discount"
            value={`− ${formatCurrency(totals.itemDiscount)}`}
            tone="minus"
          />
        )}
        {totals.orderDiscount > 0 && (
          <SumRow
            label="Order discount"
            value={`− ${formatCurrency(totals.orderDiscount)}`}
            tone="minus"
          />
        )}
        <SumRow label="Net Bill" value={formatCurrency(netBill)} strong />
      </div>
      <div className="py-2">
        <SumRow
          label="Previous due"
          value={`+ ${formatCurrency(previousDue)}`}
          tone="plus"
        />
        <SumRow
          label="Total payable"
          value={formatCurrency(totalPayable)}
          strong
        />
      </div>
      <div className="pt-2">
        <SumRow
          label={`Paid${usedMethods ? ` (${usedMethods})` : ''}`}
          value={`− ${formatCurrency(paidAmount)}`}
          tone="minus"
        />
        <div
          className={`mt-1 flex items-center justify-between rounded-lg px-3 py-2.5 text-base font-semibold ${
            totalDue > 0
              ? 'bg-[#fef3f2] text-[#d92d20]'
              : 'bg-[#ecfdf3] text-[#039855]'
          }`}
        >
          <span>Remaining due</span>
          <span>{formatCurrency(totalDue)}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-28 lg:pb-0">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/counter-orders"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 shadow-xs transition hover:bg-gray-50"
            title="Back to list"
          >
            <FiArrowLeft size={16} />
          </Link>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              New Counter Order
            </h2>
            <p className="text-xs text-gray-500">
              Memo {orderNumber} · Shortcuts: <Kbd>F2</Kbd> retailer{' '}
              <Kbd>Ctrl K</Kbd> books <Kbd>F4</Kbd> payment <Kbd>F8</Kbd>{' '}
              confirm
            </p>
          </div>
        </div>
        <nav className="flex items-center gap-1.5 text-sm text-gray-500">
          <Link to="/dashboard" className="hover:text-gray-800">
            Dashboard
          </Link>
          <span>/</span>
          <Link to="/dashboard/counter-orders" className="hover:text-gray-800">
            Counter Orders
          </Link>
          <span>/</span>
          <span className="text-gray-800">New Order</span>
        </nav>
      </div>

      {hasDraft && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#fedf89] bg-[#fffaeb] px-4 py-3 text-sm text-[#b54708]">
          <span>A saved draft is available on this device.</span>
          <span className="flex gap-2">
            <button
              type="button"
              onClick={restoreDraft}
              className="font-semibold underline"
            >
              Restore
            </button>
            <button
              type="button"
              onClick={discardDraft}
              className="font-semibold underline"
            >
              Discard
            </button>
          </span>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        {/* ============ LEFT COLUMN ============ */}
        <div className="min-w-0 space-y-6">
          {/* 1. Shop information */}
          <div className={cardCls}>
            <CardHeader
              title="Shop Information"
              desc="Saved details fill in automatically from the phone number or shop name"
              right={
                retailer ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfdf3] px-2.5 py-0.5 text-sm font-medium text-[#039855]">
                    <FiUserCheck size={13} /> Saved retailer
                  </span>
                ) : isNewRetailer ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#eff4ff] px-2.5 py-0.5 text-sm font-medium text-[#465fff]">
                    <FiPlus size={13} /> New retailer
                  </span>
                ) : null
              }
            />
            <div className="border-t border-gray-100 p-5 sm:p-6">
              <div ref={customerBoxRef} className="grid gap-5 sm:grid-cols-2">
                <div className="relative">
                  <label className={labelCls}>
                    Phone Number <span className="text-[#f04438]">*</span>
                  </label>
                  <IconField icon={FiPhone}>
                    <input
                      ref={phoneInputRef}
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      dir="auto"
                      value={phone}
                      onFocus={() => setSuggestOpen('phone')}
                      onChange={e => {
                        handlePhoneChange(e.target.value);
                        setSuggestOpen('phone');
                      }}
                      placeholder="01711123456"
                      className={iconInputCls}
                    />
                  </IconField>
                  {suggestOpen === 'phone' && renderSuggest()}
                </div>

                <div className="relative">
                  <label className={labelCls}>
                    Shop Name <span className="text-[#f04438]">*</span>
                  </label>
                  <IconField icon={FiShoppingBag}>
                    <input
                      type="text"
                      lang="bn"
                      dir="auto"
                      autoComplete="organization"
                      spellCheck="false"
                      value={shopName}
                      onFocus={() => setSuggestOpen('shop')}
                      onCompositionStart={onCompStart}
                      onCompositionEnd={e =>
                        onCompEnd(e, v => {
                          setShopName(v);
                          setRetailer(null);
                          setSuggestOpen('shop');
                        })
                      }
                      onChange={e =>
                        onTextChange(e, v => {
                          setShopName(v);
                          setRetailer(null);
                          setSuggestOpen('shop');
                        })
                      }
                      style={{ unicodeBidi: 'plaintext' }}
                      placeholder="Example: Batighar Bookstore"
                      className={iconInputCls}
                    />
                  </IconField>
                  {suggestOpen === 'shop' && renderSuggest()}
                </div>

                <div>
                  <label className={labelCls}>
                    Person Taking the Books{' '}
                    <span className="font-normal text-gray-400">
                      (Optional)
                    </span>
                  </label>
                  <IconField icon={FiUser}>
                    <input
                      type="text"
                      lang="bn"
                      dir="auto"
                      autoComplete="name"
                      spellCheck="false"
                      value={representative}
                      onCompositionStart={onCompStart}
                      onCompositionEnd={e => onCompEnd(e, setRepresentative)}
                      onChange={e => onTextChange(e, setRepresentative)}
                      style={{ unicodeBidi: 'plaintext' }}
                      placeholder="Representative name"
                      className={iconInputCls}
                    />
                  </IconField>
                </div>

                <div>
                  <label className={labelCls}>
                    Address <span className="text-[#f04438]">*</span>
                  </label>
                  <IconField icon={FiMapPin}>
                    <input
                      type="text"
                      lang="bn"
                      dir="auto"
                      autoComplete="street-address"
                      spellCheck="false"
                      value={address}
                      onCompositionStart={onCompStart}
                      onCompositionEnd={e => onCompEnd(e, setAddress)}
                      onChange={e => onTextChange(e, setAddress)}
                      style={{ unicodeBidi: 'plaintext' }}
                      placeholder="Banglabazar, Dhaka"
                      className={iconInputCls}
                    />
                  </IconField>
                </div>

                <div>
                  <label className={labelCls}>Email</label>
                  <IconField icon={FiMail}>
                    <input
                      type="email"
                      dir="auto"
                      autoComplete="email"
                      autoCapitalize="none"
                      spellCheck="false"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="info@example.com"
                      className={iconInputCls}
                    />
                  </IconField>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Date</label>
                    <input
                      type="date"
                      value={orderDate}
                      onChange={e => setOrderDate(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Sales Rep.</label>
                    <input
                      type="text"
                      lang="bn"
                      dir="auto"
                      value={salesRep}
                      onCompositionStart={onCompStart}
                      onCompositionEnd={e => onCompEnd(e, setSalesRep)}
                      onChange={e => onTextChange(e, setSalesRep)}
                      placeholder="Optional"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              {/* Retailer account snapshot */}
              {(retailer || previousDue > 0) && (
                <div className="mt-5 grid gap-3 rounded-xl bg-gray-50 p-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-gray-500">Previous due</p>
                    <p
                      className={`text-sm font-semibold ${previousDue > 0 ? 'text-[#d92d20]' : 'text-gray-800'}`}
                    >
                      {formatCurrency(previousDue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Default commission</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {retailer?.commission != null &&
                      retailer.commission !== ''
                        ? `${retailer.commission}%`
                        : `${globalCommission}% (general)`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">
                      Credit limit / available
                    </p>
                    <p className="text-sm font-semibold text-gray-800">
                      {creditLimit
                        ? `${formatCurrency(creditLimit)} / ${formatCurrency(availableCredit)}`
                        : 'Not set'}
                    </p>
                  </div>
                </div>
              )}
              {isNewRetailer && (
                <p className="mt-3 text-xs text-gray-500">
                  This phone number is not saved yet. The retailer details will
                  be stored with this order.
                </p>
              )}
            </div>
          </div>

          {/* 2. Commission */}
          <div className={cardCls}>
            <CardHeader
              title="General Commission & Order Discount"
              desc="Priority: book commission → retailer default → general commission"
            />
            <div className="flex flex-wrap items-end gap-5 border-t border-gray-100 p-5 sm:p-6">
              <div>
                <label className={labelCls}>General commission</label>
                <div className="relative w-36">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={commissionInput}
                    onChange={e => setCommissionInput(e.target.value)}
                    className={`${inputCls} pr-10 text-right text-base font-semibold`}
                    aria-label="General commission percentage"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                    %
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pb-0.5">
                {PRESET_COMMISSIONS.map(pct => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setCommissionInput(String(pct))}
                    className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                      globalCommission === pct
                        ? 'bg-[#465fff]/10 text-[#465fff]'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
              <div className="ml-auto">
                <label className={labelCls}>Extra order discount (৳)</label>
                <input
                  type="number"
                  min="0"
                  value={orderDiscountInput}
                  onChange={e => setOrderDiscountInput(e.target.value)}
                  placeholder="0"
                  className={`${inputCls} w-40 text-right font-medium`}
                />
              </div>
            </div>
          </div>

          {/* 3. Books */}
          <div className={cardCls}>
            <CardHeader
              title="Add Books"
              desc={`${lines.length} books • ${totals.copies} copies`}
              right={
                lines.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCartItems([])}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-[#d92d20] transition hover:bg-[#fef3f2]"
                  >
                    <FiTrash2 size={14} /> Clear All
                  </button>
                )
              }
            />
            <div className="space-y-5 border-t border-gray-100 p-5 sm:p-6">
              <div ref={bookBoxRef} className="relative">
                <IconField icon={FiSearch}>
                  <input
                    ref={bookInputRef}
                    type="text"
                    value={bookQuery}
                    onFocus={() => setBookOpen(true)}
                    onKeyDown={handleBookKeyDown}
                    onChange={e => {
                      setBookQuery(e.target.value);
                      setBookOpen(true);
                    }}
                    placeholder="Title, author, ISBN, SKU or scan barcode..."
                    className={iconInputCls}
                  />
                </IconField>
                {bookOpen && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-80 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg">
                    {bookResults.length === 0 ? (
                      <p className="px-3 py-6 text-center text-sm text-gray-400">
                        No books found
                      </p>
                    ) : (
                      bookResults.map(book => {
                        const stock = Number(book.stock || 0);
                        const out = stock <= 0;
                        const cover =
                          book.cover ?? book.coverImage ?? book.image;
                        return (
                          <button
                            key={book.id}
                            type="button"
                            disabled={out}
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => addBook(book)}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {cover ? (
                              <img
                                src={cover}
                                alt=""
                                className="h-12 w-9 shrink-0 rounded object-cover"
                              />
                            ) : (
                              <span className="flex h-12 w-9 shrink-0 items-center justify-center rounded bg-gray-100 text-gray-300">
                                <FiShoppingBag size={14} />
                              </span>
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-gray-800">
                                {book.title}
                              </span>
                              <span className="block truncate text-xs text-gray-500">
                                {[
                                  book.author,
                                  book.category,
                                  book.sku || book.isbn,
                                ]
                                  .filter(Boolean)
                                  .join(' • ')}
                              </span>
                            </span>
                            <span className="shrink-0 text-right">
                              <span className="block text-sm font-medium text-gray-800">
                                ৳{book.price || book.offerPrice}
                              </span>
                              {out ? (
                                <span className="text-xs text-[#d92d20]">
                                  Out of stock
                                </span>
                              ) : (
                                <span
                                  className={`text-xs ${stock <= 5 ? 'text-[#b54708]' : 'text-gray-500'}`}
                                >
                                  Stock: {stock}
                                </span>
                              )}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {lines.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center">
                  <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                    <FiShoppingBag size={20} />
                  </span>
                  <p className="text-sm font-medium text-gray-700">
                    No books have been added
                  </p>
                  <p className="mt-0.5 text-sm text-gray-500">
                    Search above or scan a barcode. Press <Kbd>Ctrl K</Kbd> to
                    jump here.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left">
                      <thead className="border-b border-gray-200 bg-gray-50">
                        <tr className="text-xs font-medium text-gray-500">
                          <th className="px-4 py-3">Book</th>
                          <th className="px-3 py-3 text-right">MRP</th>
                          <th className="px-3 py-3 text-center">Qty</th>
                          <th className="px-3 py-3 text-center">Comm. %</th>
                          <th className="px-3 py-3 text-right">Comm. ৳</th>
                          <th className="px-3 py-3 text-right">Discount ৳</th>
                          <th className="px-3 py-3 text-right">
                            Payable / copy
                          </th>
                          <th className="px-4 py-3 text-right">Subtotal</th>
                          <th className="w-10 py-3 pr-3" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {lines.map(l => (
                          <tr
                            key={l.bookId}
                            onClick={() => setSelectedRowId(l.bookId)}
                            className={
                              String(selectedRowId) === String(l.bookId)
                                ? 'bg-[#465fff]/5'
                                : ''
                            }
                          >
                            <td className="px-4 py-3">
                              <span className="block text-sm font-medium text-gray-800">
                                {l.title}
                              </span>
                              <span className="block text-xs text-gray-500">
                                {[l.author, l.sku].filter(Boolean).join(' • ')}
                                {(l.author || l.sku) && ' • '}Stock: {l.stock}
                              </span>
                              {l.qty >= l.stock && (
                                <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-[#b54708]">
                                  <FiAlertTriangle size={11} /> Max stock
                                  reached
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-right text-sm text-gray-600">
                              ৳{l.price}
                            </td>
                            <td className="px-3 py-3">
                              <div className="mx-auto flex w-28 items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => stepQuantity(l, -1)}
                                  className="flex h-9 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
                                  aria-label="Decrease quantity"
                                >
                                  <FiMinus size={13} />
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  max={l.stock}
                                  value={l.quantity}
                                  onChange={e => setQuantity(l, e.target.value)}
                                  className={`${cellInputCls} px-1 text-center font-medium`}
                                />
                                <button
                                  type="button"
                                  onClick={() => stepQuantity(l, 1)}
                                  className="flex h-9 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
                                  aria-label="Increase quantity"
                                >
                                  <FiPlus size={13} />
                                </button>
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <div className="relative mx-auto w-24">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.5"
                                  value={l.commission ?? ''}
                                  placeholder={String(defaultCommission)}
                                  onChange={e =>
                                    setItemCommission(l, e.target.value)
                                  }
                                  className={`${cellInputCls} pr-7 text-right ${
                                    l.custom
                                      ? 'border-[#f79009] bg-[#fffaeb] font-semibold text-[#b54708]'
                                      : 'placeholder:text-gray-500'
                                  }`}
                                  title="Leave blank to use the retailer / general commission"
                                />
                                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                  %
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-right text-sm text-[#d92d20]">
                              {l.commissionAmt > 0
                                ? `− ${l.commissionAmt}`
                                : '0'}
                            </td>
                            <td className="px-3 py-3">
                              <input
                                type="number"
                                min="0"
                                value={l.discount || ''}
                                placeholder="0"
                                onChange={e =>
                                  setItemDiscount(l, e.target.value)
                                }
                                className={`${cellInputCls} ml-auto w-24 text-right`}
                              />
                            </td>
                            <td className="px-3 py-3">
                              <div className="relative ml-auto w-28">
                                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                  ৳
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={l.netPrice}
                                  onChange={e =>
                                    setDiscountPrice(l, e.target.value)
                                  }
                                  className={`${cellInputCls} pl-6 text-right font-medium`}
                                />
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-medium text-gray-800">
                              {formatCurrency(l.lineTotal)}
                            </td>
                            <td className="py-3 pr-3 text-right">
                              <button
                                type="button"
                                onClick={() => removeItem(l.bookId)}
                                className="rounded-lg p-2 text-gray-400 transition hover:bg-[#fef3f2] hover:text-[#d92d20]"
                                aria-label="Remove book"
                              >
                                <FiTrash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {lines.length > 0 && (
                <p className="text-sm text-gray-500">
                  Editing the commission or payable price changes only that
                  book. Click a row and press <Kbd>Delete</Kbd> to remove it.
                </p>
              )}
            </div>
          </div>

          {/* 4. Payment */}
          <div className={cardCls}>
            <CardHeader
              title="Payment"
              desc="Leave the amount blank for full payment of this bill. Add rows for split payments."
              right={
                <button
                  type="button"
                  onClick={() =>
                    setPayments(list => [...list, newPayment('cash')])
                  }
                  className={btnOutline}
                >
                  <FiPlus size={14} /> Add payment
                </button>
              }
            />
            <div className="space-y-4 border-t border-gray-100 p-5 sm:p-6">
              {payments.map((p, idx) => (
                <div
                  key={p.id}
                  className="grid gap-3 rounded-xl border border-gray-200 p-3 sm:grid-cols-[1.2fr_1fr_1fr_auto]"
                >
                  <div>
                    <label className={labelCls}>Method</label>
                    <select
                      value={p.method}
                      onChange={e => {
                        const method = e.target.value;
                        patchPayment(p.id, {
                          method,
                          amount:
                            method === 'due'
                              ? '0'
                              : p.amount === '0'
                                ? ''
                                : p.amount,
                        });
                      }}
                      className={inputCls}
                    >
                      {PAYMENT_METHODS.map(pm => (
                        <option key={pm.id} value={pm.id}>
                          {pm.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Amount</label>
                    <input
                      ref={idx === 0 ? paidInputRef : undefined}
                      type="number"
                      min="0"
                      value={p.amount}
                      onChange={e =>
                        patchPayment(p.id, { amount: e.target.value })
                      }
                      placeholder={idx === 0 ? String(netBill) : '0'}
                      className={`${inputCls} font-medium`}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Transaction ID</label>
                    <input
                      type="text"
                      value={p.txnId}
                      onChange={e =>
                        patchPayment(p.id, { txnId: e.target.value })
                      }
                      placeholder="bKash / bank TrxID"
                      className={inputCls}
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      disabled={payments.length === 1}
                      onClick={() => removePayment(p.id)}
                      className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-400 transition hover:bg-[#fef3f2] hover:text-[#d92d20] disabled:opacity-30"
                      aria-label="Remove payment"
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className={labelCls}>Previous due</label>
                  <input
                    type="number"
                    min="0"
                    value={
                      previousDueInput === ''
                        ? previousDueAuto || ''
                        : previousDueInput
                    }
                    onChange={e => setPreviousDueInput(e.target.value)}
                    placeholder="0"
                    className={`${inputCls} font-medium ${previousDue > 0 ? 'border-[#fda29b] text-[#d92d20]' : ''}`}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {previousDueAuto > 0
                      ? 'Taken from earlier orders; can be changed'
                      : 'Enter the previous due, if any'}
                  </p>
                </div>
                <div>
                  <label className={labelCls}>Payment date</label>
                  <IconField icon={FiCalendar}>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={e => setPaymentDate(e.target.value)}
                      className={iconInputCls}
                    />
                  </IconField>
                </div>
                <div>
                  <label className={labelCls}>Reference</label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={e => setPaymentRef(e.target.value)}
                    placeholder="Optional"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Received by</label>
                  <div className="flex h-11 items-center rounded-lg bg-gray-50 px-4 text-sm text-gray-700">
                    {currentUser?.name || 'Counter Staff'}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Note</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Example: Banglabazar invoice"
                    className={inputCls}
                  />
                </div>
              </div>

              {overCredit && (
                <p className="flex items-center gap-2 rounded-lg bg-[#fef3f2] px-3 py-2 text-sm text-[#d92d20]">
                  <FiAlertTriangle size={14} /> Total due is above the retailer
                  credit limit of {formatCurrency(creditLimit)}.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ============ RIGHT COLUMN: sticky bill + invoice ============ */}
        <aside className="min-w-0 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
          <div className={cardCls}>
            <CardHeader
              title="Bill Summary"
              desc="Live invoice preview"
              right={
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    paymentStatus === 'paid'
                      ? 'bg-[#ecfdf3] text-[#039855]'
                      : paymentStatus === 'partial'
                        ? 'bg-[#fffaeb] text-[#b54708]'
                        : 'bg-[#fef3f2] text-[#d92d20]'
                  }`}
                >
                  {paymentStatus === 'paid'
                    ? 'Paid'
                    : paymentStatus === 'partial'
                      ? 'Partial'
                      : 'Due'}
                </span>
              }
            />
            <div className="border-t border-gray-100 p-5">
              {/* Invoice preview */}
              <div className="border-b-2 border-gray-800 pb-3 text-center">
                {PUBLISHER.logo && (
                  <img
                    src={PUBLISHER.logo}
                    alt=""
                    className="mx-auto mb-2 h-10 object-contain"
                  />
                )}
                <h3 className="text-lg font-semibold text-gray-900">
                  {PUBLISHER.name}
                </h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  {PUBLISHER.address}
                </p>
                <p className="text-xs text-gray-500">
                  Mobile: {PUBLISHER.phone}
                </p>
              </div>

              <dl className="space-y-1 py-3 text-xs">
                {[
                  ['Memo', orderNumber],
                  ['Date', orderDate],
                  ['Shop', shopName],
                  ['Phone', phone],
                  ['Address', address],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <dt className="w-14 shrink-0 text-gray-500">{k}</dt>
                    <dd className="min-w-0 break-words font-medium text-gray-800">
                      {v || '—'}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[320px] text-left text-xs">
                  <thead className="border-y border-gray-300 bg-gray-50">
                    <tr className="font-semibold text-gray-700">
                      <th className="px-2 py-2">Sl</th>
                      <th className="px-2 py-2">Book</th>
                      <th className="px-2 py-2 text-right">Qty</th>
                      <th className="px-2 py-2 text-right">MRP</th>
                      <th className="px-2 py-2 text-right">Dis.</th>
                      <th className="px-2 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {lines.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-2 py-6 text-center text-gray-400"
                        >
                          No books added
                        </td>
                      </tr>
                    ) : (
                      lines.map((l, i) => (
                        <tr key={l.bookId}>
                          <td className="px-2 py-2 text-gray-500">{i + 1}</td>
                          <td className="px-2 py-2 font-medium text-gray-800">
                            {l.title}
                          </td>
                          <td className="px-2 py-2 text-right">{l.qty}</td>
                          <td className="px-2 py-2 text-right">{l.price}</td>
                          <td className="px-2 py-2 text-right">{l.netPrice}</td>
                          <td className="px-2 py-2 text-right font-medium">
                            {l.lineTotal}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4">{breakdown}</div>

              <div className="mt-5 grid grid-cols-2 gap-8 pt-6 text-center text-[11px] text-gray-500">
                <div className="border-t border-gray-400 pt-1">
                  Customer acknowledgment
                </div>
                <div className="border-t border-gray-400 pt-1">
                  Authorized signature
                </div>
              </div>
              <p className="mt-3 text-[11px] leading-4 text-gray-400">
                Terms: Sold books are not returnable without a valid memo. Dues
                must be cleared within the agreed period.
              </p>

              {/* Actions */}
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={downloadInvoice}
                  disabled={!lines.length}
                  className={btnOutline}
                >
                  <FiDownload size={15} /> Download
                </button>
                <button
                  type="button"
                  onClick={printInvoice}
                  disabled={!lines.length}
                  className={btnOutline}
                >
                  <FiPrinter size={15} /> Print / PDF
                </button>
                <button
                  type="button"
                  onClick={saveDraft}
                  className={btnOutline}
                >
                  <FiSave size={15} /> Save Draft
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className={btnOutline}
                >
                  <FiRotateCcw size={15} /> Clear Form
                </button>
              </div>

              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => handleConfirm('confirm')}
                  disabled={!lines.length}
                  className={`${btnPrimary} w-full`}
                >
                  <FiCheck size={16} /> Confirm Order <Kbd>F8</Kbd>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleConfirm('print')}
                    disabled={!lines.length}
                    className={btnOutline}
                  >
                    Confirm &amp; Print
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirm('new')}
                    disabled={!lines.length}
                    className={btnOutline}
                  >
                    Confirm &amp; New
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile bottom bill bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.06)] lg:hidden">
        {mobileOpen && (
          <div className="max-h-[50vh] overflow-y-auto px-4 pt-3">
            {breakdown}
          </div>
        )}
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => setMobileOpen(o => !o)}
            className="min-w-0 flex-1 text-left"
          >
            <span className="flex items-center gap-1 text-xs text-gray-500">
              Net bill · Due {formatCurrency(totalDue)}
              <FiChevronUp
                size={12}
                className={mobileOpen ? 'rotate-180' : ''}
              />
            </span>
            <span className="block truncate text-lg font-semibold text-gray-900">
              {formatCurrency(netBill)}
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleConfirm('confirm')}
            disabled={!lines.length}
            className={btnPrimary}
          >
            <FiCheck size={16} /> Confirm
          </button>
        </div>
      </div>

      {completedOrder && (
        <CashMemoModal
          order={completedOrder}
          onClose={() => setCompletedOrder(null)}
        />
      )}
    </div>
  );
}
