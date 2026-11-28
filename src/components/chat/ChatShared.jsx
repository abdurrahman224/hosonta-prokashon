import { useEffect, useRef, useState } from 'react'
import {
  FiCheck,
  FiDownload,
  FiImage,
  FiMessageCircle,
  FiSend,
  FiSmile,
  FiThumbsUp,
  FiUsers,
  FiX,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import {
  QUICK_EMOJIS,
  REACTION_EMOJIS,
  compressChatImage,
  formatChatTime,
  formatDayDivider,
} from '../../utils/liveChatStorage'

const ROLE_LABELS = {
  admin: 'Admin',
  moderator: 'Moderator',
  employee: 'Staff',
  author: 'Author',
  user: 'Reader',
  guest: 'Visitor',
}

function getInitials(name) {
  const clean = String(name || 'U').trim()
  if (!clean) return 'U'
  const parts = clean.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const AVATAR_SIZES = {
  xs: 'h-7 w-7 text-[11px]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
}

export function ChatAvatar({
  src,
  name,
  size = 'md',
  online = true,
  isGroup = false,
}) {
  const sizeCls = AVATAR_SIZES[size] || AVATAR_SIZES.md
  const dotSize = size === 'xs' ? 'h-2 w-2' : 'h-2.5 w-2.5'

  return (
    <div className="relative inline-flex shrink-0">
      {isGroup ? (
        <div
          className={`${sizeCls} flex items-center justify-center rounded-full bg-slate-800 text-white font-semibold ring-2 ring-white`}
        >
          <FiUsers className={size === 'sm' ? 'text-sm' : 'text-base'} />
        </div>
      ) : src ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          className={`${sizeCls} rounded-full object-cover bg-slate-100 ring-2 ring-white`}
        />
      ) : (
        <div
          className={`${sizeCls} flex items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-700 ring-2 ring-white`}
        >
          {getInitials(name)}
        </div>
      )}
      {online && !isGroup && (
        <span
          className={`absolute bottom-0 right-0 ${dotSize} rounded-full bg-emerald-500 ring-2 ring-white`}
          title="Active now"
        />
      )}
    </div>
  )
}

export function ChatRoleBadge({ role }) {
  const label = ROLE_LABELS[role] || ROLE_LABELS.guest
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium leading-none text-slate-600">
      {label}
    </span>
  )
}

export function ChatImageLightbox({ image, onClose }) {
  useEffect(() => {
    if (!image) return undefined
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [image, onClose])

  if (!image) return null

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
    >
      <div
        className="relative flex max-h-[90vh] max-w-4xl flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex w-full items-center justify-between gap-4 rounded-xl bg-white/10 px-4 py-2 text-white backdrop-blur-md">
          <span className="truncate text-xs font-medium text-white/90">
            {image.name || 'Shared image'}
          </span>
          <div className="flex items-center gap-2">
            <a
              href={image.url}
              download={image.name || 'chat-image.jpg'}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-white/25 transition"
            >
              <FiDownload size={13} />
              Save
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-white/15 p-1.5 text-white hover:bg-white/25 transition"
              aria-label="Close image preview"
            >
              <FiX size={16} />
            </button>
          </div>
        </div>
        <img
          src={image.url}
          alt={image.name || 'Chat attachment'}
          className="max-h-[78vh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
        />
      </div>
    </div>
  )
}

export function TypingIndicatorBubble({ names = [] }) {
  if (!names.length) return null
  const label =
    names.length === 1
      ? `${names[0]} is typing...`
      : `${names.slice(0, 2).join(', ')} typing...`

  return (
    <div className="flex items-end gap-2 py-1">
      <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-3.5 py-2">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
        </span>
        <span className="text-[11px] font-medium text-slate-500">{label}</span>
      </div>
    </div>
  )
}

