const SETTINGS_KEY = 'hosonta_followup_settings_v1';
const ASSIGNMENTS_KEY = 'hosonta_followup_assignments_v1';
const LOGS_KEY = 'hosonta_followup_logs_v1';

export const FOLLOWUP_OUTCOMES = [
  'Interested - Hot Lead',
  'Will Order Soon',
  'Callback Requested',
  'Placed Order',
  'Not Reachable',
  'Not Interested',
];

export const FOLLOWUP_CHANNELS = ['Phone Call', 'WhatsApp', 'SMS', 'Email'];

function daysAgoIso(days, hour = 14, minute = 20) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function getTodayDateStr() {
  return new Date().toISOString().slice(0, 10);
}

const DEFAULT_SETTINGS = {
  dailyTarget: 10,
  assignedModeratorId: 'user-moderator-1',
  assignedModeratorName: 'মেহেদী হাসান',
  updatedAt: daysAgoIso(1, 10, 0),
};

const DEFAULT_ASSIGNMENTS = {
  'user-reader-1': {
    userId: 'user-reader-1',
    assignedToId: 'user-moderator-1',
    assignedToName: 'মেহেদী হাসান',
    assignedToRole: 'moderator',
    status: 'Callback Requested',
    assignedDate: getTodayDateStr(),
    nextFollowUpDate: getTodayDateStr(),
    updatedAt: daysAgoIso(1, 15, 30),
  },
  'user-reader-2': {
    userId: 'user-reader-2',
    assignedToId: 'user-moderator-1',
    assignedToName: 'মেহেদী হাসান',
    assignedToRole: 'moderator',
    status: 'Interested - Hot Lead',
    assignedDate: getTodayDateStr(),
    nextFollowUpDate: getTodayDateStr(),
    updatedAt: daysAgoIso(0, 11, 15),
  },
  'user-reader-3': {
    userId: 'user-reader-3',
    assignedToId: 'user-moderator-1',
    assignedToName: 'মেহেদী হাসান',
    assignedToRole: 'moderator',
    status: 'Pending',
    assignedDate: getTodayDateStr(),
    nextFollowUpDate: '',
    updatedAt: daysAgoIso(0, 9, 0),
  },
  'user-reader-4': {
    userId: 'user-reader-4',
    assignedToId: 'user-moderator-1',
    assignedToName: 'মেহেদী হাসান',
    assignedToRole: 'moderator',
    status: 'Pending',
    assignedDate: getTodayDateStr(),
    nextFollowUpDate: '',
    updatedAt: daysAgoIso(0, 9, 0),
  },
  'user-reader-7': {
    userId: 'user-reader-7',
    assignedToId: 'user-moderator-1',
    assignedToName: 'মেহেদী হাসান',
    assignedToRole: 'moderator',
    status: 'Placed Order',
    assignedDate: getTodayDateStr(),
    nextFollowUpDate: '',
    updatedAt: daysAgoIso(2, 16, 40),
  },
};

