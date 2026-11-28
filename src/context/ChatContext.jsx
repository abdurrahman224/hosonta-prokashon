import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './useAuth'
import ChatContext from './ChatContextValue'
import {
  CHAT_CHANNEL_NAME,
  CHAT_STORAGE_KEY,
  getDmConversationId,
  getOrCreateGuestProfile,
  getPublicConversationId,
  isManagementRole,
  loadLiveChatState,
  saveGuestProfile,
  saveLiveChatState,
} from '../utils/liveChatStorage'

export function ChatProvider({ children }) {
  const { currentUser, users = [] } = useAuth()
  const [chatState, setChatState] = useState(loadLiveChatState)
  const [guestProfile, setGuestProfile] = useState(getOrCreateGuestProfile)
  const [typingMap, setTypingMap] = useState({})
  const channelRef = useRef(null)
  const lastTypingEmitRef = useRef({})

  const activeManagementUsers = useMemo(
    () =>
      users.filter(
        (u) => isManagementRole(u.role) && u.status !== 'suspended',
      ),
    [users],
  )

  const currentActor = useMemo(() => {
    if (currentUser) {
      return {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
        avatar: currentUser.avatar || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        isStaff: isManagementRole(currentUser.role),
      }
    }
    return {
      id: guestProfile.visitorId,
      name: guestProfile.name || 'Guest Reader',
      role: 'guest',
      avatar: guestProfile.avatar || '',
      email: guestProfile.email || '',
      phone: guestProfile.phone || '',
      isStaff: false,
    }
  }, [currentUser, guestProfile])

  const broadcastSync = useCallback((payload) => {
    try {
      channelRef.current?.postMessage(payload)
    } catch {
      // ignore BroadcastChannel failures
    }
  }, [])

  const updateAndPersist = useCallback(
    (updater) => {
      setChatState((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        saveLiveChatState(next)
        broadcastSync({ type: 'STATE_SYNC', state: next })
        return next
      })
    },
    [broadcastSync],
  )

  // Real-time sync across tabs via BroadcastChannel + localStorage events
  useEffect(() => {
    let channel = null
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel(CHAT_CHANNEL_NAME)
      channelRef.current = channel
      channel.onmessage = (event) => {
        const data = event?.data
        if (!data) return
        if (data.type === 'STATE_SYNC' && data.state) {
          setChatState(data.state)
        } else if (data.type === 'TYPING' && data.conversationId && data.actor) {
          setTypingMap((prev) => ({
            ...prev,
            [data.conversationId]: {
              ...(prev[data.conversationId] || {}),
              [data.actor.id]: {
                ...data.actor,
                expiresAt: Date.now() + 3200,
              },
            },
          }))
        }
      }
    }

    const handleStorage = (event) => {
      if (event.key === CHAT_STORAGE_KEY && event.newValue) {
        try {
          setChatState(JSON.parse(event.newValue))
        } catch {
          // ignore invalid JSON
        }
      }
    }
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('storage', handleStorage)
      if (channel) {
        channel.close()
        channelRef.current = null
      }
    }
  }, [])

  // Periodically prune expired typing indicators
  useEffect(() => {
    const hasTyping = Object.values(typingMap).some(
      (convTyping) => Object.keys(convTyping || {}).length > 0,
    )
    if (!hasTyping) return undefined

    const timer = setInterval(() => {
      const now = Date.now()
      setTypingMap((prev) => {
        let changed = false
        const next = {}
        for (const [convId, actors] of Object.entries(prev)) {
          const active = {}
          for (const [actorId, info] of Object.entries(actors || {})) {
            if (info.expiresAt > now) {
              active[actorId] = info
            } else {
              changed = true
            }
          }
          if (Object.keys(active).length > 0) {
            next[convId] = active
          }
        }
        return changed ? next : prev
      })
    }, 900)

    return () => clearInterval(timer)
  }, [typingMap])

  const emitTyping = useCallback(
    (conversationId) => {
      if (!conversationId) return
      const now = Date.now()
      const last = lastTypingEmitRef.current[conversationId] || 0
      if (now - last < 1400) return
      lastTypingEmitRef.current[conversationId] = now
      broadcastSync({
        type: 'TYPING',
        conversationId,
        actor: {
          id: currentActor.id,
          name: currentActor.name,
          role: currentActor.role,
        },
      })
    },
    [broadcastSync, currentActor],
  )

  const updateVisitorIdentity = useCallback(
    (updates) => {
      if (!currentUser) {
        const nextGuest = saveGuestProfile(updates)
        setGuestProfile(nextGuest)
      }
      const targetConvId = getPublicConversationId(currentUser, guestProfile)
      updateAndPersist((prev) => {
        const exists = prev.conversations.some((c) => c.id === targetConvId)
        if (!exists) return prev
        return {
          ...prev,
          conversations: prev.conversations.map((c) =>
            c.id === targetConvId
              ? {
                  ...c,
                  title: updates.name?.trim() || c.title,
                  visitorName: updates.name?.trim() || c.visitorName,
                  visitorPhone:
                    updates.phone !== undefined ? updates.phone : c.visitorPhone,
                  visitorEmail:
                    updates.email !== undefined ? updates.email : c.visitorEmail,
                }
              : c,
          ),
        }
      })
    },
    [currentUser, guestProfile, updateAndPersist],
  )

  const sendMessage = useCallback(
    ({ conversationId, text = '', images = [], sourcePage = '/', customPublicInfo = null }) => {
      const cleanText = String(text || '').trim()
      const cleanImages = Array.isArray(images) ? images : []
      if (!cleanText && cleanImages.length === 0) return null

      const nowIso = new Date().toISOString()
      const targetId =
        conversationId || getPublicConversationId(currentUser, guestProfile)
      const isStaff = currentActor.isStaff
      const isPublicConv = targetId.startsWith('pub-')
      const senderType =
        isPublicConv && !isStaff ? 'visitor' : 'staff'

      const newMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        conversationId: targetId,
        senderId: currentActor.id,
        senderName: customPublicInfo?.name?.trim() || currentActor.name,
        senderRole: currentActor.role,
        senderAvatar: currentActor.avatar,
        senderType,
        text: cleanText,
        images: cleanImages,
        reactions: [],
        createdAt: nowIso,
      }

      updateAndPersist((prev) => {
        const exists = prev.conversations.some((c) => c.id === targetId)
        let nextConversations = prev.conversations

        if (!exists && isPublicConv) {
          const visitorName =
            customPublicInfo?.name?.trim() ||
            currentActor.name ||
            'Guest Reader'
          const newConv = {
            id: targetId,
            type: 'public',
            title: visitorName,
            visitorId: currentActor.id,
            visitorName,
            visitorPhone:
              customPublicInfo?.phone ?? currentActor.phone ?? '',
            visitorEmail:
              customPublicInfo?.email ?? currentActor.email ?? '',
            visitorRole: currentActor.role,
            visitorAvatar: currentActor.avatar,
            sourcePage,
            status: 'open',
            assignedTo: null,
            readBy: {
              [currentActor.id]: nowIso,
            },
            createdAt: nowIso,
            updatedAt: nowIso,
          }
          nextConversations = [newConv, ...prev.conversations]
        } else {
          nextConversations = prev.conversations.map((c) =>
            c.id === targetId
              ? {
                  ...c,
                  status:
                    c.type === 'public' && senderType === 'visitor'
                      ? 'open'
                      : c.status,
                  readBy: {
                    ...(c.readBy || {}),
                    [currentActor.id]: nowIso,
                  },
                  updatedAt: nowIso,
                }
              : c,
          )
        }

        const existingMsgs = prev.messagesByConv[targetId] || []
        return {
          conversations: nextConversations,
          messagesByConv: {
            ...prev.messagesByConv,
            [targetId]: [...existingMsgs, newMessage],
          },
        }
      })

      return newMessage
    },
    [currentActor, currentUser, guestProfile, updateAndPersist],
  )

  const ensureDirectConversation = useCallback(
    (otherUser) => {
      if (!currentUser?.id || !otherUser?.id) return null
      const dmId = getDmConversationId(currentUser.id, otherUser.id)
      const exists = chatState.conversations.find((c) => c.id === dmId)
      if (exists) return dmId

      const nowIso = new Date().toISOString()
      const newDm = {
        id: dmId,
        type: 'team_dm',
        title: 'Direct Message',
        participantIds: [currentUser.id, otherUser.id],
        status: 'open',
        readBy: { [currentUser.id]: nowIso },
        createdAt: nowIso,
        updatedAt: nowIso,
      }
      updateAndPersist((prev) => {
        if (prev.conversations.some((c) => c.id === dmId)) return prev
        return {
          ...prev,
          conversations: [newDm, ...prev.conversations],
          messagesByConv: {
            ...prev.messagesByConv,
            [dmId]: prev.messagesByConv[dmId] || [],
          },
        }
      })
      return dmId
    },
    [chatState.conversations, currentUser, updateAndPersist],
  )

  const createTeamGroup = useCallback(
    ({ title, description = '', participantIds = [] }) => {
      const cleanTitle = String(title || '').trim()
      if (!cleanTitle || !currentUser?.id) return null

      const uniqueIds = Array.from(
        new Set([currentUser.id, ...participantIds.map(String)]),
      )
      const nowIso = new Date().toISOString()
      const groupId = `team-group-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 6)}`

      const newGroup = {
        id: groupId,
        type: 'team_group',
        title: cleanTitle,
        description:
          String(description || '').trim() || 'Management team channel',
        participantIds: uniqueIds,
        status: 'open',
        readBy: { [currentUser.id]: nowIso },
        createdAt: nowIso,
        updatedAt: nowIso,
      }

      const systemMsg = {
        id: `msg-${Date.now()}-init`,
        conversationId: groupId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderRole: currentUser.role,
        senderAvatar: currentUser.avatar || '',
        senderType: 'staff',
        text: `${currentUser.name} created "${cleanTitle}" channel.`,
        images: [],
        reactions: [],
        createdAt: nowIso,
      }

      updateAndPersist((prev) => ({
        conversations: [newGroup, ...prev.conversations],
        messagesByConv: {
          ...prev.messagesByConv,
          [groupId]: [systemMsg],
        },
      }))
      return groupId
    },
    [currentUser, updateAndPersist],
  )

  const markConversationRead = useCallback(
    (conversationId, actorIdOverride = null) => {
      const readerId = actorIdOverride || currentActor.id
      if (!conversationId || !readerId) return
      const msgs = chatState.messagesByConv[conversationId] || []
      const lastMsg = msgs[msgs.length - 1]
      const conv = chatState.conversations.find((c) => c.id === conversationId)
      if (!conv) return

      const lastReadIso = conv.readBy?.[readerId]
      const latestAt = lastMsg?.createdAt || conv.updatedAt
      if (lastReadIso && latestAt && lastReadIso >= latestAt) return

      const nowIso = new Date().toISOString()
      updateAndPersist((prev) => ({
        ...prev,
        conversations: prev.conversations.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                readBy: {
                  ...(c.readBy || {}),
                  [readerId]: nowIso,
                },
              }
            : c,
        ),
      }))
    },
    [chatState.conversations, chatState.messagesByConv, currentActor.id, updateAndPersist],
  )

  const toggleReaction = useCallback(
    (conversationId, messageId, emoji) => {
      if (!conversationId || !messageId || !emoji) return
      updateAndPersist((prev) => {
        const list = prev.messagesByConv[conversationId] || []
        const updatedList = list.map((msg) => {
          if (msg.id !== messageId) return msg
          const existing = msg.reactions || []
          const already = existing.some(
            (r) => r.userId === currentActor.id && r.emoji === emoji,
          )
          const nextReactions = already
            ? existing.filter(
                (r) => !(r.userId === currentActor.id && r.emoji === emoji),
              )
            : [
                ...existing,
                {
                  emoji,
                  userId: currentActor.id,
                  userName: currentActor.name,
                },
              ]
          return { ...msg, reactions: nextReactions }
        })
        return {
          ...prev,
          messagesByConv: {
            ...prev.messagesByConv,
            [conversationId]: updatedList,
          },
        }
      })
    },
    [currentActor.id, currentActor.name, updateAndPersist],
  )

  const setConversationStatus = useCallback(
    (conversationId, status) => {
      if (!conversationId) return
      updateAndPersist((prev) => ({
        ...prev,
        conversations: prev.conversations.map((c) =>
          c.id === conversationId ? { ...c, status } : c,
        ),
      }))
    },
    [updateAndPersist],
  )

  const assignConversation = useCallback(
    (conversationId, staffMember) => {
      if (!conversationId) return
      updateAndPersist((prev) => ({
        ...prev,
        conversations: prev.conversations.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                assignedTo: staffMember
                  ? {
                      id: staffMember.id,
                      name: staffMember.name,
                      role: staffMember.role,
                      avatar: staffMember.avatar || '',
                    }
                  : null,
              }
            : c,
        ),
      }))
    },
    [updateAndPersist],
  )

  const getUnreadCountForConversation = useCallback(
    (conv, viewerId = currentActor.id) => {
      if (!conv) return 0
      const msgs = chatState.messagesByConv[conv.id] || []
      const lastRead = conv.readBy?.[viewerId] || ''
      return msgs.filter(
        (m) => m.senderId !== viewerId && (!lastRead || m.createdAt > lastRead),
      ).length
    },
    [chatState.messagesByConv, currentActor.id],
  )

  // Public conversation belonging to current public/reader/author visitor
  const myPublicConversationId = useMemo(
    () => getPublicConversationId(currentUser, guestProfile),
    [currentUser, guestProfile],
  )

  const myPublicConversation = useMemo(
    () =>
      chatState.conversations.find((c) => c.id === myPublicConversationId) ||
      null,
    [chatState.conversations, myPublicConversationId],
  )

  const myPublicMessages = useMemo(
    () => chatState.messagesByConv[myPublicConversationId] || [],
    [chatState.messagesByConv, myPublicConversationId],
  )

  const myPublicUnreadCount = useMemo(() => {
    if (!myPublicConversation) return 0
    return getUnreadCountForConversation(myPublicConversation, currentActor.id)
  }, [currentActor.id, getUnreadCountForConversation, myPublicConversation])

  // Staff visible conversations: all public chats + team groups/DMs they belong to
  const staffConversations = useMemo(() => {
    if (!currentUser || !isManagementRole(currentUser.role)) return []
    return chatState.conversations
      .filter((conv) => {
        if (conv.type === 'public') return true
        if (conv.type === 'team_group') {
          return (
            !conv.participantIds?.length ||
            conv.participantIds.includes(currentUser.id) ||
            currentUser.role === 'admin'
          )
        }
        if (conv.type === 'team_dm') {
          return conv.participantIds?.includes(currentUser.id)
        }
        return false
      })
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
  }, [chatState.conversations, currentUser])

  const totalStaffUnreadCount = useMemo(() => {
    if (!currentUser || !isManagementRole(currentUser.role)) return 0
    return staffConversations.reduce(
      (sum, conv) => sum + getUnreadCountForConversation(conv, currentUser.id),
      0,
    )
  }, [currentUser, getUnreadCountForConversation, staffConversations])

  const value = useMemo(
    () => ({
      conversations: chatState.conversations,
      messagesByConv: chatState.messagesByConv,
      staffConversations,
      activeManagementUsers,
      currentActor,
      guestProfile,
      typingMap,
      myPublicConversationId,
      myPublicConversation,
      myPublicMessages,
      myPublicUnreadCount,
      totalStaffUnreadCount,
      sendMessage,
      updateVisitorIdentity,
      ensureDirectConversation,
      createTeamGroup,
      markConversationRead,
      toggleReaction,
      setConversationStatus,
      assignConversation,
      emitTyping,
      getUnreadCountForConversation,
    }),
    [
      activeManagementUsers,
      assignConversation,
      chatState.conversations,
      chatState.messagesByConv,
      createTeamGroup,
      currentActor,
      emitTyping,
      ensureDirectConversation,
      getUnreadCountForConversation,
      guestProfile,
      markConversationRead,
      myPublicConversation,
      myPublicConversationId,
      myPublicMessages,
      myPublicUnreadCount,
      sendMessage,
      setConversationStatus,
      staffConversations,
      toggleReaction,
      totalStaffUnreadCount,
      typingMap,
      updateVisitorIdentity,
    ],
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}
