export interface Project {
  id: string
  name: string
  description: string | null
  status: 'active' | 'archived'
  folder_path: string | null
  created_at: string
  updated_at: string
}

export interface Phase {
  id: number
  project_id: string
  name: string
  sort_order: number
  milestone_date: string | null
  created_at: string
}

export interface Task {
  id: number
  phase_id: number
  title: string
  description: string | null
  notes: string | null
  status: '대기' | '검증필요' | '완료'
  assignee: string | null
  priority: number | null
  parent_task_id: number | null
  depends_on: number[] | null
  result_path: string | null
  work_note: string | null
  started_at: string | null
  completed_at: string | null
  duration_minutes: number | null
  created_at: string
  updated_at: string
}

export interface Attachment {
  id: number
  task_id: number
  mode: '이동' | '복사' | '참조'
  file_path: string | null
  original_path: string | null
  file_name: string | null
  created_at: string
}

export interface Feedback {
  id: number
  task_id: number
  author: string
  action: '승인' | '반려' | '코멘트'
  content: string
  created_at: string
}

export interface TaskMetrics {
  id: number
  task_type: string | null
  project_id: string | null
  duration_minutes: number | null
  review_hours: number | null
  completed_at: string | null
}

export interface RejectionPattern {
  id: number
  task_type: string | null
  rule: string | null
  source_count: number | null
  active: boolean | null
  last_applied: string | null
  created_at: string
}