const DEFAULT_LOGS = [
  {
    id: 'FU-1003',
    userId: 'user-reader-2',
    userName: 'রাকিব হাসান',
    userPhone: '01822234567',
    followedById: 'user-moderator-1',
    followedByName: 'মেহেদী হাসান',
    followedByRole: 'moderator',
    channel: 'Phone Call',
    outcome: 'Interested - Hot Lead',
    retargetBooks: 'বুকের ভেতর এক ফালি রোদ',
    note: 'Customer kept 2 books in cart; requested 25% discount confirmation before placing COD order tonight.',
    nextFollowUpDate: getTodayDateStr(),
    createdAt: daysAgoIso(0, 11, 15),
  },
  {
    id: 'FU-1002',
    userId: 'user-reader-1',
    userName: 'মাহমুদা রহমান',
    userPhone: '01711123456',
    followedById: 'user-moderator-1',
    followedByName: 'মেহেদী হাসান',
    followedByRole: 'moderator',
    channel: 'WhatsApp',
    outcome: 'Callback Requested',
    retargetBooks: 'আপনার স্বামীকে আগলে রাখুন',
    note: 'Asked to call after 5 PM regarding combo pack delivery charge to Dhanmondi.',
    nextFollowUpDate: getTodayDateStr(),
    createdAt: daysAgoIso(1, 15, 30),
  },
  {
    id: 'FU-1001',
    userId: 'user-reader-7',
    userName: 'আরিফুর রহমান',
    userPhone: '01988776655',
    followedById: 'user-admin-1',
    followedByName: 'আদনান রহমান',
    followedByRole: 'admin',
    channel: 'Phone Call',
    outcome: 'Placed Order',
    retargetBooks: 'নেককার সঙ্গীর খোঁজে',
    note: 'Followed up directly on wishlist book; customer confirmed 3 copies for Barishal.',
    nextFollowUpDate: '',
    createdAt: daysAgoIso(2, 16, 40),
  },
];

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage quota failure
  }
}

export function getFollowUpSettings() {
  const data = readJson(SETTINGS_KEY, DEFAULT_SETTINGS);
  return data && typeof data === 'object' ? { ...DEFAULT_SETTINGS, ...data } : DEFAULT_SETTINGS;
}

export function saveFollowUpSettings({
  dailyTarget,
  assignedModeratorId,
  assignedModeratorName,
}) {
  const next = {
    dailyTarget: Math.max(1, Number(dailyTarget) || 10),
    assignedModeratorId: assignedModeratorId || '',
    assignedModeratorName: assignedModeratorName || 'Moderator',
    updatedAt: new Date().toISOString(),
  };
  writeJson(SETTINGS_KEY, next);
  return next;
}

export function getFollowUpAssignments() {
  const data = readJson(ASSIGNMENTS_KEY, DEFAULT_ASSIGNMENTS);
  return data && typeof data === 'object' ? data : DEFAULT_ASSIGNMENTS;
}

export function assignUserFollowUp({
  userId,
  assignedToId,
  assignedToName,
  assignedToRole = 'moderator',
  status = 'Pending',
  nextFollowUpDate = '',
}) {
  if (!userId) return null;
  const all = getFollowUpAssignments();
  const prev = all[userId] || {};
  const record = {
    ...prev,
    userId,
    assignedToId: assignedToId || prev.assignedToId || '',
    assignedToName: assignedToName || prev.assignedToName || '',
    assignedToRole: assignedToRole || prev.assignedToRole || 'moderator',
    status: status || prev.status || 'Pending',
    assignedDate: getTodayDateStr(),
    nextFollowUpDate: nextFollowUpDate !== undefined ? nextFollowUpDate : prev.nextFollowUpDate || '',
    updatedAt: new Date().toISOString(),
  };
  const next = { ...all, [userId]: record };
  writeJson(ASSIGNMENTS_KEY, next);
  return record;
}

export function assignDailyFollowUpBatch({
  users = [],
  assignedToId,
  assignedToName,
  assignedToRole = 'moderator',
  dailyTarget = 10,
}) {
  if (!assignedToId || !users.length) return 0;
  const all = { ...getFollowUpAssignments() };
  const today = getTodayDateStr();
  const count = Math.max(1, Number(dailyTarget) || 10);

  // Prioritize readers/customers who have cart/wishlist or are not yet followed up today
  const candidates = users
    .filter((u) => u.role === 'user' || u.role === 'author')
    .sort((a, b) => {
      const aScore = (a.cartCount || 0) * 3 + (a.wishlistCount || 0) * 2 + (a.orderCount || 0);
      const bScore = (b.cartCount || 0) * 3 + (b.wishlistCount || 0) * 2 + (b.orderCount || 0);
      return bScore - aScore;
    });

  let assignedCount = 0;
  for (const user of candidates) {
    if (assignedCount >= count) break;
    const prev = all[user.id] || {};
    all[user.id] = {
      ...prev,
      userId: user.id,
      assignedToId,
      assignedToName,
      assignedToRole,
      status: prev.status && prev.status !== 'Placed Order' ? prev.status : 'Pending',
      assignedDate: today,
      updatedAt: new Date().toISOString(),
    };
    assignedCount += 1;
  }

  writeJson(ASSIGNMENTS_KEY, all);
  saveFollowUpSettings({
    dailyTarget: count,
    assignedModeratorId: assignedToId,
    assignedModeratorName: assignedToName,
  });
  return assignedCount;
}

