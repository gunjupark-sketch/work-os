import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Project
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  // Phases
  const { data: phases } = await supabase
    .from('phases')
    .select('*')
    .eq('project_id', id)
    .order('sort_order', { ascending: true })

  const phaseIds = (phases || []).map((ph) => ph.id)

  // Tasks
  let tasks: Record<string, unknown>[] = []
  if (phaseIds.length > 0) {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .in('phase_id', phaseIds)
      .order('created_at', { ascending: true })
    tasks = data || []
  }

  // Feedbacks
  const taskIds = tasks.map((t) => t.id as number)
  let feedbacks: Record<string, unknown>[] = []
  if (taskIds.length > 0) {
    const { data } = await supabase
      .from('feedbacks')
      .select('*')
      .in('task_id', taskIds)
      .order('created_at', { ascending: false })
    feedbacks = data || []
  }

  // Group tasks by phase, feedbacks by task
  const tasksByPhase = new Map<number, typeof tasks>()
  for (const t of tasks) {
    const pid = t.phase_id as number
    if (!tasksByPhase.has(pid)) tasksByPhase.set(pid, [])
    tasksByPhase.get(pid)!.push(t)
  }

  const feedbacksByTask = new Map<number, typeof feedbacks>()
  for (const f of feedbacks) {
    const tid = f.task_id as number
    if (!feedbacksByTask.has(tid)) feedbacksByTask.set(tid, [])
    feedbacksByTask.get(tid)!.push(f)
  }

  // Build response
  const result = {
    ...project,
    phases: (phases || []).map((phase) => {
      const phaseTasks = tasksByPhase.get(phase.id) || []
      return {
        ...phase,
        tasks: phaseTasks.map((task) => ({
          ...task,
          feedbacks: feedbacksByTask.get(task.id as number) || [],
        })),
        stats: {
          total: phaseTasks.length,
          completed: phaseTasks.filter((t) => t.status === '완료').length,
          review: phaseTasks.filter((t) => t.status === '검증필요').length,
          pending: phaseTasks.filter((t) => t.status === '대기').length,
        },
      }
    }),
  }

  return NextResponse.json(result)
}
