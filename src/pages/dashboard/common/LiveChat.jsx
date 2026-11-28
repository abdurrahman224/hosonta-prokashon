import { useEffect, useMemo, useState } from 'react'
import {
  FiArrowLeft,
  FiCheckCircle,
  FiImage,
  FiInfo,
  FiMessageCircle,
  FiPlus,
  FiRotateCcw,
  FiSearch,
  FiUserCheck,
  FiUsers,
  FiX,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useAuth } from '../../../context/useAuth'
import { useChat } from '../../../context/useChat'
import {
  compressChatImage,
  formatRelativeTime,
} from '../../../utils/liveChatStorage'
import {
  ChatAvatar,
  ChatComposer,
  ChatImageLightbox,
  ChatMessageList,
  ChatRoleBadge,
} from '../../../components/chat/ChatShared'

const CANNED_REPLIES = [
  'আসসালামু আলাইকুম! হসন্ত প্রকাশন সাপোর্টে স্বাগতম। কীভাবে সাহায্য করতে পারি?',
  'জি, বইটি আমাদের স্টকে রয়েছে। অর্ডার করলে ঢাকায় ২৪-৪৮ ঘণ্টায় ডেলিভারি পাবেন।',
  'আপনার অর্ডার আইডি বা মোবাইল নম্বরটি দিলে আমি এখনই চেক করে জানাচ্ছি।',
  'ধন্যবাদ আমাদের সাথে যোগাযোগ করার জন্য! আরও কোনো প্রশ্ন থাকলে নির্দ্বিধায় জানাবেন।',
]

function resolveConversationMeta(conv, currentUserId, users) {
  if (!conv) {
    return {
      title: '',
      subtitle: '',
      avatar: '',
      role: 'guest',
      isGroup: false,
      otherUser: null,
    }
  }

  if (conv.type === 'public') {
    const locationPart = conv.sourcePage ? `From ${conv.sourcePage}` : 'Website Visitor'
    return {
      title: conv.visitorName || conv.title || 'Website Visitor',
      subtitle: `${locationPart}${conv.visitorPhone ? ` · ${conv.visitorPhone}` : ''}`,
      avatar: conv.visitorAvatar || '',
      role: conv.visitorRole || 'guest',
      isGroup: false,
      otherUser: null,
    }
  }

  if (conv.type === 'team_group') {
    const count = conv.participantIds?.length || 0
    return {
      title: conv.title || 'Team Channel',
      subtitle: conv.description || `${count} management members`,
      avatar: '',
      role: null,
      isGroup: true,
      otherUser: null,
    }
  }

  // team_dm
  const otherId = (conv.participantIds || []).find((id) => id !== currentUserId)
  const otherUser = users.find((u) => u.id === otherId) || null
  return {
    title: otherUser?.name || 'Team Member',
    subtitle: otherUser
      ? `${otherUser.role?.charAt(0).toUpperCase()}${otherUser.role?.slice(1)} · Direct Message`
      : 'Direct Message',
    avatar: otherUser?.avatar || '',
    role: otherUser?.role || 'employee',
    isGroup: false,
    otherUser,
  }
}

