// Total Cost (টোটাল কস্ট) Persistence & Mock API Service Layer
// Mimics relational database tables & REST APIs with full localStorage persistence

const BOOK_COSTS_KEY = 'hosonta_book_costs';
const AUTHOR_COMMISSIONS_KEY = 'hosonta_author_commissions';
const EMPLOYEE_EXPENSES_KEY = 'hosonta_employee_expenses';
const MARKETING_COSTS_KEY = 'hosonta_marketing_costs';

export const COST_TYPES = [
  'Printing',
  'Paper',
  'Design',
  'Editing',
  'Binding',
  'Other',
];

export const PAYMENT_METHODS = ['Cash', 'Bank', 'bKash', 'Nagad'];

export const EXPENSE_TYPES = ['Salary', 'Bonus', 'Transport', 'Other'];

export const MARKETING_CHANNELS = [
  'Facebook Ads',
  'Google Ads',
  'Influencer',
  'Offline',
  'Other',
];

// Realistic seed data across current month (2026-11) and previous month (2026-10)
const initialBookCosts = [
  {
    id: 'BC-101',
    bookId: 1,
    bookName: 'আপনার স্বামীকে আগলে রাখুন',
    costType: 'Printing',
    amount: 35000,
    date: '2026-11-05',
    note: '২০০০ কপি অফসেট প্রিন্ট অর্ডার',
  },
  {
    id: 'BC-102',
    bookId: 2,
    bookName: 'নেককার সঙ্গীর খোঁজে',
    costType: 'Paper',
    amount: 28500,
    date: '2026-11-08',
    note: '৭০ জিএসএম সুইডিশ পেপার রিম ক্রয়',
  },
  {
    id: 'BC-103',
    bookId: 3,
    bookName: 'বুকের ভেতর এক ফালি রোদ',
    costType: 'Design',
    amount: 8000,
    date: '2026-11-12',
    note: 'প্রচ্ছদ আর্টওয়ার্ক ও ইনার লেআউট',
  },
  {
    id: 'BC-104',
    bookId: 1,
    bookName: 'আপনার স্বামীকে আগলে রাখুন',
    costType: 'Binding',
    amount: 14000,
    date: '2026-11-14',
    note: 'হার্ডকাভার গ্লু বাইন্ডিং চার্জ',
  },
  {
    id: 'BC-105',
    bookId: 4,
    bookName: 'বেলা ফুরাবার আগে',
    costType: 'Editing',
    amount: 6500,
    date: '2026-11-15',
    note: 'পাণ্ডুলিপি প্রুফরিডিং ও রিভিউ সম্মানী',
  },
  // Previous month data for comparison
  {
    id: 'BC-091',
    bookId: 1,
    bookName: 'আপনার স্বামীকে আগলে রাখুন',
    costType: 'Printing',
    amount: 32000,
    date: '2026-10-10',
    note: 'প্রথম সংস্করণ প্রিন্ট',
  },
  {
    id: 'BC-092',
    bookId: 2,
    bookName: 'নেককার সঙ্গীর খোঁজে',
    costType: 'Paper',
    amount: 26000,
    date: '2026-10-18',
    note: 'কাগজ ক্রয়',
  },
];

const initialAuthorCommissions = [
  {
    id: 'AC-201',
    authorId: '1',
    authorName: 'সায়ন্তনী রায়',
    bookId: 1,
    bookName: 'আপনার স্বামীকে আগলে রাখুন',
    amount: 24500,
    date: '2026-11-06',
    method: 'bKash',
    note: 'অক্টোবর মাসের বিক্রয় রয়্যালটি কমিশন',
  },
  {
    id: 'AC-202',
    authorId: '2',
    authorName: 'আব্দুর রহমান আল আনসারী',
    bookId: 2,
    bookName: 'নেককার সঙ্গীর খোঁজে',
    amount: 38000,
    date: '2026-11-10',
    method: 'Bank',
    note: 'ইসলামী ব্যাংক অ্যাকাউন্টে ট্রান্সফার',
  },
  {
    id: 'AC-203',
    authorId: '3',
    authorName: "মনজুর সা'দ",
    bookId: 3,
    bookName: 'বুকের ভেতর এক ফালি রোদ',
    amount: 18200,
    date: '2026-11-15',
    method: 'Nagad',
    note: 'বইমেলা আগাম বিক্রয় কমিশন',
  },
  // Previous month data
  {
    id: 'AC-191',
    authorId: '1',
    authorName: 'সায়ন্তনী রায়',
    bookId: 1,
    bookName: 'আপনার স্বামীকে আগলে রাখুন',
    amount: 22000,
    date: '2026-10-12',
    method: 'bKash',
    note: 'সেপ্টেম্বর রয়্যালটি',
  },
];

