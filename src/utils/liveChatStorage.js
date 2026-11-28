import usersSeed from '../data/users'

export const CHAT_STORAGE_KEY = 'hosonta_live_chat_v1'
export const CHAT_VISITOR_KEY = 'hosonta_chat_visitor_profile_v1'
export const CHAT_CHANNEL_NAME = 'hosonta_live_chat_sync_v1'

export const QUICK_EMOJIS = [
  '😊',
  '👍',
  '❤️',
  '🙏',
  '📚',
  '✨',
  '🎉',
  '👋',
  '✅',
  '📦',
  '😂',
  '🤝',
]

export const REACTION_EMOJIS = ['👍', '❤️', '😊', '🎉', '🙏']

export function formatChatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatRelativeTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const diffMs = Date.now() - d.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

export function formatDayDivider(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export const MANAGEMENT_ROLES = new Set(['admin', 'moderator', 'employee'])

export function isManagementRole(role) {
  return MANAGEMENT_ROLES.has(role)
}

function minutesAgoIso(minutes) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString()
}

function getDefaultStaffSnapshot(id, fallbackName, fallbackRole, fallbackAvatar) {
  const found = usersSeed.find((u) => u.id === id)
  return {
    id: found?.id || id,
    name: found?.name || fallbackName,
    role: found?.role || fallbackRole,
    avatar: found?.avatar || fallbackAvatar,
  }
}

