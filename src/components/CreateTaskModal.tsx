'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Task } from '@/types/database'

interface CreateTaskModalProps {
  phaseId: number
  onClose: () => void
  onCreated: () => void
}

export default function CreateTaskModal({ phaseId, onClose, onCreated }: CreateTaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignee, setAssignee] = useState('')
  const [priority, setPriority] = useState(2)
  const [status, setStatus] = useState<Task['status']>('대기')
  const [saving, setSaving] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)

    await supabase.from('tasks').insert({
      phase_id: phaseId,
      title: title.trim(),
      description: description.trim() || null,
      assignee: assignee.trim() || null,
      priority,
      status,
      notes: null,
    })

    setSaving(false)
    onCreated()
    onClose()
  }

  const statusOptions: { value: Task['status']; label: string; color: string }[] = [
    { value: '대기', label: '대기', color: 'bg-status-wait' },
    { value: '검증필요', label: '검증필요', color: 'bg-status-review' },
    { value: '완료', label: '완료', color: 'bg-status-done' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-beige rounded-2xl shadow-2xl w-full max-w-md modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-navy/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy">새 태스크</h2>
          <button onClick={onClose} className="text-navy/40 hover:text-navy text-2xl leading-none">
            &times;
          </button>
        </div>

        <form onSubmit={handleCreate} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-navy/60 mb-1">제목 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-navy/40"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-navy/60 mb-1">상태</label>
            <div className="flex gap-1">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
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

          <div className="grid grid-cols-2 gap-3">
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
          </div>

          <div>
            <label className="block text-xs font-medium text-navy/60 mb-1">설명</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-navy/40 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="w-full bg-navy text-white py-2.5 rounded-lg text-sm font-medium hover:bg-navy-light disabled:opacity-40 transition-all"
          >
            {saving ? '생성 중...' : '태스크 생성'}
          </button>
        </form>
      </div>
    </div>
  )
}