const initialEmployeeExpenses = [
  {
    id: 'EE-301',
    employeeId: 'user-employee-1',
    employeeName: 'নুসরাত জাহান',
    expenseType: 'Salary',
    amount: 25000,
    date: '2026-11-01',
    note: 'নভেম্বর মাসের মূল বেতন',
  },
  {
    id: 'EE-302',
    employeeId: 'user-employee-2',
    employeeName: 'তানভীর আহমেদ',
    expenseType: 'Salary',
    amount: 22000,
    date: '2026-11-01',
    note: 'নভেম্বর মাসের মূল বেতন',
  },
  {
    id: 'EE-303',
    employeeId: 'user-employee-1',
    employeeName: 'নুসরাত জাহান',
    expenseType: 'Bonus',
    amount: 5000,
    date: '2026-11-14',
    note: 'কাউন্টার সেলস টার্গেট বোনাস',
  },
  {
    id: 'EE-304',
    employeeId: 'custom-emp-1',
    employeeName: 'আরিফুল ইসলাম (ডেলিভারি ম্যান)',
    expenseType: 'Transport',
    amount: 3500,
    date: '2026-11-16',
    note: 'শোরুম ও কুরিয়ার ডেলিভারি কনভেন্স',
  },
  // Previous month data
  {
    id: 'EE-291',
    employeeId: 'user-employee-1',
    employeeName: 'নুসরাত জাহান',
    expenseType: 'Salary',
    amount: 25000,
    date: '2026-10-01',
    note: 'অক্টোবর মাসের মূল বেতন',
  },
  {
    id: 'EE-292',
    employeeId: 'user-employee-2',
    employeeName: 'তানভীর আহমেদ',
    expenseType: 'Salary',
    amount: 22000,
    date: '2026-10-01',
    note: 'অক্টোবর মাসের মূল বেতন',
  },
];

const initialMarketingCosts = [
  {
    id: 'MC-401',
    channel: 'Facebook Ads',
    bookId: 1,
    bookName: 'আপনার স্বামীকে আগলে রাখুন',
    amount: 12000,
    date: '2026-11-03',
    note: 'অফিসিয়াল পেজ বুস্টিং ক্যাম্পেইন (Meta Ads)',
  },
  {
    id: 'MC-402',
    channel: 'Influencer',
    bookId: 2,
    bookName: 'নেককার সঙ্গীর খোঁজে',
    amount: 15000,
    date: '2026-11-09',
    note: 'ইউটিউব বুক টিউবার ও রিভিউয়ার স্পন্সরশিপ',
  },
  {
    id: 'MC-403',
    channel: 'Offline',
    bookId: '',
    bookName: 'সাধারণ পাবলিকেশন ব্র্যান্ডিং',
    amount: 8500,
    date: '2026-11-11',
    note: 'বইয়ের মেলা স্ট্যান্ডি, বুকমার্ক ও লিফলেট প্রিন্টিং',
  },
  {
    id: 'MC-404',
    channel: 'Google Ads',
    bookId: 3,
    bookName: 'বুকের ভেতর এক ফালি রোদ',
    amount: 6000,
    date: '2026-11-15',
    note: 'সার্চ ক্যাম্পেইন ও ওয়েবসাইট ট্রাফিক অ্যাড',
  },
  // Previous month data
  {
    id: 'MC-391',
    channel: 'Facebook Ads',
    bookId: 1,
    bookName: 'আপনার স্বামীকে আগলে রাখুন',
    amount: 10000,
    date: '2026-10-05',
    note: 'ফেসবুক ক্যাম্পেইন',
  },
  {
    id: 'MC-392',
    channel: 'Offline',
    bookId: '',
    bookName: 'সাধারণ ব্র্যান্ডিং',
    amount: 5000,
    date: '2026-10-15',
    note: 'পোস্টার ও ব্যানার',
  },
];