export default function LiveChat() {
  const { currentUser, users = [] } = useAuth()
  const {
    staffConversations,
    messagesByConv,
    activeManagementUsers,
    typingMap,
    sendMessage,
    ensureDirectConversation,
    createTeamGroup,
    markConversationRead,
    toggleReaction,
    setConversationStatus,
    assignConversation,
    emitTyping,
    getUnreadCountForConversation,
  } = useChat()

  const [activeConvId, setActiveConvId] = useState(
    () => staffConversations[0]?.id || null,
  )
  const [filterTab, setFilterTab] = useState('all') // 'all' | 'public' | 'team' | 'unread'
  const [search, setSearch] = useState('')
  const [showInfo, setShowInfo] = useState(true)
  const [mobileShowThread, setMobileShowThread] = useState(false)
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [lightboxImage, setLightboxImage] = useState(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  const selectedConv = useMemo(
    () =>
      staffConversations.find((c) => c.id === activeConvId) ||
      staffConversations[0] ||
      null,
    [activeConvId, staffConversations],
  )

  const effectiveConvId = selectedConv?.id || null

  const activeMessages = useMemo(
    () => (effectiveConvId ? messagesByConv[effectiveConvId] || [] : []),
    [effectiveConvId, messagesByConv],
  )

  // Mark active conversation read whenever opened or new message arrives
  useEffect(() => {
    if (effectiveConvId && currentUser?.id) {
      markConversationRead(effectiveConvId, currentUser.id)
    }
  }, [
    effectiveConvId,
    activeMessages.length,
    currentUser?.id,
    markConversationRead,
  ])

  const colleagues = useMemo(
    () => activeManagementUsers.filter((u) => u.id !== currentUser?.id),
    [activeManagementUsers, currentUser?.id],
  )

  const publicUnreadTotal = useMemo(
    () =>
      staffConversations
        .filter((c) => c.type === 'public')
        .reduce(
          (sum, c) => sum + getUnreadCountForConversation(c, currentUser?.id),
          0,
        ),
    [currentUser?.id, getUnreadCountForConversation, staffConversations],
  )

  const teamUnreadTotal = useMemo(
    () =>
      staffConversations
        .filter((c) => c.type !== 'public')
        .reduce(
          (sum, c) => sum + getUnreadCountForConversation(c, currentUser?.id),
          0,
        ),
    [currentUser?.id, getUnreadCountForConversation, staffConversations],
  )

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase()
    return staffConversations.filter((conv) => {
      if (filterTab === 'public' && conv.type !== 'public') return false
      if (filterTab === 'team' && conv.type === 'public') return false
      if (
        filterTab === 'unread' &&
        getUnreadCountForConversation(conv, currentUser?.id) === 0
      ) {
        return false
      }
      if (!q) return true

      const meta = resolveConversationMeta(conv, currentUser?.id, users)
      const msgs = messagesByConv[conv.id] || []
      const lastMsgText = msgs[msgs.length - 1]?.text || ''
      return (
        meta.title.toLowerCase().includes(q) ||
        meta.subtitle.toLowerCase().includes(q) ||
        lastMsgText.toLowerCase().includes(q)
      )
    })
  }, [
    currentUser?.id,
    filterTab,
    getUnreadCountForConversation,
    messagesByConv,
    search,
    staffConversations,
    users,
  ])

  const selectedMeta = useMemo(
    () => resolveConversationMeta(selectedConv, currentUser?.id, users),
    [currentUser?.id, selectedConv, users],
  )

  const typingNames = useMemo(() => {
    if (!effectiveConvId) return []
    const convTyping = typingMap[effectiveConvId] || {}
    return Object.values(convTyping)
      .filter((t) => t.id !== currentUser?.id)
      .map((t) => t.name)
  }, [currentUser?.id, effectiveConvId, typingMap])

  const sharedMedia = useMemo(() => {
    const items = []
    activeMessages.forEach((msg) => {
      ;(msg.images || []).forEach((img) => {
        items.push({ ...img, senderName: msg.senderName, createdAt: msg.createdAt })
      })
    })
    return items.reverse()
  }, [activeMessages])

  const handleOpenColleagueDm = (colleague) => {
    const dmId = ensureDirectConversation(colleague)
    if (dmId) {
      setActiveConvId(dmId)
      setMobileShowThread(true)
    }
  }

  const handleSend = ({ text, images }) => {
    if (!effectiveConvId) return
    sendMessage({
      conversationId: effectiveConvId,
      text,
      images,
    })
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    setIsDraggingOver(false)
    if (!effectiveConvId) return
    const files = Array.from(e.dataTransfer?.files || []).filter((f) =>
      f.type?.startsWith('image/'),
    )
    if (files.length === 0) return
    try {
      const processed = await Promise.all(
        files.slice(0, 4).map((f) => compressChatImage(f)),
      )
      handleSend({ text: '', images: processed })
    } catch {
      toast.error('Failed to upload dropped image.')
    }
  }

  const handleQuickReplySend = (replyText) => {
    if (!effectiveConvId) return
    sendMessage({
      conversationId: effectiveConvId,
      text: replyText,
      images: [],
    })
  }

  return (
    <div className="flex h-[calc(100vh-7.25rem)] min-h-[540px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
      {/* LEFT PANE: Conversations & Team Directory */}
      <aside
        className={`${
          mobileShowThread ? 'hidden md:flex' : 'flex'
        } w-full shrink-0 flex-col border-r border-slate-200 bg-white md:w-80 lg:w-[340px]`}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
              <FiMessageCircle size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="font-heading text-lg font-bold leading-tight text-slate-900">
                Live Chat
              </h2>
              <p className="text-[11px] text-slate-500">
                Public Support &amp; Team Messaging
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsGroupModalOpen(true)}
            title="New Team Group"
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <FiPlus size={14} />
            Group
          </button>
        </div>

        {/* Search */}
        <div className="px-3.5 pt-3">
          <div className="relative">
            <FiSearch
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search visitors, team, messages..."
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 px-3.5 py-2.5">
          {[
            { key: 'all', label: 'All', badge: 0 },
            { key: 'public', label: 'Public', badge: publicUnreadTotal },
            { key: 'team', label: 'Team', badge: teamUnreadTotal },
            { key: 'unread', label: 'Unread', badge: 0 },
          ].map((tab) => {
            const active = filterTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilterTab(tab.key)}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge > 0 && (
                  <span
                    className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                      active
                        ? 'bg-white text-slate-900'
                        : 'bg-slate-700 text-white'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Active Management Colleagues Strip (Direct Messaging) */}
        {colleagues.length > 0 && (
          <div className="border-y border-slate-100 bg-slate-50/60 px-3.5 py-2.5">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Management Team (Click to DM)
            </p>
            <div className="flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:thin]">
              {colleagues.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => handleOpenColleagueDm(member)}
                  className="group flex w-14 shrink-0 flex-col items-center gap-1 text-center"
                  title={`Message ${member.name} (${member.role})`}
                >
                  <ChatAvatar
                    src={member.avatar}
                    name={member.name}
                    size="sm"
                    online
                  />
                  <span className="w-full truncate text-[10px] font-medium text-slate-700 group-hover:text-dark">
                    {member.name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Conversations List */}
        <div
          className="flex-1 overflow-y-auto px-2 py-2 [scrollbar-width:thin]"
          data-no-translate="true"
        >
          {filteredConversations.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No matching conversations found.
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredConversations.map((conv) => {
                const meta = resolveConversationMeta(conv, currentUser?.id, users)
                const msgs = messagesByConv[conv.id] || []
                const lastMsg = msgs[msgs.length - 1]
                const unread = getUnreadCountForConversation(conv, currentUser?.id)
                const isSelected = conv.id === effectiveConvId
                const isConvTyping = Object.values(typingMap[conv.id] || {}).some(
                  (t) => t.id !== currentUser?.id,
                )

                const previewText = isConvTyping
                  ? 'Typing...'
                  : lastMsg
                    ? lastMsg.images?.length > 0 && !lastMsg.text
                      ? '📷 Sent a photo'
                      : `${lastMsg.senderId === currentUser?.id ? 'You: ' : ''}${
                          lastMsg.text || '📷 Photo'
                        }`
                    : 'No messages yet'

                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => {
                      setActiveConvId(conv.id)
                      setMobileShowThread(true)
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition ${
                      isSelected
                        ? 'bg-slate-100'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <ChatAvatar
                      src={meta.avatar}
                      name={meta.title}
                      size="md"
                      online={conv.type !== 'team_group'}
                      isGroup={meta.isGroup}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`truncate text-[13px] ${
                            unread > 0
                              ? 'font-bold text-slate-900'
                              : 'font-semibold text-slate-800'
                          }`}
                        >
                          {meta.title}
                        </span>
                        <span className="shrink-0 text-[10px] text-slate-400">
                          {formatRelativeTime(conv.updatedAt)}
                        </span>
                      </div>

                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <p
                          className={`truncate text-xs ${
                            isConvTyping
                              ? 'font-medium text-emerald-600'
                              : unread > 0
                                ? 'font-semibold text-slate-900'
                                : 'text-slate-500'
                          }`}
                        >
                          {previewText}
                        </p>
                        {unread > 0 && (
                          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 px-1.5 text-[10px] font-bold text-white">
                            {unread}
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex items-center gap-1.5">
                        {conv.type === 'public' ? (
                          <>
                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                              Public
                            </span>
                            {conv.status === 'resolved' && (
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                                Resolved
                              </span>
                            )}
                          </>
                        ) : conv.type === 'team_group' ? (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                            Team Group
                          </span>
                        ) : (
                          meta.role && <ChatRoleBadge role={meta.role} />
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </aside>

      {/* CENTER PANE: Active Conversation */}
      <section
        className={`${
          mobileShowThread ? 'flex' : 'hidden md:flex'
        } relative min-w-0 flex-1 flex-col bg-slate-50/70`}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDraggingOver(true)
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDrop}
      >
        {!selectedConv ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              <FiMessageCircle size={26} />
            </div>
            <h3 className="font-heading text-lg font-bold text-slate-900">
              Select a conversation
            </h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500">
              Choose a public customer chat or click any team member on the left to start messaging.
            </p>
          </div>
        ) : (
          <>
            {/* Thread Header (No call/video call buttons) */}
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setMobileShowThread(false)}
                  className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 md:hidden"
                  aria-label="Back to conversations"
                >
                  <FiArrowLeft size={18} />
                </button>
                <ChatAvatar
                  src={selectedMeta.avatar}
                  name={selectedMeta.title}
                  size="md"
                  online={selectedConv.type !== 'team_group'}
                  isGroup={selectedMeta.isGroup}
                />
                <div className="min-w-0" data-no-translate="true">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-heading text-sm font-bold text-slate-900 sm:text-base">
                      {selectedMeta.title}
                    </h3>
                    {selectedConv.type === 'public' ? (
                      <span
                        className={`hidden sm:inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-medium ${
                          selectedConv.status === 'resolved'
                            ? 'text-emerald-700'
                            : 'text-slate-600'
                        }`}
                      >
                        {selectedConv.status === 'resolved' ? 'Resolved' : 'Open'}
                      </span>
                    ) : (
                      selectedMeta.role && <ChatRoleBadge role={selectedMeta.role} />
                    )}
                  </div>
                  <p className="truncate text-[11px] text-slate-500">
                    {selectedMeta.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {selectedConv.type === 'public' && (
                  <>
                    {!selectedConv.assignedTo ? (
                      <button
                        type="button"
                        onClick={() => {
                          assignConversation(selectedConv.id, currentUser)
                          toast.success('Assigned conversation to you')
                        }}
                        className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                      >
                        <FiUserCheck size={13} />
                        Claim Chat
                      </button>
                    ) : (
                      <span className="hidden lg:inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                        <FiUserCheck size={12} className="text-slate-600" />
                        {selectedConv.assignedTo.name}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        const nextStatus =
                          selectedConv.status === 'resolved' ? 'open' : 'resolved'
                        setConversationStatus(selectedConv.id, nextStatus)
                        toast.success(
                          nextStatus === 'resolved'
                            ? 'Marked as resolved'
                            : 'Conversation reopened',
                        )
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                      {selectedConv.status === 'resolved' ? (
                        <>
                          <FiRotateCcw size={13} />
                          <span className="hidden sm:inline">Reopen</span>
                        </>
                      ) : (
                        <>
                          <FiCheckCircle size={13} />
                          <span className="hidden sm:inline">Resolve</span>
                        </>
                      )}
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setShowInfo((v) => !v)}
                  title="Conversation info"
                  aria-label="Toggle conversation info"
                  className={`rounded-lg p-2 transition ${
                    showInfo
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <FiInfo size={17} />
                </button>
              </div>
            </header>

            {/* Drag & drop overlay */}
            {isDraggingOver && (
              <div className="pointer-events-none absolute inset-4 z-20 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-400 bg-slate-100/90 text-slate-800 backdrop-blur-[1px]">
                <FiImage size={28} className="mb-1.5" />
                <p className="text-sm font-bold">Drop images here to send</p>
              </div>
            )}

            {/* Message Feed */}
            <div className="flex min-h-0 flex-1 flex-col" data-no-translate="true">
              <ChatMessageList
                messages={activeMessages}
                currentActorId={currentUser?.id}
                showSenderMeta
                isPublicForStaff={selectedConv.type === 'public'}
                onReact={(msgId, emoji) =>
                  toggleReaction(selectedConv.id, msgId, emoji)
                }
                onImageClick={setLightboxImage}
                typingNames={typingNames}
                emptyTitle={`Message ${selectedMeta.title}`}
                emptySubtitle="Write a friendly message, paste a screenshot, or upload photos below."
              />
            </div>

            {/* Composer */}
            <ChatComposer
              placeholder={`Message ${selectedMeta.title}... (You can paste or drop images)`}
              onSend={handleSend}
              onTyping={() => emitTyping(selectedConv.id)}
            />
          </>
        )}
      </section>

      {/* RIGHT PANE: Contextual Details, Assignment, Quick Replies & Shared Media */}
      {selectedConv && showInfo && (
        <aside className="hidden w-72 shrink-0 flex-col overflow-y-auto border-l border-slate-200 bg-white xl:flex [scrollbar-width:thin]">
          <div className="flex flex-col items-center border-b border-slate-100 px-5 py-6 text-center" data-no-translate="true">
            <ChatAvatar
              src={selectedMeta.avatar}
              name={selectedMeta.title}
              size="lg"
              online={selectedConv.type !== 'team_group'}
              isGroup={selectedMeta.isGroup}
            />
            <h4 className="mt-3 font-heading text-base font-bold text-dark">
              {selectedMeta.title}
            </h4>
            <div className="mt-1.5 flex items-center gap-1.5">
              {selectedConv.type === 'public' ? (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
                  Public Support
                </span>
              ) : selectedConv.type === 'team_group' ? (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
                  Team Channel
                </span>
              ) : (
                selectedMeta.role && <ChatRoleBadge role={selectedMeta.role} />
              )}
            </div>
          </div>

          {/* Public Visitor Info & Assignment */}
          {selectedConv.type === 'public' && (
            <div className="space-y-4 border-b border-slate-100 p-4">
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Visitor Details
                </p>
                <dl className="space-y-1.5 text-xs">
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Phone:</dt>
                    <dd className="font-medium text-dark">
                      {selectedConv.visitorPhone || 'Not provided'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Email:</dt>
                    <dd className="truncate font-medium text-dark">
                      {selectedConv.visitorEmail || 'Not provided'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Page:</dt>
                    <dd className="font-mono text-[11px] text-slate-700">
                      {selectedConv.sourcePage || '/'}
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Assigned Staff
                </label>
                <select
                  value={selectedConv.assignedTo?.id || ''}
                  onChange={(e) => {
                    const chosen =
                      activeManagementUsers.find((u) => u.id === e.target.value) ||
                      null
                    assignConversation(selectedConv.id, chosen)
                    toast.success(
                      chosen
                        ? `Assigned to ${chosen.name}`
                        : 'Conversation unassigned',
                    )
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-dark focus:border-primary focus:bg-white focus:outline-none"
                >
                  <option value="">Unassigned</option>
                  {activeManagementUsers.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name} ({staff.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Quick Replies (1-Click Send)
                </p>
                <div className="space-y-1.5" data-no-translate="true">
                  {CANNED_REPLIES.map((reply) => (
                    <button
                      key={reply}
                      type="button"
                      onClick={() => handleQuickReplySend(reply)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-2.5 py-2 text-left text-[11px] leading-snug text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Team Group Members */}
          {selectedConv.type === 'team_group' && (
            <div className="border-b border-slate-100 p-4">
              <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Channel Members ({selectedConv.participantIds?.length || 0})
              </p>
              <div className="space-y-2" data-no-translate="true">
                {(selectedConv.participantIds || []).map((pid) => {
                  const member = users.find((u) => u.id === pid)
                  if (!member) return null
                  const isMe = member.id === currentUser?.id
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-50"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <ChatAvatar
                          src={member.avatar}
                          name={member.name}
                          size="xs"
                          online
                        />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-dark">
                            {member.name} {isMe ? '(You)' : ''}
                          </p>
                          <ChatRoleBadge role={member.role} />
                        </div>
                      </div>
                      {!isMe && (
                        <button
                          type="button"
                          onClick={() => handleOpenColleagueDm(member)}
                          className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-primary/25 hover:text-dark"
                        >
                          DM
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Direct Message Contact Details */}
          {selectedConv.type === 'team_dm' && selectedMeta.otherUser && (
            <div className="border-b border-slate-100 p-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Colleague Info
              </p>
              <dl className="space-y-1.5 text-xs">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Email:</dt>
                  <dd className="truncate font-medium text-dark">
                    {selectedMeta.otherUser.email}
                  </dd>
                </div>
                {selectedMeta.otherUser.phone && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Phone:</dt>
                    <dd className="font-medium text-dark">
                      {selectedMeta.otherUser.phone}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Shared Photos */}
          <div className="p-4">
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Shared Photos ({sharedMedia.length})
            </p>
            {sharedMedia.length === 0 ? (
              <p className="text-xs text-slate-400">
                Images sent in this chat will appear here.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {sharedMedia.map((img) => (
                  <button
                    key={img.id || img.url}
                    type="button"
                    onClick={() => setLightboxImage(img)}
                    className="aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100 transition hover:opacity-90"
                  >
                    <img
                      src={img.url}
                      alt={img.name || 'Shared'}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Create Team Group Modal */}
      {isGroupModalOpen && (
        <CreateGroupModal
          colleagues={colleagues}
          onClose={() => setIsGroupModalOpen(false)}
          onCreate={({ title, description, participantIds }) => {
            const newId = createTeamGroup({ title, description, participantIds })
            if (newId) {
              setActiveConvId(newId)
              setMobileShowThread(true)
              toast.success('Team channel created!')
            }
            setIsGroupModalOpen(false)
          }}
        />
      )}

      <ChatImageLightbox
        image={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />
    </div>
  )
}

function CreateGroupModal({ colleagues, onClose, onCreate }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedIds, setSelectedIds] = useState(() =>
    colleagues.map((c) => c.id),
  )

  const toggleId = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Please enter a channel name.')
      return
    }
    onCreate({
      title,
      description,
      participantIds: selectedIds,
    })
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <FiUsers className="text-lg text-dark" />
            <h3 className="font-heading text-base font-bold text-dark">
              New Management Channel
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-dark"
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label className="mb-1 block text-xs font-semibold text-dark">
              Channel Name *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Book Fair Coordination"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-dark focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-dark">
              Topic (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group for?"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-dark focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-dark">
              Include Team Members
            </label>
            <div className="max-h-44 space-y-1.5 overflow-y-auto rounded-xl border border-slate-200 p-2">
              {colleagues.map((member) => {
                const checked = selectedIds.includes(member.id)
                return (
                  <label
                    key={member.id}
                    className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleId(member.id)}
                        className="h-4 w-4 accent-slate-900"
                      />
                      <ChatAvatar
                        src={member.avatar}
                        name={member.name}
                        size="xs"
                        online={false}
                      />
                      <span className="text-xs font-semibold text-dark">
                        {member.name}
                      </span>
                    </div>
                    <ChatRoleBadge role={member.role} />
                  </label>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800"
            >
              Create Channel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
