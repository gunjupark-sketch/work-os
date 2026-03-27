'use client'

import { ChatMessage, SENDER_COLORS, SENDER_NAMES, MESSAGE_TYPE_STYLES } from '@/types/chat'

function formatTime(timestamp: string) {
  const d = new Date(timestamp)
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

function formatDate(timestamp: string) {
  const d = new Date(timestamp)
  return `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')}`
}

export function DateDivider({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-navy/10" />
      <span className="text-xs text-navy/40 font-medium">{date}</span>
      <div className="flex-1 h-px bg-navy/10" />
    </div>
  )
}

interface MessageBubbleProps {
  message: ChatMessage
  replyTarget?: ChatMessage
  onReply: (id: number) => void
}

export default function MessageBubble({ message, replyTarget, onReply }: MessageBubbleProps) {
  const colors = SENDER_COLORS[message.sender] || { bg: 'bg-gray-100', text: 'text-gray-800', avatar: 'bg-gray-500' }
  const displayName = SENDER_NAMES[message.sender] || message.sender
  const typeStyle = MESSAGE_TYPE_STYLES[message.message_type] || MESSAGE_TYPE_STYLES.message

  return (
    <div className="group flex gap-3 px-4 py-1.5 hover:bg-navy/[0.03] transition-colors">
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full ${colors.avatar} flex-shrink-0 flex items-center justify-center text-white text-xs font-bold mt-0.5`}>
        {displayName.charAt(0)}
      </div>

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-sm font-semibold ${colors.text}`}>{displayName}</span>
          {message.message_type !== 'message' && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${typeStyle.bg} ${typeStyle.text}`}>
              {typeStyle.label}
            </span>
          )}
          <span className="text-[11px] text-navy/30">{formatTime(message.timestamp)}</span>
          <span className="text-[11px] text-navy/20">#{message.id}</span>
          <button
            onClick={() => onReply(message.id)}
            className="opacity-0 group-hover:opacity-100 text-[11px] text-navy/30 hover:text-navy/60 transition-all ml-auto"
          >
            답장
          </button>
        </div>

        {/* Reply target */}
        {replyTarget && (
          <div className="mb-1 pl-3 border-l-2 border-navy/15 text-xs text-navy/40 truncate">
            <span className="font-medium">{SENDER_NAMES[replyTarget.sender] || replyTarget.sender}</span>
            {': '}
            {replyTarget.content.slice(0, 80)}
            {replyTarget.content.length > 80 ? '...' : ''}
          </div>
        )}

        {/* Content */}
        <div className="text-sm text-navy/80 whitespace-pre-wrap break-words leading-relaxed">
          {message.content}
        </div>
      </div>
    </div>
  )
}

export { formatDate }
