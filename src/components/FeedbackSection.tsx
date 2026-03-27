'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Feedback } from '@/types/database'

interface FeedbackSectionProps {
  taskId: number
}

const actionColors: Record<string, string> = {
  '승인': 'bg-green-500 text-white',
  '반려': 'bg-red-500 text-white',
  '코멘트': 'bg-gray-400 text-white',
}

const actionBorderColors: Record<string, string> = {
  '승인': 'border-l-green-500',
  '반려': 'border-l-red-500',
  '코멘트': 'border-l-gray-400',
}

export default function FeedbackSection({ taskId }: FeedbackSectionProps) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [author, setAuthor] = useState('')
  const [action, setAction] = useState<'승인' | '반려' | '코멘트'>('코멘트')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchFeedbacks()
  }, [taskId])

  async function fetchFeedbacks() {
    const { data } = await supabase
      .from('feedback')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })
    setFeedbacks((data || []) as Feedback[])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!author.trim() || !content.trim()) return
    setSubmitting(true)

    await supabase.from('feedback').insert({
      task_id: taskId,
      author: author.trim(),
      action,
      content: content.trim(),
    })

    setContent('')
    await fetchFeedbacks()
    setSubmitting(false)
  }

  return (
    <div className="mt-6 border-t border-navy/10 pt-4">
      <h3 className="text-sm font-semibold text-navy mb-3">피드백</h3>

      {feedbacks.length > 0 && (
        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
          {feedbacks.map((fb) => (
            <div
              key={fb.id}
              className={`border-l-4 ${actionBorderColors[fb.action]} bg-white p-3 rounded-r-lg`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${actionColors[fb.action]}`}>
                  {fb.action}
                </span>
                <span className="text-xs font-medium text-navy">{fb.author}</span>
                <span className="text-xs text-navy/40">
                  {new Date(fb.created_at).toLocaleString('ko-KR')}
                </span>
              </div>
              <p className="text-sm text-navy/80">{fb.content}</p>
            </div>
          ))}
        </div>
      )}

      {feedbacks.length === 0 && (
        <p className="text-sm text-navy/30 mb-4">아직 피드백이 없습니다.</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="작성자"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="flex-1 text-sm border border-navy/20 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-navy/40"
          />
          <div className="flex gap-1">
            {(['승인', '반려', '코멘트'] as const).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAction(a)}
                className={`text-xs px-3 py-2 rounded-lg border transition-all ${
                  action === a
                    ? actionColors[a] + ' border-transparent'
                    : 'border-navy/20 text-navy/60 hover:border-navy/40'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="피드백 내용을 입력하세요"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 text-sm border border-navy/20 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-navy/40"
          />
          <button
            type="submit"
            disabled={submitting || !author.trim() || !content.trim()}
            className="text-sm px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy-light disabled:opacity-40 transition-all"
          >
            등록
          </button>
        </div>
      </form>
    </div>
  )
}