function createSeedState() {
  const admin = getDefaultStaffSnapshot(
    'user-admin-1',
    'আদনান রহমান',
    'admin',
    'https://i.pravatar.cc/100?img=68',
  )
  const moderator = getDefaultStaffSnapshot(
    'user-moderator-1',
    'মেহেদী হাসান',
    'moderator',
    'https://i.pravatar.cc/100?img=11',
  )
  const employee = getDefaultStaffSnapshot(
    'user-employee-1',
    'নুসরাত জাহান',
    'employee',
    'https://i.pravatar.cc/100?img=32',
  )

  const convPublic1 = {
    id: 'pub-guest-demo-1',
    type: 'public',
    title: 'তানজিম আহমেদ',
    visitorId: 'guest-demo-1',
    visitorName: 'তানজিম আহমেদ',
    visitorPhone: '01715-884422',
    visitorEmail: 'tanzim@example.com',
    visitorRole: 'guest',
    visitorAvatar: 'https://i.pravatar.cc/100?img=14',
    sourcePage: '/books',
    status: 'open',
    assignedTo: moderator,
    readBy: {},
    createdAt: minutesAgoIso(48),
    updatedAt: minutesAgoIso(6),
  }

  const convPublic2 = {
    id: 'pub-user-user-reader-1',
    type: 'public',
    title: 'মাহমুদা রহমান',
    visitorId: 'user-reader-1',
    visitorName: 'মাহমুদা রহমান',
    visitorPhone: '01711-123456',
    visitorEmail: 'reader@hosontoprokashon.com',
    visitorRole: 'user',
    visitorAvatar: 'https://i.pravatar.cc/100?img=49',
    sourcePage: '/track-order',
    status: 'open',
    assignedTo: null,
    readBy: {},
    createdAt: minutesAgoIso(125),
    updatedAt: minutesAgoIso(18),
  }

  const convTeamGeneral = {
    id: 'team-group-general',
    type: 'team_group',
    title: 'Management Lounge',
    description: 'Admin, moderators & staff general coordination',
    participantIds: [admin.id, moderator.id, employee.id],
    status: 'open',
    readBy: {
      [admin.id]: minutesAgoIso(25),
    },
    createdAt: minutesAgoIso(600),
    updatedAt: minutesAgoIso(14),
  }

  const convTeamSupport = {
    id: 'team-group-support',
    type: 'team_group',
    title: 'Support & Order Handoff',
    description: 'Customer follow-ups, stock checks & parcel escalations',
    participantIds: [admin.id, moderator.id, employee.id],
    status: 'open',
    readBy: {},
    createdAt: minutesAgoIso(420),
    updatedAt: minutesAgoIso(32),
  }

  const convDmAdminMod = {
    id: `dm-${[admin.id, moderator.id].sort().join('__')}`,
    type: 'team_dm',
    title: 'Direct Message',
    participantIds: [admin.id, moderator.id],
    status: 'open',
    readBy: {},
    createdAt: minutesAgoIso(300),
    updatedAt: minutesAgoIso(22),
  }

  const convDmModEmp = {
    id: `dm-${[moderator.id, employee.id].sort().join('__')}`,
    type: 'team_dm',
    title: 'Direct Message',
    participantIds: [moderator.id, employee.id],
    status: 'open',
    readBy: {},
    createdAt: minutesAgoIso(180),
    updatedAt: minutesAgoIso(40),
  }

  const messagesByConv = {
    [convPublic1.id]: [
      {
        id: 'seed-msg-1',
        conversationId: convPublic1.id,
        senderId: 'guest-demo-1',
        senderName: 'তানজিম আহমেদ',
        senderRole: 'guest',
        senderAvatar: convPublic1.visitorAvatar,
        senderType: 'visitor',
        text: 'আসসালামু আলাইকুম! "বুকের ভেতর এক ফালি রোদ" বইটির হার্ডকভার সংস্করণ কি এখন স্টকে আছে?',
        images: [],
        reactions: [],
        createdAt: minutesAgoIso(48),
      },
      {
        id: 'seed-msg-2',
        conversationId: convPublic1.id,
        senderId: moderator.id,
        senderName: moderator.name,
        senderRole: moderator.role,
        senderAvatar: moderator.avatar,
        senderType: 'staff',
        text: 'ওয়ালাইকুমুস সালাম! জি ভাইয়া, বইটি স্টকে আছে। আজ অর্ডার করলে ঢাকায় ২৪-৪৮ ঘণ্টার মধ্যে ডেলিভারি পাবেন।',
        images: [],
        reactions: [{ emoji: '👍', userId: 'guest-demo-1', userName: 'তানজিম আহমেদ' }],
        createdAt: minutesAgoIso(42),
      },
      {
        id: 'seed-msg-3',
        conversationId: convPublic1.id,
        senderId: 'guest-demo-1',
        senderName: 'তানজিম আহমেদ',
        senderRole: 'guest',
        senderAvatar: convPublic1.visitorAvatar,
        senderType: 'visitor',
        text: 'দারুণ! ক্যাশ অন ডেলিভারিতে কি ৫টা কপি একসাথে অর্ডার করা যাবে?',
        images: [],
        reactions: [],
        createdAt: minutesAgoIso(6),
      },
    ],
    [convPublic2.id]: [
      {
        id: 'seed-msg-4',
        conversationId: convPublic2.id,
        senderId: 'user-reader-1',
        senderName: 'মাহমুদা রহমান',
        senderRole: 'user',
        senderAvatar: convPublic2.visitorAvatar,
        senderType: 'visitor',
        text: 'হ্যালো, আমার আগের অর্ডারটির ডেলিভারি আপডেট একটু জানাবেন?',
        images: [],
        reactions: [],
        createdAt: minutesAgoIso(18),
      },
    ],
    [convTeamGeneral.id]: [
      {
        id: 'seed-msg-5',
        conversationId: convTeamGeneral.id,
        senderId: admin.id,
        senderName: admin.name,
        senderRole: admin.role,
        senderAvatar: admin.avatar,
        senderType: 'staff',
        text: 'সবাইকে শুভেচ্ছা! আজকে লাইভ চ্যাটে নতুন বইয়ের অনুসন্ধান একটু বেশি আসতে পারে, মডারেটর ও স্টাফরা দ্রুত রেসপন্স করবেন।',
        images: [],
        reactions: [
          { emoji: '👍', userId: moderator.id, userName: moderator.name },
          { emoji: '✅', userId: employee.id, userName: employee.name },
        ],
        createdAt: minutesAgoIso(90),
      },
      {
        id: 'seed-msg-6',
        conversationId: convTeamGeneral.id,
        senderId: employee.id,
        senderName: employee.name,
        senderRole: employee.role,
        senderAvatar: employee.avatar,
        senderType: 'staff',
        text: 'জি ভাইয়া, কাউন্টার ও অনলাইন স্টক আপডেট করা হয়েছে।',
        images: [],
        reactions: [],
        createdAt: minutesAgoIso(14),
      },
    ],
    [convTeamSupport.id]: [
      {
        id: 'seed-msg-7',
        conversationId: convTeamSupport.id,
        senderId: moderator.id,
        senderName: moderator.name,
        senderRole: moderator.role,
        senderAvatar: moderator.avatar,
        senderType: 'staff',
        text: '@নুসরাত আপু, তানজিম ভাইয়ার ৫ কপি হার্ডকভার অর্ডার রেডি থাকলে জানাবেন।',
        images: [],
        reactions: [],
        createdAt: minutesAgoIso(32),
      },
    ],
    [convDmAdminMod.id]: [
      {
        id: 'seed-msg-8',
        conversationId: convDmAdminMod.id,
        senderId: moderator.id,
        senderName: moderator.name,
        senderRole: moderator.role,
        senderAvatar: moderator.avatar,
        senderType: 'staff',
        text: 'ভাইয়া, আজকের পেন্ডিং রিভিউ আর কাস্টমার ফলোআপগুলো চেক করছি।',
        images: [],
        reactions: [],
        createdAt: minutesAgoIso(22),
      },
    ],
    [convDmModEmp.id]: [
      {
        id: 'seed-msg-9',
        conversationId: convDmModEmp.id,
        senderId: employee.id,
        senderName: employee.name,
        senderRole: employee.role,
        senderAvatar: employee.avatar,
        senderType: 'staff',
        text: 'মেহেদী ভাই, ডেলিভারি পার্সেলগুলো দুপুর ২টার মধ্যে ডিসপ্যাচ হবে।',
        images: [],
        reactions: [{ emoji: '👍', userId: moderator.id, userName: moderator.name }],
        createdAt: minutesAgoIso(40),
      },
    ],
  }

  return {
    conversations: [
      convPublic1,
      convTeamGeneral,
      convPublic2,
      convDmAdminMod,
      convTeamSupport,
      convDmModEmp,
    ],
    messagesByConv,
  }
}

