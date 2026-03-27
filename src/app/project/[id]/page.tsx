import { supabase } from "@/lib/supabase";
import { Project, Phase, Task } from "@/types/database";
import { notFound } from "next/navigation";
import Link from "next/link";
import KanbanBoard from "@/components/KanbanBoard";

export const revalidate = 0;

interface Props {
  params: { id: string };
}

async function getProject(id: string) {
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (!project) return null;

  const { data: phases } = await supabase
    .from("phases")
    .select("*")
    .eq("project_id", id)
    .order("sort_order", { ascending: true });

  const phaseIds = phases?.map((p: Phase) => p.id) ?? [];
  let tasks: Task[] = [];

  if (phaseIds.length > 0) {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .in("phase_id", phaseIds)
      .order("priority", { ascending: true });
    tasks = data ?? [];
  }

  return {
    project: project as Project,
    phases: (phases ?? []) as Phase[],
    tasks,
  };
}

export default async function ProjectPage({ params }: Props) {
  const result = await getProject(params.id);

  if (!result) notFound();

  const { project, phases, tasks } = result;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "완료").length;
  const progress =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div>
      <Link
        href="/"
        className="text-sm text-navy/50 hover:text-navy transition-colors mb-4 inline-block"
      >
        &larr; 프로젝트 목록
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">{project.name}</h1>
        {project.description && (
          <p className="text-navy/60 mt-1">{project.description}</p>
        )}
        <div className="mt-3 flex items-center gap-4">
          <div className="flex-1 max-w-xs bg-cream rounded-full h-2.5">
            <div
              className="bg-navy rounded-full h-2.5 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm text-navy/60">
            {completedTasks}/{totalTasks} 완료 ({progress}%)
          </span>
        </div>
      </div>

      <KanbanBoard
        phases={phases}
        tasks={tasks}
        projectId={project.id}
      />
    </div>
  );
}
