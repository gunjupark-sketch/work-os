'use client'

import { Task } from '@/types/database'

const priorityLabels: Record<number, string> = {
  1: '낮음',
  2: '보통',
  3: '높음',
  4: '긴급',
}

const priorityColors: Record<number, string> = {
  1: 'bg-blue-100 text-blue-600',
  2: 'bg-gray-100 text-gray-600',
  3: 'bg-orange-100 text-orange-600',
  4: 'bg-red-100 text-red-600',
}

interface TaskCardProps {
  task: Task
  onClick: (task: Task) => void
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  return (
    <div
      onClick={() => onClick(task)}
      className="bg-white rounded-lg border border-navy/10 p-3 cursor-pointer hover:shadow-md hover:border-navy/20 transition-all group"
    >
      <h4 className="text-sm font-medium text-navy group-hover:text-navy-light mb-2 line-clamp-2">
        {task.title}
      </h4>
      <div className="flex items-center gap-2 flex-wrap">
        {task.assignee && (
          <span className="text-xs bg-beige text-navy/70 px-2 py-0.5 rounded-full">
            {task.assignee}
          </span>
        )}
        {task.priority && task.priority > 0 && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[task.priority] || 'bg-gray-100 text-gray-600'}`}>
            {priorityLabels[task.priority] || `P${task.priority}`}
          </span>
        )}
      </div>
    </div>
  )
}