export function loadLiveChatState() {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY)
    if (!raw) {
      const seed = createSeedState()
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(seed))
      return seed
    }
    const parsed = JSON.parse(raw)
    if (
      !parsed ||
      !Array.isArray(parsed.conversations) ||
      typeof parsed.messagesByConv !== 'object'
    ) {
      const seed = createSeedState()
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(seed))
      return seed
    }
    return parsed
  } catch {
    return createSeedState()
  }
}

export function saveLiveChatState(state) {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function getOrCreateGuestProfile() {
  try {
    const raw = localStorage.getItem(CHAT_VISITOR_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.visitorId) return parsed
    }
  } catch {
    // ignore storage errors
  }

  const profile = {
    visitorId: `guest-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: 'Guest Reader',
    phone: '',
    email: '',
    avatar: '',
  }
  try {
    localStorage.setItem(CHAT_VISITOR_KEY, JSON.stringify(profile))
  } catch {
    // ignore
  }
  return profile
}

export function saveGuestProfile(updates) {
  const current = getOrCreateGuestProfile()
  const next = { ...current, ...updates }
  try {
    localStorage.setItem(CHAT_VISITOR_KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
  return next
}

export function getDmConversationId(userIdA, userIdB) {
  return `dm-${[String(userIdA), String(userIdB)].sort().join('__')}`
}

export function getPublicConversationId(currentUser, guestProfile) {
  if (currentUser?.id) {
    return `pub-user-${currentUser.id}`
  }
  return `pub-${guestProfile.visitorId}`
}

/**
 * Compresses an uploaded image file cleanly to a WebP/JPEG data URL
 * so multiple chat images persist smoothly in localStorage.
 */
export function compressChatImage(file, { maxWidth = 960, maxHeight = 960, quality = 0.78 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith('image/')) {
      reject(new Error('Please select a valid image file.'))
      return
    }

    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read image file.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Unsupported image format.'))
      img.onload = () => {
        let { width, height } = img
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, width)
        canvas.height = Math.max(1, height)
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve({
            id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            url: String(reader.result),
            name: file.name || 'image.png',
          })
          return
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        let dataUrl = ''
        try {
          dataUrl = canvas.toDataURL('image/webp', quality)
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', quality)
          }
        } catch {
          dataUrl = canvas.toDataURL('image/jpeg', quality)
        }
        resolve({
          id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          url: dataUrl,
          name: file.name || 'photo.jpg',
        })
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}
