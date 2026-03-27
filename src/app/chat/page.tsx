'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { ChatMessage, Channel, Instance } from '@/types/chat'
import MessageBubble, { formatDate, DateDivider } from '@/components/chat/MessageBubble'
import ChatInput from '@/components/chat/ChatInput'
import ChatSidebar from '@/components/chat/ChatSidebar'
import { RefreshCw } from 'lucide-react'

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [instances, setInstances] = useState<Instance[]>([])
  const [activeChannel, setActiveChannel] = useState('general')
  const [replyTo, setReplyTo] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastIdRef = useRef<number>(0)
  const isAtBottomRef = useRef(true)

  // Check if scrolled to bottom
  function checkAtBottom() {
    const el = containerRef.current
    if (!el) return
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 50
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Fetch channels + instances
  useEffect(() => {
    async function fetchMeta() {
      try {
        const [chRes, instRes] = await Promise.all([
          fetch('/api/chat?action=channels'),
          fetch('/api/chat?action=instances'),
        ])
        const chData = await chRes.json()
        const instData = await instRes.json()

        if (Array.isArray(chData)) {
          setChannels(chData)
        } else if (chData.channels) {
          setChannels(chData.channels)
        }

        if (Array.isArray(instData)) {
          setInstances(instData)
        } else if (instData.instances) {
          setInstances(instData.instances)
        }
      } catch (e) {
        console.error('Failed to fetch meta:', e)
      }
    }
    fetchMeta()
    const interval = setInterval(fetchMeta, 30000)
    return () => clearInterval(interval)
  }, [])

  // Fetch messages
  const fetchMessages = useCallback(async (isInitial = false) => {
    try {
      const afterId = isInitial ? '' : `&after_id=${lastIdRef.current}`
      const limit = isInitial ? 100 : 50
      const res = await fetch(`/api/chat?action=messages&channel=${activeChannel}&limit=${limit}${afterId}`)
      const data = await res.json()

      // Parse the response - cross-claude returns text with message list
      let parsed: ChatMessage[] = []
      if (Array.isArray(data)) {
        parsed = data
      } else if (data.messages) {
        parsed = data.messages
      } else if (typeof data === 'string' || typeof data.text === 'string') {
        // Parse text format from cross-claude
        const text = typeof data === 'string' ? data : data.text
        parsed = parseMessagesFromText(text)
      }

      if (parsed.length > 0) {
        if (isInitial) {
          setMessages(parsed)
        } else {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id))
            const newMsgs = parsed.filter((m) => !existingIds.has(m.id))
            return newMsgs.length > 0 ? [...prev, ...newMsgs] : prev
          })
        }
        const maxId = Math.max(...parsed.map((m) => m.id))
        if (maxId > lastIdRef.current) lastIdRef.current = maxId

        // Auto-scroll if at bottom
        if (isAtBottomRef.current) {
          setTimeout(scrollToBottom, 50)
        }
      }
    } catch (e) {
      console.error('Failed to fetch messages:', e)
    } finally {
      if (isInitial) setLoading(false)
    }
  }, [activeChannel])

  // Initial load
  useEffect(() => {
    lastIdRef.current = 0
    setMessages([])
    setLoading(true)
    fetchMessages(true)
  }, [activeChannel, fetchMessages])

  // Polling
  useEffect(() => {
    if (!polling) return
    const interval = setInterval(() => fetchMessages(false), 5000)
    return () => clearInterval(interval)
  }, [polling, fetchMessages])

  // Get reply preview
  const replyPreview = replyTo ? messages.find((m) => m.id === replyTo)?.content : undefined
  const messagesMap = new Map(messages.map((m) => [m.id, m]))

  // Group messages by date
  let lastDate = ''

  return (
    <div className="flex h-[calc(100vh-80px)] -mx-4 -my-6 bg-beige/30">
      {/* Sidebar */}
      <ChatSidebar
        channels={channels}
        instances={instances}
        activeChannel={activeChannel}
        onSelectChannel={(ch) => setActiveChannel(ch)}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Channel header */}
        <div className="px-4 py-2.5 border-b border-navy/10 bg-white/80 flex items-center justify-between">
          <h2 className="font-semibold text-navy">#{activeChannel}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPolling((p) => !p)}
              className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1 transition-colors ${
                polling ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}
            >
              <RefreshCw size={11} className={polling ? 'animate-spin' : ''} style={polling ? { animationDuration: '3s' } : {}} />
              {polling ? '실시간' : '정지'}
            </button>
            <span className="text-xs text-navy/30">{messages.length}개 메시지</span>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={containerRef}
          onScroll={checkAtBottom}
          className="flex-1 overflow-y-auto py-2"
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-navy/40">메시지 불러오는 중...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-navy/30">메시지가 없습니다</div>
            </div>
          ) : (
            messages.map((msg) => {
              const msgDate = formatDate(msg.timestamp)
              const showDate = msgDate !== lastDate
              lastDate = msgDate

              return (
                <div key={msg.id}>
                  {showDate && <DateDivider date={msgDate} />}
                  <MessageBubble
                    message={msg}
                    replyTarget={msg.in_reply_to ? messagesMap.get(msg.in_reply_to) : undefined}
                    onReply={(id) => setReplyTo(id)}
                  />
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <ChatInput
          channel={activeChannel}
          replyTo={replyTo}
          replyPreview={replyPreview}
          onClearReply={() => setReplyTo(null)}
          onSent={() => fetchMessages(false)}
        />
      </div>
    </div>
  )
}

/** Parse cross-claude text format into message objects */
function parseMessagesFromText(text: string): ChatMessage[] {
  const messages: ChatMessage[] = []
  // Pattern: #123 [type] sender (timestamp):
  const regex = /^#(\d+)\s+\[(\w+)\]\s+(\S+)\s+\(([^)]+)\)(?:\s+\(reply to #(\d+)\))?/gm
  const blocks = text.split(/(?=^#\d+\s+\[)/m)

  for (const block of blocks) {
    const match = block.match(/^#(\d+)\s+\[(\w+)\]\s+(\S+)\s+\(([^)]+)\)(?:\s+\(reply to #(\d+)\))?(?:\s+\[\d+ replies?\])?:\n?([\s\S]*)/)
    if (match) {
      const content = match[6]?.trim().replace(/\n---\s*$/, '').trim() || ''
      messages.push({
        id: parseInt(match[1]),
        message_type: match[2] as ChatMessage['message_type'],
        sender: match[3],
        timestamp: match[4],
        in_reply_to: match[5] ? parseInt(match[5]) : undefined,
        channel: 'general',
        content,
      })
    }
  }

  return messages
}
