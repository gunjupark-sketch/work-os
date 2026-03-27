'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Project, Phase, Task } from '@/types/database'
import KanbanBoard from '@/components/KanbanBoard'
import CreateTaskModal from '@/components/CreateTaskModal'
import Link from 'next/link'

type TabType = 'all' | 'review' | number

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [phases, setPhases] = useState<Phase[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [loading, setLoading] = useState(true)
  const [createForPhase, setCreateForPhase] = useState<number | null>(null)

  const fetchData = useCallback(async () => {
    const [projectRes, phasesRes] = await Promise.all([
      supabase.from('projects').select('*').eq('id', projectId).single(),
      supabase.from('phases').select('*').eq('project_id', projectId).order('sort_order', { ascending: true }),
    ])

    setProject(projectRes.data as Project | null)
    const phasesData = (phasesRes.data || []) as Phase[]
    setPhases(phasesData)

    if (phasesData.length > 0) {
      const phaseIds = phasesData.map((p) => p.id)
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .in('phase_id', phaseIds)
        .order('created_at', { ascending: true })
      setTasks((tasksData || []) as Task[])
    } else {
      setTasks([])
    }

    setLoading(false)
  }, [projectId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-navy/50 text-lg">불러오는 중...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <p className="text-navy/50 mb-4">프로젝트를 찾을 수 없습니다.</p>
        <Link href="/" className="text-navy underline">돌아가기</Link>
      </div>
    )
  }

  const tabs: { key: TabType; label: string }[] = [
    { key: 'all', label: '전체보기' },
    { key: 'review', label: '검증필요 모아보기' },
    ...phases.map((p) => ({ key: p.id as TabType, label: p.name })),
  ]

  const filteredTasks =
    activeTab === 'all'
      ? tasks
      : activeTab === 'review'
        ? tasks.filter((t) => t.status === '검증필요')
        : tasks.filter((t) => t.phase_id === activeTab)

  const currentPhaseId = typeof activeTab === 'number' ? activeTab : null

  const totalTasks = tasks.filter((t) => !t.parent_task_id).length
  const completedTasks = tasks.filter((t) => !t.parent_task_id && t.status === '완료').length
  const reviewTasks = tasks.filter((t) => !t.parent_task_id && t.status === '검증필요').length

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link href="/" className="text-sm text-navy/40 hover:text-navy mb-2 inline-block">
          &larr; 프로젝트 목록
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-navy">{project.name}</h1>
            {project.description && (
              <p className="text-sm text-navy/60 mt-1">{project.description}</p>
            )}
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              project.status === 'active'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {project.status === 'active' ? '활성' : '보관'}
          </span>
        </div>

        {/* Stats bar */}
        <div className="flex gap-4 mt-4 text-sm">
          <div className="bg-white/60 rounded-lg px-3 py-2">
            <span className="text-navy/50">전체</span>{' '}
            <span className="font-semibold text-navy">{totalTasks}</span>
          </div>
          <div className="bg-white/60 rounded-lg px-3 py-2">
            <span className="text-navy/50">완료</span>{' '}
            <span className="font-semibold text-status-done">{completedTasks}</span>
          </div>
          <div className="bg-white/60 rounded-lg px-3 py-2">
            <span className="text-navy/50">검증필요</span>{' '}
            <span className="font-semibold text-status-review">{reviewTasks}</span>
          </div>
        </div>
      </div>

      {/* Phase Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={String(tab.key)}
            onClick={() => setActiveTab(tab.key)}
            className={`whitespace-nowrap text-sm px-4 py-2 rounded-lg transition-all ${
              activeTab === tab.key
                ? 'bg-navy text-white shadow-sm'
                : 'bg-white/60 text-navy/60 hover:bg-white hover:text-navy'
            }`}
          >
            {tab.label}
            {typeof tab.key === 'number' && (
              <span className="ml-1.5 text-xs opacity-60">
                {tasks.filter((t) => t.phase_id === tab.key && !t.parent_task_id).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Add task button for phase view */}
      {currentPhaseId && (
        <div className="mb-4">
          <button
            onClick={() => setCreateForPhase(currentPhaseId)}
            className="text-sm px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy-light transition-all"
          >
            + 태스크
          </button>
        </div>
      )}

      {/* Kanban Board */}
      <KanbanBoard
        tasks={filteredTasks}
        phaseId={currentPhaseId}
        phaseName={
          typeof activeTab === 'number'
            ? phases.find((p) => p.id === activeTab)?.name || ''
            : activeTab === 'review'
              ? '검증필요'
              : '전체'
        }
        onRefresh={fetchData}
        reviewOnly={activeTab === 'review'}
      />

      {/* Show add task buttons for "all" tab */}
      {activeTab === 'all' && phases.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {phases.map((phase) => (
            <button
              key={phase.id}
              onClick={() => setCreateForPhase(phase.id)}
              className="text-xs px-3 py-1.5 bg-white/60 text-navy/60 rounded-lg hover:bg-white hover:text-navy transition-all"
            >
              + {phase.name}에 태스크 추가
            </button>
          ))}
        </div>
      )}

      {createForPhase && (
        <CreateTaskModal
          phaseId={createForPhase}
          onClose={() => setCreateForPhase(null)}
          onCreated={fetchData}
        />
      )}
    </div>
  )
}