// Storage Helpers
function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Storage quota or private mode
  }
}

// ---------------- Table 1: Book Production Costs ----------------
export function getBookCosts(monthStr) {
  const all = readStorage(BOOK_COSTS_KEY, initialBookCosts);
  if (!monthStr) return all;
  return all.filter(item => (item.date || '').slice(0, 7) === monthStr);
}

export function addBookCost({ bookId, bookName, costType, amount, date, note }) {
  const all = readStorage(BOOK_COSTS_KEY, initialBookCosts);
  const newRecord = {
    id: `BC-${Date.now().toString().slice(-4)}`,
    bookId: Number(bookId) || bookId,
    bookName: bookName || 'বই',
    costType: costType || 'Printing',
    amount: Number(amount) || 0,
    date: date || new Date().toISOString().slice(0, 10),
    note: note || '',
  };
  const updated = [newRecord, ...all];
  writeStorage(BOOK_COSTS_KEY, updated);
  return newRecord;
}

export function updateBookCost(id, data) {
  const all = readStorage(BOOK_COSTS_KEY, initialBookCosts);
  const updated = all.map(item =>
    item.id === id ? { ...item, ...data, amount: Number(data.amount || item.amount) } : item,
  );
  writeStorage(BOOK_COSTS_KEY, updated);
  return updated.find(item => item.id === id);
}

export function deleteBookCost(id) {
  const all = readStorage(BOOK_COSTS_KEY, initialBookCosts);
  const updated = all.filter(item => item.id !== id);
  writeStorage(BOOK_COSTS_KEY, updated);
}

// ---------------- Table 2: Author Commissions ----------------
export function getAuthorCommissions(monthStr) {
  const all = readStorage(AUTHOR_COMMISSIONS_KEY, initialAuthorCommissions);
  if (!monthStr) return all;
  return all.filter(item => (item.date || '').slice(0, 7) === monthStr);
}

export function addAuthorCommission({
  authorId,
  authorName,
  bookId,
  bookName,
  amount,
  date,
  method,
  note,
}) {
  const all = readStorage(AUTHOR_COMMISSIONS_KEY, initialAuthorCommissions);
  const newRecord = {
    id: `AC-${Date.now().toString().slice(-4)}`,
    authorId: String(authorId),
    authorName: authorName || 'লেখক',
    bookId: Number(bookId) || bookId,
    bookName: bookName || '',
    amount: Number(amount) || 0,
    date: date || new Date().toISOString().slice(0, 10),
    method: method || 'bKash',
    note: note || '',
  };
  const updated = [newRecord, ...all];
  writeStorage(AUTHOR_COMMISSIONS_KEY, updated);
  return newRecord;
}

export function updateAuthorCommission(id, data) {
  const all = readStorage(AUTHOR_COMMISSIONS_KEY, initialAuthorCommissions);
  const updated = all.map(item =>
    item.id === id ? { ...item, ...data, amount: Number(data.amount || item.amount) } : item,
  );
  writeStorage(AUTHOR_COMMISSIONS_KEY, updated);
  return updated.find(item => item.id === id);
}

export function deleteAuthorCommission(id) {
  const all = readStorage(AUTHOR_COMMISSIONS_KEY, initialAuthorCommissions);
  const updated = all.filter(item => item.id !== id);
  writeStorage(AUTHOR_COMMISSIONS_KEY, updated);
}

// ---------------- Table 3: Employee Expenses ----------------
export function getEmployeeExpenses(monthStr) {
  const all = readStorage(EMPLOYEE_EXPENSES_KEY, initialEmployeeExpenses);
  if (!monthStr) return all;
  return all.filter(item => (item.date || '').slice(0, 7) === monthStr);
}

export function addEmployeeExpense({
  employeeId,
  employeeName,
  expenseType,
  amount,
  date,
  note,
}) {
  const all = readStorage(EMPLOYEE_EXPENSES_KEY, initialEmployeeExpenses);
  const newRecord = {
    id: `EE-${Date.now().toString().slice(-4)}`,
    employeeId: employeeId || 'custom',
    employeeName: employeeName || 'কর্মচারী',
    expenseType: expenseType || 'Salary',
    amount: Number(amount) || 0,
    date: date || new Date().toISOString().slice(0, 10),
    note: note || '',
  };
  const updated = [newRecord, ...all];
  writeStorage(EMPLOYEE_EXPENSES_KEY, updated);
  return newRecord;
}

