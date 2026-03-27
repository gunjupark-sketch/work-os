import { supabase } from "@/lib/supabase";
import { Project } from "@/types/database";
import Link from "next/link";

interface ProjectCard extends Project {
  phase_count: number;
  total_tasks: number;
  completed_tasks: number;
}

async function getProjects(): Promise<ProjectCard[]> {
  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .eq("status", "active")
    .order("updated_at", { ascending: false });

  if (error || !projects) return [];

  const cards: ProjectCard[] = [];

  for (const project of projects) {
    const { count: phaseCount } = await supabase
      .from("phases")
      .select("*", { count: "exact", head: true })
      .eq("project_id", project.id);

    const { data: phases } = await supabase
      .from("phases")
      .select("id")
      .eq("project_id", project.id);

    const phaseIds = phases?.map((p) => p.id) ?? [];

    let totalTasks = 0;
    let completedTasks = 0;

    if (phaseIds.length > 0) {
      const { count: total } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .in("phase_id", phaseIds);

      const { count: completed } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .in("phase_id", phaseIds)
        .eq("status", "완료");

      totalTasks = total ?? 0;
      completedTasks = completed ?? 0;
    }

    cards.push({
      ...project,
      phase_count: phaseCount ?? 0,
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
    });
  }

  return cards;
}

export const revalidate = 0;

export default async function HomePage() {
  const projects = await getProjects();

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-6">프로젝트</h1>

      {projects.length === 0 ? (
        <p className="text-navy/60">활성 프로젝트가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const progress =
              project.total_tasks > 0
                ? Math.round(
                    (project.completed_tasks / project.total_tasks) * 100
                  )
                : 0;

            return (
              <Link
                key={project.id}
                href={`/project/${project.id}`}
                className="block bg-white rounded-xl border border-cream-dark/30 p-5 hover:shadow-md transition-shadow"
              >
                <h2 className="text-lg font-semibold text-navy mb-1">
                  {project.name}
                </h2>
                {project.description && (
                  <p className="text-sm text-navy/60 mb-3 line-clamp-2">
                    {project.description}
                  </p>
                )}

                <div className="flex items-center gap-3 text-xs text-navy/50 mb-3">
                  <span>{project.phase_count}개 페이즈</span>
                  <span>
                    {project.completed_tasks}/{project.total_tasks} 완료
                  </span>
                </div>

                <div className="w-full bg-cream rounded-full h-2">
                  <div
                    className="bg-navy rounded-full h-2 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-right text-xs text-navy/50 mt-1">
                  {progress}%
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
