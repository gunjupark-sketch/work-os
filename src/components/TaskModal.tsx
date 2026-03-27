'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Task } from '@/types/database'
import FeedbackSection from './FeedbackSection'

interface TaskModalProps {
  task: Task
  onClose: () => void
  onUpdated: () => void
}

export default function TaskModal({ task, onClose, onUpdated }: TaskModalProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [assignee, setAssignee] = useState(task.assignee || '')
  const [status, setStatus] = useState<Task['status']>(task.status)
  const [priority, setPriority] = useState(task.priority || 2)
  const [notes, setNotes] = useState(task.notes || '')
  const [saving, setSaving] = useState(false)
  const [subtasks, setSubtasks] = useState<Task[]>([])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [addingSubtask, setAddingSubtask] = useState(false)

  useEffect(() => {
    fetchSubtasks()
  }, [task.id])

  async function fetchSubtasks() {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('parent_task_id', task.id)
        .order('created_at', { ascending: true })

      if (error) {
        // parent_task_id column might not exist; handle gracefully
        console.warn('Could not fetch subtasks:', error.message)
        setSubtasks([])
        return
      }
      setSubtasks((data || []) as Task[])
    } catch {
      setSubtasks([])
    }
  }

  async function handleSave() {
    setSaving(true)
    await supabase
      .from('tasks')
      .update({
        title,
        description: description || null,
        assignee: assignee || null,
        status,
        priority,
        notes: notes || null,
        updated_at: new Date().toISOString(),
        started_at: status !== '대기' && !task.started_at ? new Date().toISOString() : task.started_at,
        completed_at: status === '완료' && !task.completed_at ? new Date().toISOString() : (status !== '완료' ? null : task.completed_at),
      })
      .eq('id', task.id)

    setSaving(false)
    onUpdated()
  }

  async function handleAddSubtask() {
    if (!newSubtaskTitle.trim()) return
    setAddingSubtask(true)

    try {
      await supabase.from('tasks').insert({
        phase_id: task.phase_id,
        title: newSubtaskTitle.trim(),
        status: '대기',
        parent_task_id: task.id,
      })
      setNewSubtaskTitle('')
      await fetchSubtasks()
      onUpdated()
    } catch (err) {
      console.warn('Could not add subtask (parent_task_id may not exist):', err)
    }

    setAddingSubtask(false)
  }

  async function handleDeleteTask() {
    if (!confirm('이 태스크를 삭제하시겠습니까?')) return
    await supabase.from('feedback').delete().eq('task_id', task.id)
    await supabase.from('attachments').delete().eq('task_id', task.id)
    // Delete subtasks if any
    if (subtasks.length > 0) {
      for (const st of subtasks) {
        await supabase.from('feedback').delete().eq('task_id', st.id)
        await supabase.from('attachments').delete().eq('task_id', st.id)
      }
      await supabase.from('tasks').delete().eq('parent_task_id', task.id)
    }
    await supabase.from('tasks').delete().eq('id', task.id)
    onUpdated()
    onClose()
  }

  const statusOptions: { value: Task['status']; label: string; color: string }[] = [
    { value: '대기', label: '대기', color: 'bg-status-wait' },
    { value: '검증필요', label: '검증필요', color: 'bg-status-review' },
    { value: '완료', label: '완료', color: 'bg-status-done' },
  ]

  const subtaskStatusColor: Record<string, string> = {
    '대기': 'text-status-wait',
    '검증필요': 'text-status-review',
    '완료': 'text-status-done',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-beige rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-beige rounded-t-2xl border-b border-navy/10 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-navy">태스크 편집</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDeleteTask}
              className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
            >
              삭제
            </button>
            <button onClick={onClose} className="text-navy/40 hover:text-navy text-2xl leading-none">
              &times;
            </button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-navy/60 mb-1">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-navy/40"
            />
          </div>

          {/* Status & Priority & Assignee */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-navy/60 mb-1">상태</label>
              <div className="flex gap-1">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setStatus(opt.value)}
                    className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                      status === opt.value
                        ? `${opt.color} text-white border-transparent`
                        : 'border-navy/20 text-navy/60 hover:border-navy/40'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-navy/60 mb-1">우선순위</label>
              <select
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-navy/40"
              >
                <option value={1}>낮음</option>
                <option value={2}>보통</option>
                <option value={3}>높음</option>
                <option value={4}>긴급</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-navy/60 mb-1">담당자</label>
              <input
                type="text"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="이름"
                className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-navy/40"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-navy/60 mb-1">설명</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-navy/40 resize-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-navy/60 mb-1">메모</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-navy/40 resize-none"
            />
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="w-full bg-navy text-white py-2.5 rounded-lg text-sm font-medium hover:bg-navy-light disabled:opacity-40 transition-all"
          >
            {saving ? '저장 중...' : '저장'}
          </button>

          {/* Subtasks */}
          <div className="border-t border-navy/10 pt-4">
            <h3 className="text-sm font-semibold text-navy mb-3">하위 태스크</h3>
            {subtasks.length > 0 ? (
              <div className="space-y-1 mb-3">
                {subtasks.map((st) => (
                  <div key={st.id} className="flex items-center gap-2 text-sm px-3 py-2 bg-white rounded-lg">
                    <span className={`font-medium ${subtaskStatusColor[st.status]}`}>●</span>
                    <span className="text-navy flex-1">{st.title}</span>
                    <span className="text-xs text-navy/40">{st.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-navy/30 mb-3">하위 태스크가 없습니다.</p>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="하위 태스크 제목"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddSubtask()
                  }
                }}
                className="flex-1 text-sm border border-navy/20 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-navy/40"
              />
              <button
                onClick={handleAddSubtask}
                disabled={addingSubtask || !newSubtaskTitle.trim()}
                className="text-sm px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy-light disabled:opacity-40 transition-all"
              >
                + 하위태스크
              </button>
            </div>
          </div>

          {/* Feedback */}
          <FeedbackSection taskId={task.id} />
        </div>
      </div>
    </div>
  )
}
