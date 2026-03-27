export type TaskStatus = "pending" | "review_needed" | "done";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  folder_path: string | null;
  created_at: string;
}

export interface Phase {
  id: string;
  project_id: string;
  name: string;
  sort_order: number;
}

export interface Task {
  id: string;
  phase_id: string;
  parent_task_id: string | null;
  title: string;
  description: string | null;
  assignee: string | null;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
}

export interface Feedback {
  id: string;
  task_id: string;
  author: string;
  type: "approve" | "reject" | "comment";
  content: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      projects: { Row: Project; Insert: Omit<Project, "created_at">; Update: Partial<Project> };
      phases: { Row: Phase; Insert: Omit<Phase, "id">; Update: Partial<Phase> };
      tasks: { Row: Task; Insert: Omit<Task, "id" | "created_at" | "updated_at">; Update: Partial<Task> };
      feedback: { Row: Feedback; Insert: Omit<Feedback, "id" | "created_at">; Update: Partial<Feedback> };
    };
  };
}
