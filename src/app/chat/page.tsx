"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface ChatMessage {
  id: number;
  type: string;
  sender: string;
  timestamp: string;
  content: string;
  replyTo?: number;
}

function parseMessages(text: string): ChatMessage[] {
  const messages: ChatMessage[] = [];
  const blocks = text.split(/\n---\n/).filter((b) => b.trim());

  for (const block of blocks) {
    const match = block.match(
      /#(\d+)\s+\[(\w+)]\s+(.+?)\s+\((.+?)\)(?:\s+\(reply to #(\d+)\))?:\n([\s\S]*)/
    );
    if (!match) continue;
    messages.push({
      id: parseInt(match[1]),
      type: match[2],
      sender: match[3],
      timestamp: match[4],
      content: match[6].trim(),
      replyTo: match[5] ? parseInt(match[5]) : undefined,
    });
  }
  return messages;
}

function formatTime(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return ts;
  }
}

function formatDate(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
  } catch {
    return "";
  }
}

const SENDER_COLORS: Record<string, string> = {
  건주: "text-blue-600",
  strategist: "text-emerald-600",
  "code-worker": "text-orange-500",
  "code-worker-2": "text-purple-600",
};

function senderColor(name: string): string {
  return SENDER_COLORS[name] || "text-navy";
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [channel] = useState("general");
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef<number | null>(null);

  const fetchMessages = useCallback(async (afterId?: number) => {
    try {
      const params = new URLSearchParams({
        action: "messages",
        channel,
        limit: "50",
      });
      if (afterId) params.set("after_id", String(afterId));

      const res = await fetch(`/api/chat?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.error) throw new Error(data.error);
      if (!data.text) return [];

      return parseMessages(data.text);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "메시지를 불러올 수 없습니다";
      setError(msg);
      return [];
    }
  }, [channel]);

  // Initial load
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const msgs = await fetchMessages();
      if (!mounted) return;
      setMessages(msgs);
      if (msgs.length > 0) lastIdRef.current = msgs[msgs.length - 1].id;
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [fetchMessages]);

  // Poll for new messages
  useEffect(() => {
    const interval = setInterval(async () => {
      const newMsgs = await fetchMessages(lastIdRef.current ?? undefined);
      if (newMsgs.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const fresh = newMsgs.filter((m) => !existingIds.has(m.id));
          if (fresh.length === 0) return prev;
          const merged = [...prev, ...fresh];
          lastIdRef.current = merged[merged.length - 1].id;
          return merged;
        });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-navy/50">메시지 불러오는 중...</div>
      </div>
    );
  }

  if (error && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-red-500 bg-red-50 rounded-lg p-4">{error}</div>
      </div>
    );
  }

  let lastDate = "";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold text-navy">채팅</h1>
        <span className="text-sm text-navy/40 bg-cream rounded-full px-3 py-0.5">
          #{channel}
        </span>
      </div>

      <div className="bg-white rounded-xl border border-cream-dark/30 overflow-hidden">
        <div className="divide-y divide-cream-dark/20">
          {messages.map((msg) => {
            const dateStr = formatDate(msg.timestamp);
            const showDate = dateStr !== lastDate;
            lastDate = dateStr;

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="text-center py-2">
                    <span className="text-xs text-navy/40 bg-cream-light px-3 py-1 rounded-full">
                      {dateStr}
                    </span>
                  </div>
                )}
                <div className="px-4 py-3 hover:bg-cream-light/50 transition-colors">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className={`font-semibold text-sm ${senderColor(msg.sender)}`}>
                      {msg.sender}
                    </span>
                    <span className="text-xs text-navy/30">{formatTime(msg.timestamp)}</span>
                    <span className="text-[10px] text-navy/20">#{msg.id}</span>
                    {msg.type === "request" && (
                      <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">
                        요청
                      </span>
                    )}
                  </div>
                  {msg.replyTo && (
                    <div className="text-xs text-navy/40 mb-1 pl-2 border-l-2 border-navy/10">
                      #{msg.replyTo}에 대한 답장
                    </div>
                  )}
                  <div className="text-sm text-navy/80 whitespace-pre-wrap break-words">
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div ref={bottomRef} />
      </div>

      {messages.length === 0 && (
        <p className="text-center text-navy/40 mt-8">메시지가 없습니다.</p>
      )}
    </div>
  );
}
