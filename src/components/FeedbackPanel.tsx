"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Feedback } from "@/lib/types";
import { CheckCircle2, XCircle, MessageCircle, Send } from "lucide-react";

interface Props {
  taskId: string;
}

export default function FeedbackPanel({ taskId }: Props) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("feedback")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });
    setFeedbacks(data ?? []);
  }

  useEffect(() => {
    load();
  }, [taskId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit(type: Feedback["type"]) {
    if (type === "comment" && !content.trim()) return;
    setSending(true);
    await supabase.from("feedback").insert({
      task_id: taskId,
      author: "건주",
      type,
      content: content.trim() || null,
    });
    setContent("");
    setSending(false);

    if (type === "approve") {
      await supabase.from("tasks").update({ status: "done" }).eq("id", taskId);
    } else if (type === "reject") {
      await supabase.from("tasks").update({ status: "pending" }).eq("id", taskId);
    }

    load();
  }

  const typeIcon = (type: Feedback["type"]) => {
    switch (type) {
      case "approve": return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "reject": return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <MessageCircle className="w-4 h-4 text-navy/50" />;
    }
  };

  const typeLabel = (type: Feedback["type"]) => {
    switch (type) {
      case "approve": return "승인";
      case "reject": return "반려";
      default: return "코멘트";
    }
  };

  return (
    <div className="mt-3 border-t border-cream-dark pt-3">
      <h4 className="text-xs font-medium text-navy/60 mb-2">피드백</h4>

      {feedbacks.length > 0 && (
        <div className="space-y-2 mb-3">
          {feedbacks.map((f) => (
            <div key={f.id} className="flex items-start gap-2 text-xs">
              {typeIcon(f.type)}
              <div>
                <span className="font-medium">{f.author}</span>
                <span className="text-navy/50 ml-1">{typeLabel(f.type)}</span>
                {f.content && <p className="text-navy/70 mt-0.5">{f.content}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="코멘트 입력..."
          className="flex-1 border border-cream-dark rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-navy/30"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit("comment");
            }
          }}
        />
        <button
          onClick={() => submit("comment")}
          disabled={sending || !content.trim()}
          className="p-1.5 rounded-lg bg-navy/10 hover:bg-navy/20 disabled:opacity-30"
          title="코멘트"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => submit("approve")}
          disabled={sending}
          className="p-1.5 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 disabled:opacity-30"
          title="승인"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => submit("reject")}
          disabled={sending}
          className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 disabled:opacity-30"
          title="반려"
        >
          <XCircle className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
