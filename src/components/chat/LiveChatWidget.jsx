import { useEffect, useMemo, useState } from 'react'
import {
  FiExternalLink,
  FiMessageCircle,
  FiMinimize2,
  FiX,
} from 'react-icons/fi'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useChat } from '../../context/useChat'
import { compressChatImage } from '../../utils/liveChatStorage'
import {
  ChatAvatar,
  ChatComposer,
  ChatImageLightbox,
  ChatMessageList,
} from './ChatShared'

const STARTER_PROMPTS = [
  'বই অর্ডার সম্পর্কে জানতে চাই',
  'একটি বই স্টকে আছে কিনা জানাবেন?',
  'আমার অর্ডার ট্র্যাক করতে চাই',
]

export default function LiveChatWidget() {
  const {
    currentActor,
    myPublicConversationId,
    myPublicConversation,
    myPublicMessages,
    myPublicUnreadCount,
    totalStaffUnreadCount,
    typingMap,
    sendMessage,
    markConversationRead,
    toggleReaction,
    emitTyping,
  } = useChat()

  const [isOpen, setIsOpen] = useState(false)
  const [lightboxImage, setLightboxImage] = useState(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  const location = useLocation()
  const navigate = useNavigate()

  const isStaff = currentActor.isStaff
  const badgeCount = isStaff ? totalStaffUnreadCount : myPublicUnreadCount

  useEffect(() => {
    if (isOpen && !isStaff && myPublicConversation) {
      markConversationRead(myPublicConversation.id, currentActor.id)
    }
  }, [
    isOpen,
    isStaff,
    myPublicConversation,
    myPublicMessages.length,
    markConversationRead,
    currentActor.id,
  ])

  const typingNames = useMemo(() => {
    const convTyping = typingMap[myPublicConversationId] || {}
    return Object.values(convTyping)
      .filter((t) => t.id !== currentActor.id)
      .map((t) => t.name)
  }, [currentActor.id, myPublicConversationId, typingMap])

  const handleLauncherClick = () => {
    // On mobile devices, open dedicated full-screen chat page with back navigation
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      if (isStaff) {
        navigate('/dashboard/live-chat')
      } else {
        navigate('/live-chat', { state: { from: location.pathname } })
      }
      return
    }
    setIsOpen(true)
  }

  const handleSend = ({ text, images }) => {
    if (isStaff) {
      navigate('/dashboard/live-chat')
      return
    }
    sendMessage({
      conversationId: myPublicConversationId,
      text,
      images,
      sourcePage: location.pathname,
    })
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    setIsDraggingOver(false)
    if (isStaff) return
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

  const activeAgent = myPublicConversation?.assignedTo

  return (
    <>
      {/* Clean Icon-Only Floating Launcher */}
      {!isOpen && (
        <button
          type="button"
          onClick={handleLauncherClick}
          className="fixed bottom-5 right-5 z-[95] flex h-13 w-13 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition duration-200 hover:-translate-y-0.5 hover:bg-slate-800"
          aria-label="Open live chat"
          title="Chat"
        >
          <FiMessageCircle size={24} />
          {badgeCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-700 px-1 text-[10px] font-bold text-white ring-2 ring-white">
              {badgeCount > 99 ? '99+' : badgeCount}
            </span>
          )}
        </button>
      )}

      {/* Desktop Floating Chat Window */}
      {isOpen && (
        <div
          className="fixed bottom-5 right-5 z-[95] hidden h-[520px] w-[370px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:flex"
          onDragOver={(e) => {
            if (isStaff) return
            e.preventDefault()
            setIsDraggingOver(true)
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={handleDrop}
        >
          {/* Clean Neutral Header */}
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-3 text-slate-900">
            <div className="flex min-w-0 items-center gap-2.5">
              <ChatAvatar
                src={activeAgent?.avatar}
                name={activeAgent?.name || 'Hosonta'}
                size="sm"
                online
              />
              <div className="min-w-0">
                <h3 className="truncate font-heading text-sm font-bold text-slate-900">
                  {activeAgent ? activeAgent.name : 'Hosonta Support'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {activeAgent ? 'Active now' : 'Typically replies in minutes'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Minimize"
                aria-label="Minimize chat"
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <FiMinimize2 size={15} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close"
                aria-label="Close chat"
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <FiX size={16} />
              </button>
            </div>
          </div>

          {isStaff ? (
            <div className="flex flex-1 flex-col items-center justify-center bg-slate-50 px-6 py-8 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-slate-800">
                <FiMessageCircle size={22} />
              </div>
              <h4 className="font-heading text-base font-bold text-slate-900">
                Management Inbox
              </h4>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                Open the workspace to reply to visitors and message your team.
              </p>
              {totalStaffUnreadCount > 0 && (
                <p className="mt-2 text-xs font-semibold text-slate-700">
                  {totalStaffUnreadCount} unread message{totalStaffUnreadCount > 1 ? 's' : ''}
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  navigate('/dashboard/live-chat')
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
              >
                Open Inbox
                <FiExternalLink size={13} />
              </button>
            </div>
          ) : (
            <>
              <div className="relative flex min-h-0 flex-1 flex-col bg-slate-50">
                {isDraggingOver && (
                  <div className="pointer-events-none absolute inset-2 z-20 flex items-center justify-center rounded-xl border-2 border-dashed border-slate-400 bg-slate-100/90 text-slate-800">
                    <p className="text-xs font-semibold">Drop images to send</p>
                  </div>
                )}

                <ChatMessageList
                  messages={myPublicMessages}
                  currentActorId={currentActor.id}
                  showSenderMeta
                  onReact={(msgId, emoji) =>
                    toggleReaction(myPublicConversationId, msgId, emoji)
                  }
                  onImageClick={setLightboxImage}
                  typingNames={typingNames}
                  emptyTitle="হসন্ত প্রকাশনে স্বাগতম"
                  emptySubtitle="বই, অর্ডার বা যেকোনো প্রশ্নে সরাসরি মেসেজ করুন।"
                  starterChips={STARTER_PROMPTS}
                  onStarterClick={(chip) =>
                    handleSend({ text: chip, images: [] })
                  }
                  compact
                />
              </div>

              <ChatComposer
                compact
                placeholder="Write a message..."
                onSend={handleSend}
                onTyping={() => emitTyping(myPublicConversationId)}
              />
            </>
          )}
        </div>
      )}

      <ChatImageLightbox
        image={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />
    </>
  )
}
