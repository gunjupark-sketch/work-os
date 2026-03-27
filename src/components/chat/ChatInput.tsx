'use client'

import { useState } from 'react'
import { Send, X } from 'lucide-react'
import { SENDER_NAMES } from '@/types/chat'

interface ChatInputProps {
  channel: string
  replyTo: number | null
  replyPreview?: string
  onClearReply: () => void
  onSent: () => void
}

const SENDERS = ['건주', '이사님'] as const
const MESSAGE_TYPES = [
  { value: 'message', label: '메시지' },
  { value: 'request', label: '요청' },
] as const

export default function ChatInput({ channel, replyTo, replyPreview, onClearReply, onSent }: ChatInputProps) {
  const [content, setContent] = useState('')
  const [sender, setSender] = useState<string>('건주')
  const [messageType, setMessageType] = useState<string>('message')
  const [sending, setSending] = useState(false)

  async function handleSend() {
    if (!content.trim() || sending) return
    setSending(true)
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          content: content.trim(),
          sender,
          message_type: messageType,
          in_reply_to: replyTo,
        }),
      })
      setContent('')
      onClearReply()
      onSent()
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-navy/10 bg-white p-3">
      {/* Reply indicator */}
      {replyTo && (
        <div className="flex items-center gap-2 mb-2 px-2 py-1.5 bg-navy/5 rounded-lg text-xs text-navy/50">
          <span>#{replyTo}에 답장</span>
          {replyPreview && (
            <span className="truncate text-navy/40">— {replyPreview.slice(0, 60)}</span>
          )}
          <button onClick={onClearReply} className="ml-auto hover:text-navy/80">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2 mb-2">
        <select
          value={sender}
          onChange={(e) => setSender(e.target.value)}
          className="text-xs border border-navy/15 rounded-md px-2 py-1 bg-white text-navy/70 focus:outline-none focus:ring-1 focus:ring-navy/30"
        >
          {SENDERS.map((s) => (
            <option key={s} value={s}>{SENDER_NAMES[s] || s}</option>
          ))}
        </select>
        <div className="flex items-center gap-1 text-xs">
          {MESSAGE_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setMessageType(t.value)}
              className={`px-2 py-1 rounded-md transition-colors ${
                messageType === t.value
                  ? 'bg-navy text-white'
                  : 'bg-navy/5 text-navy/50 hover:bg-navy/10'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="flex items-end gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지 입력... (Shift+Enter로 줄바꿈)"
          rows={2}
          className="flex-1 resize-none border border-navy/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 placeholder:text-navy/30"
        />
        <button
          onClick={handleSend}
          disabled={!content.trim() || sending}
          className="bg-navy text-white p-2.5 rounded-lg hover:bg-navy-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
