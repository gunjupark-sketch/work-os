'use client'

import { useState } from 'react'
import { Task } from '@/types/database'
import { supabase } from '@/lib/supabase'
import TaskCard from './TaskCard'
import TaskModal from './TaskModal'
import CreateTaskModal from './CreateTaskModal'

interface KanbanBoardProps {
  tasks: Task[]
  phaseId: number | null // null means "all phases" view
  phaseName: string
  onRefresh: () => void
  reviewOnly?: boolean
}

const columns: { status: Task['status']; label: string; colorClass: string; dotColor: string }[] = [
  { status: '대기', label: '대기', colorClass: 'border-t-status-wait', dotColor: 'bg-status-wait' },
  { status: '검증필요', label: '검증필요', colorClass: 'border-t-status-review', dotColor: 'bg-status-review' },
  { status: '완료', label: '완료', colorClass: 'border-t-status-done', dotColor: 'bg-status-done' },
]

export default function KanbanBoard({ tasks, phaseId, phaseName, onRefresh, reviewOnly }: KanbanBoardProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [createPhaseId, setCreatePhaseId] = useState<number | null>(null)

  // Filter out subtasks from the main board view
  const topLevelTasks = tasks.filter((t) => !t.parent_task_id)

  const displayColumns = reviewOnly
    ? columns.filter((c) => c.status === '검증필요')
    : columns

  async function handleDrop(taskId: number, newStatus: Task['status']) {
    const updates: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    }
    if (newStatus !== '대기') {
      const task = tasks.find((t) => t.id === taskId)
      if (task && !task.started_at) {
        updates.started_at = new Date().toISOString()
      }
    }
    if (newStatus === '완료') {
      updates.completed_at = new Date().toISOString()
    } else {
      updates.completed_at = null
    }

    await supabase.from('tasks').update(updates).eq('id', taskId)
    onRefresh()
  }

  return (
    <div>
      <div className={`grid gap-4 ${reviewOnly ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
        {displayColumns.map((col) => {
          const colTasks = topLevelTasks.filter((t) => t.status === col.status)

          return (
            <div
              key={col.status}
              className={`bg-white/50 rounded-xl border-t-4 ${col.colorClass} min-h-[200px]`}
              onDragOver={(e) => {
                e.preventDefault()
                e.currentTarget.classList.add('bg-white/80')
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove('bg-white/80')
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.currentTarget.classList.remove('bg-white/80')
                const taskId = e.dataTransfer.getData('taskId')
                if (taskId) {
                  handleDrop(Number(taskId), col.status)
                }
              }}
            >
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                  <span className="text-sm font-semibold text-navy">{col.label}</span>
                  <span className="text-xs text-navy/40 ml-1">{colTasks.length}</span>
                </div>
                {phaseId && !reviewOnly && (
                  <button
                    onClick={() => setCreatePhaseId(phaseId)}
                    className="text-navy/30 hover:text-navy text-lg leading-none"
                    title="태스크 추가"
                  >
                    +
                  </button>
                )}
              </div>
              <div className="px-3 pb-3 space-y-2">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('taskId', String(task.id))
                    }}
                  >
                    <TaskCard task={task} onClick={setSelectedTask} />
                  </div>
                ))}
                {colTasks.length === 0 && (
                  <p className="text-center text-xs text-navy/20 py-8">비어 있음</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdated={() => {
            setSelectedTask(null)
            onRefresh()
          }}
        />
      )}

      {createPhaseId && (
        <CreateTaskModal
          phaseId={createPhaseId}
          onClose={() => setCreatePhaseId(null)}
          onCreated={onRefresh}
        />
      )}
    </div>
  )
}
