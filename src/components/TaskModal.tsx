"use client";

import { useState, useEffect, useCallback } from "react";
import { Task, Phase, Feedback } from "@/types/database";
import { supabase } from "@/lib/supabase";
import FeedbackSection from "./FeedbackSection";

interface Props {
  task: Task | null;
  phaseId: number | null;
  phases: Phase[];
  onClose: () => void;
  onSaved: () => void;
}

const STATUS_OPTIONS: Task["status"][] = ["대기", "검증필요", "완료"];

export default function TaskModal({ task, phaseId, phases, onClose, onSaved }: Props) {
  const isEdit = !!task;

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [assignee, setAssignee] = useState(task?.assignee ?? "");
  const [status, setStatus] = useState<Task["status"]>(task?.status ?? "대기");
  const [priority, setPriority] = useState<string>(
    task?.priority?.toString() ?? "3"
  );
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [selectedPhaseId, setSelectedPhaseId] = useState<number>(
    task?.phase_id ?? phaseId ?? phases[0]?.id ?? 0
  );
  const [saving, setSaving] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);

  const loadFeedbacks = useCallback(async () => {
    if (!task) return;
    try {
      const { data } = await supabase
        .from("feedback")
        .select("*")
        .eq("task_id", task.id)
        .order("created_at", { ascending: true });
      if (data) setFeedbacks(data);
    } catch {
      // 조용히 실패
    }
  }, [task]);

  useEffect(() => {
    loadFeedbacks();
  }, [loadFeedbacks]);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      assignee: assignee.trim() || null,
      status,
      priority: parseInt(priority) || 3,
      notes: notes.trim() || null,
      phase_id: selectedPhaseId,
      updated_at: new Date().toISOString(),
    };

    try {
      if (isEdit && task) {
        const { error } = await supabase
          .from("tasks")
          .update(payload)
          .eq("id", task.id);
        if (error) {
          alert("저장 실패: " + error.message);
          return;
        }
      } else {
        const { error } = await supabase.from("tasks").insert({
          ...payload,
          created_at: new Date().toISOString(),
        });
        if (error) {
          alert("생성 실패: " + error.message);
          return;
        }
      }

      onSaved();
      onClose();
    } catch (err) {
      alert("오류 발생");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    if (!confirm("이 태스크를 삭제하시겠습니까?")) return;

    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", task.id);
      if (!error) {
        onSaved();
        onClose();
      }
    } catch {
      alert("삭제 실패");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-10 sm:pt-20 px-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg mb-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cream-dark/20">
          <h2 className="text-lg font-semibold text-navy">
            {isEdit ? "태스크 수정" : "태스크 추가"}
          </h2>
          <button
            onClick={onClose}
            className="text-navy/40 hover:text-navy text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* 폼 */}
        <div className="px-5 py-4 space-y-4">
          {/* Phase 선택 */}
          {!isEdit && (
            <div>
              <label className="block text-xs font-medium text-navy/60 mb-1">
                페이즈
              </label>
              <select
                value={selectedPhaseId}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) setSelectedPhaseId(val);
                }}
                className="w-full border border-cream-dark/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
              >
                {phases.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-navy/60 mb-1">
              제목 *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-cream-dark/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
              placeholder="태스크 제목"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-navy/60 mb-1">
              설명
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-cream-dark/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 resize-none"
              placeholder="설명"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-navy/60 mb-1">
                담당자
              </label>
              <input
                type="text"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full border border-cream-dark/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                placeholder="이름"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-navy/60 mb-1">
                상태
              </label>
              <select
                value={status}
                onChange={(e) => {
                  const val = e.target.value as Task["status"];
                  if (val) setStatus(val);
                }}
                className="w-full border border-cream-dark/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-navy/60 mb-1">
                우선순위
              </label>
              <input
                type="number"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                min={1}
                max={9}
                className="w-full border border-cream-dark/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-navy/60 mb-1">
              메모
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-cream-dark/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 resize-none"
              placeholder="메모"
            />
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-cream-dark/20">
          <div>
            {isEdit && (
              <button
                onClick={handleDelete}
                className="text-sm text-red-500 hover:text-red-700 transition-colors"
              >
                삭제
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-navy/60 hover:text-navy transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="px-4 py-2 bg-navy text-white text-sm rounded-lg hover:bg-navy-light disabled:opacity-50 transition-colors"
            >
              {saving ? "저장 중..." : isEdit ? "수정" : "추가"}
            </button>
          </div>
        </div>

        {/* 피드백 섹션 */}
        {isEdit && task && (
          <FeedbackSection
            taskId={task.id}
            feedbacks={feedbacks}
            onFeedbackAdded={loadFeedbacks}
          />
        )}
      </div>
    </div>
  );
}
