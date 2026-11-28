import { useEffect, useMemo, useState } from 'react'
import { FiArrowLeft } from 'react-icons/fi'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useChat } from '../../context/useChat'
import { compressChatImage } from '../../utils/liveChatStorage'
import {
  ChatAvatar,
  ChatComposer,
  ChatImageLightbox,
  ChatMessageList,
} from '../../components/chat/ChatShared'

const STARTER_PROMPTS = [
  'বই অর্ডার সম্পর্কে জানতে চাই',
  'একটি বই স্টকে আছে কিনা জানাবেন?',
  'আমার অর্ডার ট্র্যাক করতে চাই',
]

export default function PublicLiveChatPage() {
  const {
    currentActor,
    myPublicConversationId,
    myPublicConversation,
    myPublicMessages,
    typingMap,
    sendMessage,
    markConversationRead,
    toggleReaction,
    emitTyping,
  } = useChat()

  const [lightboxImage, setLightboxImage] = useState(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (myPublicConversation) {
      markConversationRead(myPublicConversation.id, currentActor.id)
    }
  }, [
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

  const handleBack = () => {
    if (location.state?.from) {
      navigate(location.state.from)
    } else if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  const handleSend = ({ text, images }) => {
    sendMessage({
      conversationId: myPublicConversationId,
      text,
      images,
      sourcePage: location.state?.from || '/',
    })
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    setIsDraggingOver(false)
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
    <div
      className="flex h-[100dvh] w-full flex-col bg-white"
      onDragOver={(e) => {
        e.preventDefault()
        setIsDraggingOver(true)
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={handleDrop}
    >
      {/* Mobile / E-commerce Style Sticky Chat Header with Back Button */}
      <header className="flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3 py-3">
        <button
          type="button"
          onClick={handleBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100"
          aria-label="Go back"
        >
          <FiArrowLeft size={20} />
        </button>

        <ChatAvatar
          src={activeAgent?.avatar}
          name={activeAgent?.name || 'Hosonta'}
          size="sm"
          online
        />

        <div className="min-w-0 flex-1">
          <h1 className="truncate font-heading text-sm font-bold text-slate-900">
            {activeAgent ? activeAgent.name : 'Hosonta Support'}
          </h1>
          <p className="text-[11px] text-slate-500">
            {activeAgent ? 'Active now' : 'Typically replies in minutes'}
          </p>
        </div>
      </header>

      {/* Scrollable Messages */}
      <div className="relative flex min-h-0 flex-1 flex-col bg-slate-50">
        {isDraggingOver && (
          <div className="pointer-events-none absolute inset-3 z-20 flex items-center justify-center rounded-2xl border-2 border-dashed border-slate-400 bg-slate-100/90 text-slate-800">
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
          onStarterClick={(chip) => handleSend({ text: chip, images: [] })}
        />
      </div>

      {/* Bottom Sticky Composer */}
      <ChatComposer
        placeholder="Write a message..."
        onSend={handleSend}
        onTyping={() => emitTyping(myPublicConversationId)}
      />

      <ChatImageLightbox
        image={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />
    </div>
  )
}
