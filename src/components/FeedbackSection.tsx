"use client";

import { useState } from "react";
import { Feedback } from "@/types/database";
import { supabase } from "@/lib/supabase";

interface Props {
  taskId: number;
  feedbacks: Feedback[];
  onFeedbackAdded: () => void;
}

const ACTION_OPTIONS: Feedback["action"][] = ["승인", "반려", "코멘트"];

const ACTION_COLORS: Record<Feedback["action"], string> = {
  승인: "bg-emerald-100 text-emerald-700",
  반려: "bg-red-100 text-red-700",
  코멘트: "bg-blue-100 text-blue-700",
};

export default function FeedbackSection({
  taskId,
  feedbacks,
  onFeedbackAdded,
}: Props) {
  const [author, setAuthor] = useState("");
  const [action, setAction] = useState<Feedback["action"]>("코멘트");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!author.trim() || !content.trim()) return;
    setSubmitting(true);

    try {
      const { error } = await supabase.from("feedback").insert({
        task_id: taskId,
        author: author.trim(),
        action,
        content: content.trim(),
        created_at: new Date().toISOString(),
      });

      if (!error) {
        setContent("");
        onFeedbackAdded();
      } else {
        alert("피드백 저장 실패: " + error.message);
      }
    } catch {
      alert("오류 발생");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="border-t border-cream-dark/20 px-5 py-4">
      <h3 className="text-sm font-semibold text-navy mb-3">피드백</h3>

      {/* 피드백 목록 */}
      {feedbacks.length > 0 && (
        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
          {feedbacks.map((fb) => (
            <div
              key={fb.id}
              className="bg-cream-light/50 rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-navy">
                  {fb.author}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded ${ACTION_COLORS[fb.action]}`}
                >
                  {fb.action}
                </span>
                <span className="text-[10px] text-navy/40 ml-auto">
                  {formatDate(fb.created_at)}
                </span>
              </div>
              {fb.content && (
                <p className="text-xs text-navy/70">{fb.content}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 피드백 입력 */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="작성자"
            className="border border-cream-dark/30 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-navy/20"
          />
          <select
            value={action}
            onChange={(e) => {
              const val = e.target.value as Feedback["action"];
              if (val) setAction(val);
            }}
            className="border border-cream-dark/30 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-navy/20"
          >
            {ACTION_OPTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="피드백 내용"
            className="flex-1 border border-cream-dark/30 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-navy/20"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                handleSubmit();
              }
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={submitting || !author.trim() || !content.trim()}
            className="px-3 py-1.5 bg-navy text-white text-xs rounded-lg hover:bg-navy-light disabled:opacity-50 transition-colors"
          >
            {submitting ? "..." : "등록"}
          </button>
        </div>
      </div>
    </div>
  );
}
