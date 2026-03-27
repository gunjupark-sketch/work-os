"use client";

import { useState, useCallback } from "react";
import { Phase, Task } from "@/types/database";
import { supabase } from "@/lib/supabase";
import TaskModal from "./TaskModal";

interface Props {
  phases: Phase[];
  tasks: Task[];
  projectId: string;
}

const STATUS_COLUMNS: Task["status"][] = ["대기", "검증필요", "완료"];

const STATUS_COLORS: Record<Task["status"], string> = {
  대기: "bg-gray-100 text-gray-700",
  검증필요: "bg-amber-50 text-amber-700",
  완료: "bg-emerald-50 text-emerald-700",
};

const PRIORITY_COLORS: Record<number, string> = {
  1: "bg-red-100 text-red-700",
  2: "bg-orange-100 text-orange-700",
  3: "bg-blue-100 text-blue-700",
};

export default function KanbanBoard({ phases, tasks: initialTasks, projectId }: Props) {
  const [activePhaseId, setActivePhaseId] = useState<number | "all">("all");
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [modalTask, setModalTask] = useState<Task | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createPhaseId, setCreatePhaseId] = useState<number | null>(null);

  const filteredTasks =
    activePhaseId === "all"
      ? tasks
      : tasks.filter((t) => t.phase_id === activePhaseId);

  const refreshTasks = useCallback(async () => {
    const phaseIds = phases.map((p) => p.id);
    if (phaseIds.length === 0) return;
    try {
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .in("phase_id", phaseIds)
        .order("priority", { ascending: true });
      if (data) setTasks(data);
    } catch {
      // 조용히 실패
    }
  }, [phases]);

  const handleStatusChange = async (taskId: number, newStatus: Task["status"]) => {
    const updates: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    if (newStatus === "완료") {
      updates.completed_at = new Date().toISOString();
    }

    try {
      const { error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", taskId);
      if (!error) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, ...updates } as Task : t
          )
        );
      }
    } catch {
      // 조용히 실패
    }
  };

  const openCreateModal = (phaseId: number) => {
    setCreatePhaseId(phaseId);
    setIsCreating(true);
    setModalTask(null);
  };

  const closeModal = () => {
    setModalTask(null);
    setIsCreating(false);
    setCreatePhaseId(null);
  };

  const getPhaseNameById = (phaseId: number) => {
    return phases.find((p) => p.id === phaseId)?.name ?? "";
  };

  return (
    <div>
      {/* Phase 탭 */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActivePhaseId("all")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activePhaseId === "all"
              ? "bg-navy text-white"
              : "bg-white text-navy/70 hover:bg-cream"
          }`}
        >
          전체
        </button>
        {phases.map((phase) => (
          <button
            key={phase.id}
            onClick={() => setActivePhaseId(phase.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activePhaseId === phase.id
                ? "bg-navy text-white"
                : "bg-white text-navy/70 hover:bg-cream"
            }`}
          >
            {phase.name}
          </button>
        ))}
      </div>

      {/* Task 추가 버튼 */}
      {activePhaseId !== "all" && (
        <button
          onClick={() => openCreateModal(activePhaseId)}
          className="mb-4 px-4 py-2 bg-navy text-white rounded-lg text-sm hover:bg-navy-light transition-colors"
        >
          + 태스크 추가
        </button>
      )}

      {/* 칸반 3열 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STATUS_COLUMNS.map((status) => {
          const columnTasks = filteredTasks.filter(
            (t) => t.status === status
          );

          return (
            <div key={status} className="bg-white/60 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-semibold ${STATUS_COLORS[status]}`}
                >
                  {status}
                </span>
                <span className="text-xs text-navy/40">
                  {columnTasks.length}
                </span>
              </div>

              <div className="space-y-2">
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => {
                      setModalTask(task);
                      setIsCreating(false);
                    }}
                    className="bg-white rounded-lg border border-cream-dark/20 p-3 cursor-pointer hover:shadow-sm transition-shadow"
                  >
                    <p className="text-sm font-medium text-navy mb-1">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {task.assignee && (
                        <span className="text-xs bg-cream px-1.5 py-0.5 rounded">
                          {task.assignee}
                        </span>
                      )}
                      {task.priority && (
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            PRIORITY_COLORS[task.priority] ??
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          P{task.priority}
                        </span>
                      )}
                      {activePhaseId === "all" && (
                        <span className="text-xs text-navy/40">
                          {getPhaseNameById(task.phase_id)}
                        </span>
                      )}
                    </div>

                    {/* 빠른 상태 변경 */}
                    <div className="flex gap-1 mt-2">
                      {STATUS_COLUMNS.filter((s) => s !== task.status).map(
                        (s) => (
                          <button
                            key={s}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(task.id, s);
                            }}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-cream/60 text-navy/50 hover:bg-cream hover:text-navy transition-colors"
                          >
                            {s}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 모달 */}
      {(modalTask || isCreating) && (
        <TaskModal
          task={modalTask}
          phaseId={createPhaseId}
          phases={phases}
          onClose={closeModal}
          onSaved={refreshTasks}
        />
      )}
    </div>
  );
}
