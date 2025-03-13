"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import type { EstimationType, Task } from "./types"

interface AddTaskFormProps {
  onAddTask: (title: string, estimation: EstimationType, color: string) => void
  onUpdateTask?: (taskId: string, title: string, estimation: EstimationType, color: string) => void
  onCancel: () => void
  inline?: boolean
  editTask?: Task | null
}

export function AddTaskForm({ onAddTask, onUpdateTask, onCancel, inline = false, editTask = null }: AddTaskFormProps) {
  const [title, setTitle] = useState("")
  const [estimation, setEstimation] = useState<EstimationType>("M")
  const [color, setColor] = useState("#A5D6A7") // Default to green

  // Initialize form with task data if in edit mode
  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title)
      setEstimation(editTask.estimation)
      setColor(editTask.color)
    }
  }, [editTask])

  const colorOptions = [
    { value: "#80CBC4", label: "Бирюзовый", className: "bg-teal-200" },
    { value: "#A5D6A7", label: "Зеленый", className: "bg-green-200" },
    { value: "#E6EE9C", label: "Желтый", className: "bg-yellow-200" },
    { value: "#e2e8f0", label: "Серый", className: "bg-gray-300"}
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim()) {
      if (editTask && onUpdateTask) {
        onUpdateTask(editTask.id, title.trim(), estimation, color)
      } else {
        onAddTask(title.trim(), estimation, color)
      }
      setTitle("")
      setEstimation("M")
      setColor("#A5D6A7")
    }
  }

  const cardClasses = inline ? "w-full h-full shadow-none border-0" : "w-full max-w-md mx-auto mb-6"

  return (
    <Card className={cardClasses}>
      <CardHeader className={inline ? "p-3" : undefined}>
        <CardTitle className={inline ? "text-base" : undefined}>
          {editTask ? "Редактировать задачу" : "Добавить задачу"}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className={inline ? "p-3 pt-0" : undefined}>
          <div className="grid w-full items-center gap-2">
            <div className="flex flex-col space-y-1">
              <Label htmlFor="title" className={inline ? "text-sm" : undefined}>
                Название задачи
              </Label>
              <Input
                id="title"
                placeholder="Название задачи"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className={inline ? "h-8 text-sm" : undefined}
              />
            </div>

            <div className="flex flex-col space-y-1">
              <Label className={inline ? "text-sm" : undefined}>Оценка</Label>
              <RadioGroup
                value={estimation}
                onValueChange={(value) => setEstimation(value as EstimationType)}
                className="flex space-x-2"
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="L" id="L" />
                  <Label htmlFor="L" className={inline ? "text-sm" : undefined}>
                    L
                  </Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="M" id="M" />
                  <Label htmlFor="M" className={inline ? "text-sm" : undefined}>
                    M
                  </Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="S" id="S" />
                  <Label htmlFor="S" className={inline ? "text-sm" : undefined}>
                    S
                  </Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="XS" id="XS" />
                  <Label htmlFor="XS" className={inline ? "text-sm" : undefined}>
                    XS
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex flex-col space-y-1">
              <Label className={inline ? "text-sm" : undefined}>Цвет</Label>
              <div className="flex space-x-2">
                {colorOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`w-6 h-6 rounded-full cursor-pointer ${option.className} ${color === option.value ? "ring-2 ring-offset-1 ring-black" : ""}`}
                    onClick={() => setColor(option.value)}
                    title={option.label}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className={`flex justify-between ${inline ? "p-3 pt-0" : undefined}`}>
          <Button variant="outline" onClick={onCancel} size={inline ? "sm" : undefined}>
            Отмена
          </Button>
          <Button type="submit" size={inline ? "sm" : undefined}>
            {editTask ? "Сохранить" : "Добавить"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