export function updateEmployeeExpense(id, data) {
  const all = readStorage(EMPLOYEE_EXPENSES_KEY, initialEmployeeExpenses);
  const updated = all.map(item =>
    item.id === id ? { ...item, ...data, amount: Number(data.amount || item.amount) } : item,
  );
  writeStorage(EMPLOYEE_EXPENSES_KEY, updated);
  return updated.find(item => item.id === id);
}

export function deleteEmployeeExpense(id) {
  const all = readStorage(EMPLOYEE_EXPENSES_KEY, initialEmployeeExpenses);
  const updated = all.filter(item => item.id !== id);
  writeStorage(EMPLOYEE_EXPENSES_KEY, updated);
}

// ---------------- Table 4: Marketing Costs ----------------
export function getMarketingCosts(monthStr) {
  const all = readStorage(MARKETING_COSTS_KEY, initialMarketingCosts);
  if (!monthStr) return all;
  return all.filter(item => (item.date || '').slice(0, 7) === monthStr);
}

export function addMarketingCost({
  channel,
  bookId,
  bookName,
  amount,
  date,
  note,
}) {
  const all = readStorage(MARKETING_COSTS_KEY, initialMarketingCosts);
  const newRecord = {
    id: `MC-${Date.now().toString().slice(-4)}`,
    channel: channel || 'Facebook Ads',
    bookId: bookId || '',
    bookName: bookName || 'সার্বিক প্রচার',
    amount: Number(amount) || 0,
    date: date || new Date().toISOString().slice(0, 10),
    note: note || '',
  };
  const updated = [newRecord, ...all];
  writeStorage(MARKETING_COSTS_KEY, updated);
  return newRecord;
}

export function updateMarketingCost(id, data) {
  const all = readStorage(MARKETING_COSTS_KEY, initialMarketingCosts);
  const updated = all.map(item =>
    item.id === id ? { ...item, ...data, amount: Number(data.amount || item.amount) } : item,
  );
  writeStorage(MARKETING_COSTS_KEY, updated);
  return updated.find(item => item.id === id);
}

export function deleteMarketingCost(id) {
  const all = readStorage(MARKETING_COSTS_KEY, initialMarketingCosts);
  const updated = all.filter(item => item.id !== id);
  writeStorage(MARKETING_COSTS_KEY, updated);
}

// ---------------- Summary Calculations & Previous Month Comparison ----------------
export function getPreviousMonthStr(currentMonthStr) {
  const [year, month] = currentMonthStr.split('-').map(Number);
  const prevDate = new Date(year, month - 2, 1);
  const prevYear = prevDate.getFullYear();
  const prevMonth = String(prevDate.getMonth() + 1).padStart(2, '0');
  return `${prevYear}-${prevMonth}`;
}

export function getMonthlyCostSummary(monthStr) {
  // Current Month
  const currentBooks = getBookCosts(monthStr);
  const currentCommissions = getAuthorCommissions(monthStr);
  const currentEmployees = getEmployeeExpenses(monthStr);
  const currentMarketing = getMarketingCosts(monthStr);

  const bookCostTotal = currentBooks.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const authorCommissionTotal = currentCommissions.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );
  const employeeExpenseTotal = currentEmployees.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );
  const marketingCostTotal = currentMarketing.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );
  const grandTotal =
    bookCostTotal + authorCommissionTotal + employeeExpenseTotal + marketingCostTotal;

  // Previous Month
  const prevMonthStr = getPreviousMonthStr(monthStr);
  const prevBooks = getBookCosts(prevMonthStr);
  const prevCommissions = getAuthorCommissions(prevMonthStr);
  const prevEmployees = getEmployeeExpenses(prevMonthStr);
  const prevMarketing = getMarketingCosts(prevMonthStr);

  const prevGrandTotal =
    prevBooks.reduce((sum, item) => sum + Number(item.amount || 0), 0) +
    prevCommissions.reduce((sum, item) => sum + Number(item.amount || 0), 0) +
    prevEmployees.reduce((sum, item) => sum + Number(item.amount || 0), 0) +
    prevMarketing.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  // Growth percentage
  let percentageChange = 0;
  if (prevGrandTotal > 0) {
    percentageChange = Math.round(((grandTotal - prevGrandTotal) / prevGrandTotal) * 100);
  } else if (grandTotal > 0) {
    percentageChange = 100;
  }

  return {
    monthStr,
    prevMonthStr,
    bookCostTotal,
    authorCommissionTotal,
    employeeExpenseTotal,
    marketingCostTotal,
    grandTotal,
    prevGrandTotal,
    percentageChange,
    bookCount: currentBooks.length,
    commissionCount: currentCommissions.length,
    employeeCount: currentEmployees.length,
    marketingCount: currentMarketing.length,
  };
}

