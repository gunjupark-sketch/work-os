'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Project, Task } from '@/types/database'
import Link from 'next/link'

interface ProjectWithStats extends Project {
  totalTasks: number
  completedTasks: number
}

export default function HomePage() {
  const [projects, setProjects] = useState<ProjectWithStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProjects() {
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (!projectsData) {
        setLoading(false)
        return
      }

      const projectIds = projectsData.map((p: Project) => p.id)
      const { data: phases } = await supabase
        .from('phases')
        .select('id, project_id')
        .in('project_id', projectIds)

      const phaseIds = (phases || []).map((ph: { id: number }) => ph.id)

      let tasks: Task[] = []
      if (phaseIds.length > 0) {
        const { data: tasksData } = await supabase
          .from('tasks')
          .select('id, phase_id, status')
          .in('phase_id', phaseIds)
        tasks = (tasksData || []) as Task[]
      }

      const phaseToProject = new Map<number, string>()
      for (const ph of phases || []) {
        phaseToProject.set(ph.id, ph.project_id)
      }

      const projectStats = new Map<string, { total: number; completed: number }>()
      for (const p of projectsData) {
        projectStats.set(p.id, { total: 0, completed: 0 })
      }
      for (const t of tasks) {
        const projId = phaseToProject.get(t.phase_id)
        if (projId && projectStats.has(projId)) {
          const stats = projectStats.get(projId)!
          stats.total++
          if (t.status === '완료') stats.completed++
        }
      }

      const enriched: ProjectWithStats[] = projectsData.map((p: Project) => ({
        ...p,
        totalTasks: projectStats.get(p.id)?.total || 0,
        completedTasks: projectStats.get(p.id)?.completed || 0,
      }))

      setProjects(enriched)
      setLoading(false)
    }

    fetchProjects()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-navy/50 text-lg">불러오는 중...</div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-6">프로젝트</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => {
          const progress = project.totalTasks > 0
            ? Math.round((project.completedTasks / project.totalTasks) * 100)
            : 0

          return (
            <Link
              key={project.id}
              href={`/project/${project.id}`}
              className="block bg-white rounded-xl shadow-sm border border-navy/10 p-5 hover:shadow-md hover:border-navy/20 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-lg font-semibold text-navy">{project.name}</h2>
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
              {project.description && (
                <p className="text-sm text-navy/60 mb-4 line-clamp-2">
                  {project.description}
                </p>
              )}
              <div className="mt-auto">
                <div className="flex items-center justify-between text-xs text-navy/50 mb-1">
                  <span>진행률</span>
                  <span>
                    {project.completedTasks}/{project.totalTasks} 태스크
                  </span>
                </div>
                <div className="w-full bg-navy/10 rounded-full h-2">
                  <div
                    className="bg-navy rounded-full h-2 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
      {projects.length === 0 && (
        <p className="text-center text-navy/40 mt-12">프로젝트가 없습니다.</p>
      )}
    </div>
  )
}
