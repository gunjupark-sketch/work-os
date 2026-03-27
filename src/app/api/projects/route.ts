import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (!projects) return NextResponse.json([])

  const projectIds = projects.map((p) => p.id)
  const { data: phases } = await supabase
    .from('phases')
    .select('id, project_id')
    .in('project_id', projectIds)

  const phaseIds = (phases || []).map((ph) => ph.id)

  let tasks: { id: number; phase_id: number; status: string }[] = []
  if (phaseIds.length > 0) {
    const { data } = await supabase
      .from('tasks')
      .select('id, phase_id, status')
      .in('phase_id', phaseIds)
    tasks = data || []
  }

  const phaseToProject = new Map<number, string>()
  for (const ph of phases || []) {
    phaseToProject.set(ph.id, ph.project_id)
  }

  const stats = new Map<string, { total: number; completed: number; review: number; pending: number }>()
  for (const p of projects) {
    stats.set(p.id, { total: 0, completed: 0, review: 0, pending: 0 })
  }
  for (const t of tasks) {
    const projId = phaseToProject.get(t.phase_id)
    if (projId && stats.has(projId)) {
      const s = stats.get(projId)!
      s.total++
      if (t.status === '완료') s.completed++
      else if (t.status === '검증필요') s.review++
      else s.pending++
    }
  }

  const result = projects.map((p) => {
    const s = stats.get(p.id) || { total: 0, completed: 0, review: 0, pending: 0 }
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      status: p.status,
      progress: s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0,
      tasks: s,
      created_at: p.created_at,
      updated_at: p.updated_at,
    }
  })

  return NextResponse.json(result)
}
