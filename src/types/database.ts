export interface Project {
  id: string;
  name: string;
  description: string | null;
  target_date: string | null;
  status: "active" | "archived";
  claude_md: string | null;
  folder_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface Phase {
  id: number;
  project_id: string;
  name: string;
  sort_order: number;
  milestone_date: string | null;
  created_at: string;
}

export interface Task {
  id: number;
  phase_id: number;
  title: string;
  description: string | null;
  notes: string | null;
  status: "대기" | "검증필요" | "완료";
  assignee: string | null;
  skill_ref: string | null;
  skill_version: string | null;
  priority: number | null;
  depends_on: number[] | null;
  result_path: string | null;
  work_note: string | null;
  started_at: string | null;
  completed_at: string | null;
  duration_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: number;
  task_id: number;
  mode: "이동" | "복사" | "참조";
  file_path: string | null;
  original_path: string | null;
  file_name: string | null;
  created_at: string;
}

export interface Feedback {
  id: number;
  task_id: number;
  author: string;
  action: "승인" | "반려" | "코멘트";
  content: string | null;
  created_at: string;
}

export interface ProjectWithStats extends Project {
  total_tasks: number;
  completed_tasks: number;
  phase_count: number;
}