export function ChatMessageList({
  messages = [],
  currentActorId,
  showSenderMeta = true,
  isPublicForStaff = false,
  onReact,
  onImageClick,
  typingNames = [],
  emptyTitle = 'Start a conversation',
  emptySubtitle = 'Send a message or upload an image to begin chatting.',
  starterChips = [],
  onStarterClick,
  compact = false,
}) {
  const bottomRef = useRef(null)
  const [hoveredMsgId, setHoveredMsgId] = useState(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, typingNames.length])

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-8 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <FiMessageCircle size={22} />
        </div>
        <h4 className="font-heading text-base font-bold text-slate-900">
          {emptyTitle}
        </h4>
        <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
          {emptySubtitle}
        </p>
        {starterChips.length > 0 && onStarterClick && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {starterChips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => onStarterClick(chip)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
              >
                {chip}
              </button>
            ))}
          </div>
        )}
        <TypingIndicatorBubble names={typingNames} />
        <div ref={bottomRef} />
      </div>
    )
  }

  return (
    <div
      className={`flex-1 overflow-y-auto ${
        compact ? 'px-3 py-3' : 'px-4 py-4 sm:px-5'
      } space-y-1`}
    >
      {messages.map((msg, index) => {
        const prev = messages[index - 1]
        const next = messages[index + 1]
        const isMine = msg.senderId === currentActorId
        const showDay =
          !prev ||
          new Date(prev.createdAt).toDateString() !==
            new Date(msg.createdAt).toDateString()

        const sameAsPrev =
          !showDay &&
          prev &&
          prev.senderId === msg.senderId &&
          new Date(msg.createdAt) - new Date(prev.createdAt) < 5 * 60 * 1000

        const sameAsNext =
          next &&
          new Date(next.createdAt).toDateString() ===
            new Date(msg.createdAt).toDateString() &&
          next.senderId === msg.senderId &&
          new Date(next.createdAt) - new Date(msg.createdAt) < 5 * 60 * 1000

        const bubbleRadius = isMine
          ? `${sameAsPrev ? 'rounded-tr-md' : 'rounded-tr-2xl'} ${sameAsNext ? 'rounded-br-md' : 'rounded-br-sm'} rounded-l-2xl`
          : `${sameAsPrev ? 'rounded-tl-md' : 'rounded-tl-2xl'} ${sameAsNext ? 'rounded-bl-md' : 'rounded-bl-sm'} rounded-r-2xl`

        const reactionCounts = (msg.reactions || []).reduce((acc, r) => {
          acc[r.emoji] = (acc[r.emoji] || 0) + 1
          return acc
        }, {})

        const hasOnlyEmoji =
          msg.images?.length === 0 && msg.text?.trim() === '👍'

        return (
          <div key={msg.id}>
            {showDay && (
              <div className="my-3 flex items-center justify-center">
                <span className="rounded-full bg-slate-200/70 px-3 py-0.5 text-[10px] font-medium text-slate-600">
                  {formatDayDivider(msg.createdAt)}
                </span>
              </div>
            )}

            <div
              className={`group flex items-end gap-2 ${
                isMine ? 'justify-end' : 'justify-start'
              } ${sameAsPrev ? 'mt-0.5' : 'mt-3'}`}
              onMouseEnter={() => setHoveredMsgId(msg.id)}
              onMouseLeave={() => setHoveredMsgId(null)}
            >
              {!isMine && (
                <div className="w-7 shrink-0">
                  {!sameAsNext && (
                    <ChatAvatar
                      src={msg.senderAvatar}
                      name={msg.senderName}
                      size="xs"
                      online={false}
                    />
                  )}
                </div>
              )}

              <div
                className={`relative flex max-w-[78%] flex-col ${
                  isMine ? 'items-end' : 'items-start'
                }`}
              >
                {!sameAsPrev && showSenderMeta && (!isMine || isPublicForStaff) && (
                  <div
                    className={`mb-1 flex items-center gap-1.5 px-1 ${
                      isMine ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <span className="text-[11px] font-medium text-slate-500">
                      {msg.senderName}
                    </span>
                    {msg.senderRole && msg.senderRole !== 'guest' && (
                      <ChatRoleBadge role={msg.senderRole} />
                    )}
                  </div>
                )}

                <div
                  className={`relative flex items-center gap-1.5 ${
                    isMine ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`${
                      hasOnlyEmoji
                        ? 'bg-transparent px-1 py-0.5 text-3xl leading-none'
                        : isMine
                          ? `${bubbleRadius} bg-slate-900 text-white`
                          : `${bubbleRadius} border border-slate-200 bg-white text-slate-800`
                    } ${!hasOnlyEmoji && msg.images?.length > 0 && !msg.text ? 'p-1.5' : !hasOnlyEmoji ? 'px-3.5 py-2' : ''}`}
                  >
                    {msg.images?.length > 0 && (
                      <div
                        className={`grid gap-1.5 ${
                          msg.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                        } ${msg.text ? 'mb-2' : ''}`}
                      >
                        {msg.images.map((img) => (
                          <button
                            key={img.id || img.url}
                            type="button"
                            onClick={() => onImageClick?.(img)}
                            className="group/img relative overflow-hidden rounded-xl border border-black/10 bg-slate-100 text-left transition hover:opacity-95 focus:outline-none"
                          >
                            <img
                              src={img.url}
                              alt={img.name || 'Attachment'}
                              className={`${
                                compact ? 'max-h-44' : 'max-h-60'
                              } w-full object-cover transition duration-200 group-hover/img:scale-[1.02]`}
                            />
                          </button>
                        ))}
                      </div>
                    )}

                    {msg.text && (
                      <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed">
                        {msg.text}
                      </p>
                    )}
                  </div>

                  {onReact && hoveredMsgId === msg.id && (
                    <div className="hidden items-center gap-0.5 rounded-full border border-slate-200 bg-white px-1.5 py-0.5 shadow-sm sm:flex">
                      {REACTION_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => onReact(msg.id, emoji)}
                          className="rounded-full p-0.5 text-xs transition hover:scale-125"
                          title={`React ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div
                  className={`mt-0.5 flex items-center gap-1.5 px-1 ${
                    isMine ? 'flex-row-reverse' : ''
                  }`}
                >
                  {Object.keys(reactionCounts).length > 0 && (
                    <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-1.5 py-0.5 text-[11px]">
                      {Object.entries(reactionCounts).map(([emoji, count]) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => onReact?.(msg.id, emoji)}
                          className="inline-flex items-center gap-0.5 font-medium text-slate-700 hover:text-slate-900"
                        >
                          <span>{emoji}</span>
                          {count > 1 && <span className="text-[10px]">{count}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                  {!sameAsNext && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-400">
                      {formatChatTime(msg.createdAt)}
                      {isMine && <FiCheck className="text-slate-400" size={11} />}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}

      <TypingIndicatorBubble names={typingNames} />
      <div ref={bottomRef} />
    </div>
  )
}

export function ChatComposer({
  onSend,
  onTyping,
  placeholder = 'Write a message...',
  compact = false,
  disabled = false,
}) {
  const [text, setText] = useState('')
  const [pendingImages, setPendingImages] = useState([])
  const [isProcessingImages, setIsProcessingImages] = useState(false)
  const [showEmojis, setShowEmojis] = useState(false)
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter((f) =>
      f.type?.startsWith('image/'),
    )
    if (files.length === 0) {
      toast.error('Only image files are supported.')
      return
    }
    const remainingSlots = Math.max(0, 4 - pendingImages.length)
    if (remainingSlots === 0) {
      toast.error('You can attach up to 4 images per message.')
      return
    }

    setIsProcessingImages(true)
    try {
      const processed = await Promise.all(
        files.slice(0, remainingSlots).map((f) => compressChatImage(f)),
      )
      setPendingImages((prev) => [...prev, ...processed])
    } catch (err) {
      toast.error(err?.message || 'Failed to process image.')
    } finally {
      setIsProcessingImages(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handlePaste = (e) => {
    const items = Array.from(e.clipboardData?.items || [])
    const imageFiles = items
      .filter((item) => item.type?.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter(Boolean)

    if (imageFiles.length > 0) {
      e.preventDefault()
      handleFiles(imageFiles)
    }
  }

  const submitMessage = (overrideText = null) => {
    const cleanText = overrideText !== null ? overrideText : text.trim()
    if (!cleanText && pendingImages.length === 0) return

    onSend({ text: cleanText, images: pendingImages })
    if (overrideText === null) setText('')
    setPendingImages([])
    setShowEmojis(false)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submitMessage()
    }
  }

  const handleTextChange = (e) => {
    setText(e.target.value)
    onTyping?.()
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        compact ? 84 : 112,
      )}px`
    }
  }

  const canSend = Boolean(text.trim() || pendingImages.length > 0)

  return (
    <div
      className={`relative border-t border-slate-200 bg-white ${
        compact ? 'px-2.5 py-2' : 'px-3.5 py-2.5 sm:px-4'
      }`}
    >
      {showEmojis && (
        <div className="absolute bottom-full left-3 z-20 mb-2 flex max-w-[240px] flex-wrap gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                setText((prev) => `${prev}${emoji}`)
                setShowEmojis(false)
                textareaRef.current?.focus()
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-base transition hover:bg-slate-100"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {pendingImages.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {pendingImages.map((img) => (
            <div
              key={img.id}
              className="group relative h-14 w-14 overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
            >
              <img
                src={img.url}
                alt={img.name}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() =>
                  setPendingImages((prev) => prev.filter((item) => item.id !== img.id))
                }
                className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/75 text-white transition hover:bg-slate-900"
                aria-label="Remove attached image"
              >
                <FiX size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-1.5">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <button
          type="button"
          disabled={disabled || isProcessingImages}
          onClick={() => fileInputRef.current?.click()}
          title="Upload image"
          aria-label="Upload image"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40"
        >
          <FiImage size={18} />
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => setShowEmojis((prev) => !prev)}
          title="Insert emoji"
          aria-label="Insert emoji"
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition disabled:opacity-40 ${
            showEmojis
              ? 'bg-slate-100 text-slate-900'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
          }`}
        >
          <FiSmile size={18} />
        </button>

        <div className="flex min-w-0 flex-1 items-center rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1.5 transition focus-within:border-slate-400 focus-within:bg-white">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            disabled={disabled}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={isProcessingImages ? 'Preparing image...' : placeholder}
            className="max-h-28 w-full resize-none bg-transparent text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        {canSend ? (
          <button
            type="button"
            disabled={disabled || isProcessingImages}
            onClick={() => submitMessage()}
            title="Send message"
            aria-label="Send message"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-800 disabled:opacity-40"
          >
            <FiSend size={15} />
          </button>
        ) : (
          <button
            type="button"
            disabled={disabled || isProcessingImages}
            onClick={() => submitMessage('👍')}
            title="Send quick like"
            aria-label="Send quick like"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40"
          >
            <FiThumbsUp size={18} />
          </button>
        )}
      </div>
    </div>
  )
}
