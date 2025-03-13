"use client"

import type { Task } from "./types"
import { Trash2, Edit, GripHorizontal } from "lucide-react"

interface TaskCardProps {
  task: Task
  onDelete: () => void
  onEdit: () => void
  isDraggable?: boolean
}

export function TaskCard({ task, onDelete, onEdit, isDraggable = false }: TaskCardProps) {
  return (
    <div
      className="p-4 shadow-md flex flex-col justify-center min-h-[150px] min-w-[150px] relative group flex-shrink-0"
      style={{ backgroundColor: task.color }}
    >
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="text-gray-600 hover:text-blue-600" aria-label="Редактировать задачу">
          <Edit className="h-4 w-4" />
        </button>
        <button onClick={onDelete} className="text-gray-600 hover:text-red-600" aria-label="Удалить задачу">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {isDraggable && (
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab text-gray-600">
          <GripHorizontal className="h-4 w-4" />
        </div>
      )}

      <div className="text-center font-medium mb-2">{task.estimation}</div>
      <div className="text-center text-sm">{task.title}</div>
    </div>
  )
}