// ---------------- Export Monthly Report to CSV ----------------
export function exportMonthlyReportCsv(monthStr) {
  const summary = getMonthlyCostSummary(monthStr);
  const books = getBookCosts(monthStr);
  const commissions = getAuthorCommissions(monthStr);
  const employees = getEmployeeExpenses(monthStr);
  const marketing = getMarketingCosts(monthStr);

  let csv = '\uFEFF'; // UTF-8 BOM for Excel Bengali character rendering

  csv += `Hosonta Prokashon - Monthly Cost Report (${monthStr})\n`;
  csv += `Generated At,${new Date().toLocaleString('bn-BD')}\n\n`;

  // Summary section
  csv += 'COST SUMMARY (টোটাল কস্ট সামারি)\n';
  csv += `Total Book Production Cost (মোট বই প্রকাশনা খরচ),৳${summary.bookCostTotal}\n`;
  csv += `Total Author Commission Paid (মোট লেখক কমিশন),৳${summary.authorCommissionTotal}\n`;
  csv += `Total Employee Expense (মোট কর্মচারী খরচ),৳${summary.employeeExpenseTotal}\n`;
  csv += `Total Marketing Cost (মোট মার্কেটিং খরচ),৳${summary.marketingCostTotal}\n`;
  csv += `GRAND TOTAL COST (সর্বমোট খরচ),৳${summary.grandTotal}\n`;
  csv += `Previous Month (${summary.prevMonthStr}),৳${summary.prevGrandTotal}\n`;
  csv += `Monthly Change (মাসিক পরিবর্তন),${summary.percentageChange > 0 ? '+' : ''}${summary.percentageChange}%\n\n`;

  // 1. Book Costs
  csv += 'TABLE 1: BOOK PRODUCTION COSTS (বইয়ের খরচ)\n';
  csv += 'ID,Book Name,Cost Type,Amount (৳),Date,Note\n';
  books.forEach(b => {
    csv += `"${b.id}","${b.bookName}","${b.costType}","${b.amount}","${b.date}","${b.note || ''}"\n`;
  });
  csv += '\n';

  // 2. Author Commissions
  csv += 'TABLE 2: AUTHOR COMMISSIONS (লেখক কমিশন)\n';
  csv += 'ID,Author,Book,Amount (৳),Date,Payment Method,Note\n';
  commissions.forEach(c => {
    csv += `"${c.id}","${c.authorName}","${c.bookName || ''}","${c.amount}","${c.date}","${c.method}","${c.note || ''}"\n`;
  });
  csv += '\n';

  // 3. Employee Expenses
  csv += 'TABLE 3: EMPLOYEE EXPENSES (কর্মচারী খরচ)\n';
  csv += 'ID,Employee,Expense Type,Amount (৳),Date,Note\n';
  employees.forEach(e => {
    csv += `"${e.id}","${e.employeeName}","${e.expenseType}","${e.amount}","${e.date}","${e.note || ''}"\n`;
  });
  csv += '\n';

  // 4. Marketing Costs
  csv += 'TABLE 4: MARKETING COSTS (মার্কেটিং খরচ)\n';
  csv += 'ID,Channel,Related Book,Amount (৳),Date,Note\n';
  marketing.forEach(m => {
    csv += `"${m.id}","${m.channel}","${m.bookName || ''}","${m.amount}","${m.date}","${m.note || ''}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Hosonta_Total_Cost_${monthStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