export function getFollowUpLogs() {
  const list = readJson(LOGS_KEY, DEFAULT_LOGS);
  if (!Array.isArray(list)) return DEFAULT_LOGS;
  return [...list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getUserFollowUpLogs(userId) {
  return getFollowUpLogs().filter((log) => String(log.userId) === String(userId));
}

export function addFollowUpLog({
  userId,
  userName,
  userPhone = '',
  followedById,
  followedByName,
  followedByRole = 'moderator',
  channel = 'Phone Call',
  outcome = 'Interested - Hot Lead',
  retargetBooks = '',
  note = '',
  nextFollowUpDate = '',
}) {
  if (!userId) return null;
  const existing = readJson(LOGS_KEY, DEFAULT_LOGS);
  const log = {
    id: `FU-${1001 + existing.length}`,
    userId,
    userName: userName || 'Customer',
    userPhone,
    followedById: followedById || 'staff',
    followedByName: followedByName || 'Staff',
    followedByRole,
    channel,
    outcome,
    retargetBooks: String(retargetBooks || '').trim(),
    note: String(note || '').trim(),
    nextFollowUpDate: nextFollowUpDate || '',
    createdAt: new Date().toISOString(),
  };

  writeJson(LOGS_KEY, [log, ...existing]);

  // Also update user's assignment status & last handler cleanly
  assignUserFollowUp({
    userId,
    assignedToId: followedById,
    assignedToName: followedByName,
    assignedToRole: followedByRole,
    status: outcome,
    nextFollowUpDate,
  });

  return log;
}

export function getTodayFollowUpStats(moderatorId = '') {
  const today = getTodayDateStr();
  const logs = getFollowUpLogs();
  const todayLogs = logs.filter((l) => (l.createdAt || '').slice(0, 10) === today);
  const forModToday = moderatorId
    ? todayLogs.filter((l) => String(l.followedById) === String(moderatorId))
    : todayLogs;
  const uniqueUsersToday = new Set(forModToday.map((l) => String(l.userId))).size;
  return {
    totalCallsToday: forModToday.length,
    uniqueUsersToday,
    allLogsCount: logs.length,
  };
}

const DEFAULT_CART_SEEDS = {
  'user-reader-1': [
    { bookId: 2, quantity: 1 },
    { bookId: 5, quantity: 2 },
  ],
  'user-reader-2': [
    { bookId: 3, quantity: 1 },
    { bookId: 6, quantity: 1 },
  ],
  'user-reader-3': [{ bookId: 1, quantity: 1 }],
  'user-reader-4': [
    { bookId: 4, quantity: 1 },
    { bookId: 7, quantity: 1 },
  ],
  'user-reader-5': [{ bookId: 8, quantity: 2 }],
  'user-reader-7': [{ bookId: 3, quantity: 1 }],
};

export function getUserWishlistIds(user) {
  try {
    const stored = localStorage.getItem(`hosonta_wishlist_${user.id}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore invalid json
  }
  return user.wishlist || [];
}

export function getUserCartItems(user) {
  try {
    const stored = localStorage.getItem(`hosonta_cart_${user.id}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore invalid json
  }
  return user.cart || DEFAULT_CART_SEEDS[user.id] || [];
}
