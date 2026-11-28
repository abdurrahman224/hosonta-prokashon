const STORAGE_KEY = 'hoshonto_payment_requests';

export const MIN_WITHDRAWAL = 500;
export const PAYMENT_METHODS = ['bKash', 'Nagad', 'Rocket', 'Bank transfer'];

const initialSeedRequests = [
  {
    id: 'PR-1001',
    userId: '1',
    authorName: 'সায়ন্তনী রায়',
    authorEmail: 'author@hosontoprokashon.com',
    amount: 24500,
    method: 'bKash',
    account: '01711-234567',
    note: 'Monthly royalty withdrawal for Nov 2026',
    requestedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    status: 'Pending',
  },
  {
    id: 'PR-1002',
    userId: '2',
    authorName: 'আব্দুর রহমান আল আনসারী',
    authorEmail: 'ansari.author@gmail.com',
    amount: 38000,
    method: 'Bank transfer',
    account: 'Islami Bank A/C: 205011234008',
    note: 'Royalty payout for book sales',
    requestedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: 'Approved',
  },
  {
    id: 'PR-1003',
    userId: '3',
    authorName: "মনজুর সা'দ",
    authorEmail: 'manzur.saad@gmail.com',
    amount: 18200,
    method: 'Nagad',
    account: '01822-987654',
    note: 'Q3 Book sales royalty',
    requestedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    status: 'Paid',
  },
  {
    id: 'PR-1004',
    userId: '4',
    authorName: 'আবু সালেহ সাদী',
    authorEmail: 'saleh.sadi@gmail.com',
    amount: 12500,
    method: 'bKash',
    account: '01911-554433',
    note: 'Urgent withdrawal',
    requestedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    status: 'Pending',
  },
];

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSeedRequests));
      return initialSeedRequests;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : initialSeedRequests;
  } catch {
    return initialSeedRequests;
  }
}

function writeAll(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Storage unavailable
  }
}

export function getAllPaymentRequests() {
  return readAll();
}

export function getPaymentRequests(userId) {
  return readAll().filter(request => String(request.userId) === String(userId));
}

export function addPaymentRequest({ userId, authorName, authorEmail, amount, method, account, note }) {
  const all = readAll();
  const request = {
    id: `PR-${1001 + all.length}`,
    userId,
    authorName: authorName || 'Author',
    authorEmail: authorEmail || '',
    amount: Number(amount),
    method,
    account,
    note,
    requestedAt: new Date().toISOString(),
    status: 'Pending',
  };
  writeAll([request, ...all]);
  return request;
}

export function addDirectAuthorPayment({ userId, authorName, authorEmail, amount, method, account, note }) {
  const all = readAll();
  const nowIso = new Date().toISOString();
  const payment = {
    id: `PR-${1001 + all.length}`,
    userId,
    authorName: authorName || 'Author',
    authorEmail: authorEmail || '',
    amount: Number(amount),
    method: method || 'Cash',
    account: account || 'Direct Payout',
    adminNote: note || 'Direct royalty payment',
    requestedAt: nowIso,
    reviewedAt: nowIso,
    status: 'Paid',
  };
  writeAll([payment, ...all]);
  return payment;
}

export function updatePaymentRequestStatus(id, status, adminNote = '') {
  const all = readAll();
  const updated = all.map(request =>
    request.id === id
      ? {
          ...request,
          status,
          adminNote: adminNote || request.adminNote,
          reviewedAt: new Date().toISOString(),
        }
      : request,
  );
  writeAll(updated);
  return updated;
}

export function cancelPaymentRequest(id) {
  writeAll(
    readAll().map(request =>
      request.id === id && request.status === 'Pending'
        ? { ...request, status: 'Cancelled' }
        : request,
    ),
  );
}

// Money already requested, approved or paid out; no longer in the balance.
export function getCommittedAmount(requests) {
  return requests
    .filter(request => ['Pending', 'Approved', 'Paid'].includes(request.status))
    .reduce((sum, request) => sum + Number(request.amount || 0), 0);
}
