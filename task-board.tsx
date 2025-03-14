"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import type { Person, Task, EstimationType, EstimationWeight, LevelType } from "./types"
import { AddPersonForm } from "./add-person-form"
import { AddTaskForm } from "./add-task-form"
import { EstimationWeightForm } from "./estimation-weight-form"
import { TaskCard } from "./task-card"
import { Button } from "@/components/ui/button"
import { PlusCircle, ChevronUp, ChevronDown, X, Check, Edit2, RefreshCw } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, horizontalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Default estimation weights
const defaultEstimationWeights: EstimationWeight[] = [
  {
    type: "L",
    weights: {
      14: 2.0,
      15: 2.1,
      16: 2.2,
      17: 2.3,
      18: 2.4,
      19: 2.5,
      20: 2.6,
      21: 2.8,
      22: 3.0,
    },
  },
  {
    type: "M",
    weights: {
      14: 1.0,
      15: 1.05,
      16: 1.1,
      17: 1.15,
      18: 1.2,
      19: 1.25,
      20: 1.3,
      21: 1.4,
      22: 1.5,
    },
  },
  {
    type: "S",
    weights: {
      14: 0.5,
      15: 0.525,
      16: 0.55,
      17: 0.575,
      18: 0.6,
      19: 0.625,
      20: 0.65,
      21: 0.675,
      22: 0.7,
    },
  },
  {
    type: "XS",
    weights: {
      14: 0.2,
      15: 0.21,
      16: 0.22,
      17: 0.23,
      18: 0.24,
      19: 0.25,
      20: 0.26,
      21: 0.28,
      22: 0.3,
    },
  },
]

// Default people data
const defaultPeople: Person[] = [
  {
    id: "1",
    name: "Test",
    level: 20,
    tasks: [
      {
        id: "1-1",
        title: "Задача 1",
        estimation: "L",
        color: "#80CBC4",
      },
      {
        id: "1-2",
        title: "Задача 2",
        estimation: "M",
        color: "#A5D6A7",
      },
    ],
    totalScore: 0, // Will be calculated
  },
  {
    id: "2",
    name: "Тест 1",
    level: 17,
    tasks: [
      {
        id: "2-1",
        title: "Задача 1",
        estimation: "M",
        color: "#A5D6A7",
      },
      {
        id: "2-2",
        title: "Задача 2",
        estimation: "M",
        color: "#A5D6A7",
      },
    ],
    totalScore: 0, // Will be calculated
  },
  {
    id: "3",
    name: "Тест 2",
    level: 14,
    tasks: [
      {
        id: "3-1",
        title: "Задача 1",
        estimation: "S",
        color: "#E6EE9C",
      },
      {
        id: "3-2",
        title: "Задача 2",
        estimation: "S",
        color: "#E6EE9C",
      },
    ],
    totalScore: 0, // Will be calculated
  },
]

// Sortable task item component
function SortableTaskItem({
  task,
  personId,
  onDelete,
  onEdit,
  isEditing,
  editingTask,
  onUpdateTask,
  onCancelEdit,
}: {
  task: Task
  personId: string
  onDelete: () => void
  onEdit: () => void
  isEditing: boolean
  editingTask: Task | null
  onUpdateTask: (taskId: string, title: string, estimation: EstimationType, color: string) => void
  onCancelEdit: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id, disabled: isEditing, })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {isEditing ? (
        <div className="min-w-[150px] min-h-[150px]">
          <AddTaskForm
            onAddTask={() => {}} // Not used in edit mode
            onUpdateTask={onUpdateTask}
            onCancel={onCancelEdit}
            inline={true}
            editTask={editingTask}
          />
        </div>
      ) : (
        <TaskCard task={task} onDelete={onDelete} onEdit={onEdit} isDraggable={true} />
      )}
    </div>
  )
}

export default function TaskBoard() {
  // Load data from localStorage or use defaults
  const [people, setPeople] = useState<Person[]>(() => {
    if (typeof window !== "undefined") {
      const savedPeople = localStorage.getItem("taskBoardPeople")
      return savedPeople ? JSON.parse(savedPeople) : defaultPeople
    }
    return defaultPeople
  })

  const [estimationWeights, setEstimationWeights] = useState<EstimationWeight[]>(() => {
    if (typeof window !== "undefined") {
      const savedWeights = localStorage.getItem("taskBoardWeights")
      return savedWeights ? JSON.parse(savedWeights) : defaultEstimationWeights
    }
    return defaultEstimationWeights
  })

  const [showAddPerson, setShowAddPerson] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)
  const [showWeightSettings, setShowWeightSettings] = useState(false)
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null)
  const [editingPersonName, setEditingPersonName] = useState<string>("")
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor),
  )

  // Calculate scores for all people
  const calculateScores = (peopleToUpdate: Person[], weights: EstimationWeight[]): Person[] => {
    return peopleToUpdate.map((person) => {
      let totalScore = 0

      person.tasks.forEach((task) => {
        const estimationWeight = weights.find((w) => w.type === task.estimation)
        const weight = estimationWeight ? estimationWeight.weights[person.level] : 0
        totalScore += weight
      })

      // Round to 3 decimal places
      const roundedScore = Math.round(totalScore * 1000) / 1000

      return {
        ...person,
        totalScore: roundedScore,
      }
    })
  }

  // Сбросить все данные к дефолтным значениям
  const handleResetToDefaults = () => {
    // Очищаем localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("taskBoardPeople")
      localStorage.removeItem("taskBoardWeights")
    }

    // Устанавливаем дефолтные значения
    setPeople(JSON.parse(JSON.stringify(defaultPeople)))
    setEstimationWeights(JSON.parse(JSON.stringify(defaultEstimationWeights)))

    // Сбрасываем все состояния редактирования
    setShowAddPerson(false)
    setShowAddTask(false)
    setShowWeightSettings(false)
    setSelectedPersonId(null)
    setEditingTask(null)
    setEditingPersonId(null)
    setEditingPersonName("")
  }

  // Сохраняем все изменения весов сразу
  const handleSaveAllWeights = (newWeights: EstimationWeight[]) => {
    // Устанавливаем новые веса
    setEstimationWeights(newWeights)

    // Сохраняем в localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("taskBoardWeights", JSON.stringify(newWeights))
    }

    // Закрываем форму настроек
    setShowWeightSettings(false)
  }

  // Начать редактирование имени человека
  const handleEditPersonName = (personId: string, currentName: string) => {
    setEditingPersonId(personId)
    setEditingPersonName(currentName)
    // Фокус на поле ввода после рендеринга
    setTimeout(() => {
      if (nameInputRef.current) {
        nameInputRef.current.focus()
      }
    }, 0)
  }

  // Сохранить отредактированное имя
  const handleSavePersonName = () => {
    if (!editingPersonId) return

    const updatedPeople = people.map((person) => {
      if (person.id === editingPersonId) {
        return {
          ...person,
          name: editingPersonName.trim() || person.name, // Если пустое, оставляем старое имя
        }
      }
      return person
    })

    setPeople(updatedPeople)
    setEditingPersonId(null)
    setEditingPersonName("")

    // Сохраняем в localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("taskBoardPeople", JSON.stringify(updatedPeople))
    }
  }

  // Отменить редактирование имени
  const handleCancelEditName = () => {
    setEditingPersonId(null)
    setEditingPersonName("")
  }

  // Обработка нажатия Enter при редактировании имени
  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSavePersonName()
    } else if (e.key === "Escape") {
      handleCancelEditName()
    }
  }

  // Пересчитываем очки при изменении задач или весов
  useEffect(() => {
    const updatedPeople = calculateScores(people, estimationWeights)
    setPeople(updatedPeople)

    // Сохраняем в localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("taskBoardPeople", JSON.stringify(updatedPeople))
    }
  }, [
    // Зависимости, которые вызывают пересчет
    JSON.stringify(
      people.map((p) => ({
        id: p.id,
        level: p.level,
        tasks: p.tasks.map((t) => ({
          id: t.id,
          title: t.title,
          estimation: t.estimation,
          color: t.color,
        })),
      })),
    ),
    JSON.stringify(estimationWeights),
    ])

  const handleAddPerson = (name: string, level: LevelType) => {
    const newPerson: Person = {
      id: Date.now().toString(),
      name,
      level,
      tasks: [],
      totalScore: 0,
    }

    const updatedPeople = [...people, newPerson]
    setPeople(updatedPeople)
    setShowAddPerson(false)
  }

  const handleAddTask = (title: string, estimation: EstimationType, color: string) => {
    if (!selectedPersonId) return

    const newTask: Task = {
      id: Date.now().toString(),
      title,
      estimation,
      color,
    }

    const updatedPeople = people.map((person) => {
      if (person.id === selectedPersonId) {
        return {
          ...person,
          tasks: [...person.tasks, newTask],
        }
      }
      return person
    })

    setPeople(updatedPeople)
    setShowAddTask(false)
    setSelectedPersonId(null)
  }

  const handleUpdateTask = (taskId: string, title: string, estimation: EstimationType, color: string) => {
    if (!selectedPersonId) return

    const updatedPeople = people.map((person) => {
      if (person.id === selectedPersonId) {
        return {
          ...person,
          tasks: person.tasks.map((task) => (task.id === taskId ? { ...task, title, estimation, color } : task)),
        }
      }
      return person
    })

    setPeople(updatedPeople)
    setEditingTask(null)
    setSelectedPersonId(null)
  }

  const handleDeleteTask = (personId: string, taskId: string) => {
    const updatedPeople = people.map((person) => {
      if (person.id === personId) {
        return {
          ...person,
          tasks: person.tasks.filter((task) => task.id !== taskId),
        }
      }
      return person
    })

    setPeople(updatedPeople)
  }

  const handleEditTask = (personId: string, task: Task) => {
    setSelectedPersonId(personId)
    setEditingTask(task)
  }

  const handleMovePerson = (index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === people.length - 1)) {
      return // Can't move further in this direction
    }

    const newIndex = direction === "up" ? index - 1 : index + 1
    const newPeople = [...people]
    const [movedPerson] = newPeople.splice(index, 1)
    newPeople.splice(newIndex, 0, movedPerson)

    setPeople(newPeople)
  }

  const handleDeletePerson = (personId: string) => {
    setPeople(people.filter((person) => person.id !== personId))
  }

  const handleChangeLevel = (personId: string, level: string) => {
    setPeople(people.map((person) => (person.id === personId ? { ...person, level: Number.parseInt(level) } : person)))
  }

  const handleDragEnd = (event: DragEndEvent, personId: string) => {
    const { active, over } = event

    if (!over) return

    if (active.id !== over.id) {
      setPeople(
        people.map((person) => {
          if (person.id === personId) {
            const oldIndex = person.tasks.findIndex((task) => task.id === active.id)
            const newIndex = person.tasks.findIndex((task) => task.id === over.id)

            return {
              ...person,
              tasks: arrayMove(person.tasks, oldIndex, newIndex),
            }
          }
          return person
        }),
      )
    }
  }

  // Generate array of levels from 14 to 22
  const levels = Array.from({ length: 9 }, (_, i) => 14 + i)

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Доска задач</h1>
          <div className="flex gap-2">
            <Button onClick={() => setShowAddPerson(true)} className="flex items-center gap-1">
              <PlusCircle className="h-4 w-4" />
              Добавить человека
            </Button>
            <Button onClick={() => setShowWeightSettings(true)} variant="outline">
              Настройки оценок
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex items-center gap-1">
                  <RefreshCw className="h-4 w-4" />
                  Сбросить данные
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Сбросить все данные?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Это действие сбросит все данные к начальному состоянию. Все ваши изменения будут потеряны.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetToDefaults}>Сбросить</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Estimation Weight Settings */}
        {showWeightSettings && (
          <EstimationWeightForm
            weights={estimationWeights}
            onSaveWeights={handleSaveAllWeights}
            onClose={() => setShowWeightSettings(false)}
          />
        )}

        {/* Add Person Form */}
        {showAddPerson && <AddPersonForm onAddPerson={handleAddPerson} onCancel={() => setShowAddPerson(false)} />}

        {/* People and Tasks */}
        <div className="grid grid-cols-1 gap-8">
          {people.map((person, index) => (
            <div key={person.id} className="flex">
              <div className="w-40 flex flex-col justify-center pr-4 border-r border-gray-300 relative">
                <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-center -ml-10">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleMovePerson(index, "up")}
                      disabled={index === 0}
                      className={`p-1 rounded-full hover:bg-gray-200 ${index === 0 ? "text-gray-300 cursor-not-allowed" : "text-gray-600"}`}
                      aria-label="Переместить вверх"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleMovePerson(index, "down")}
                      disabled={index === people.length - 1}
                      className={`p-1 rounded-full hover:bg-gray-200 ${index === people.length - 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-600"}`}
                      aria-label="Переместить вниз"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-start">
                  {editingPersonId === person.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        ref={nameInputRef}
                        value={editingPersonName}
                        onChange={(e) => setEditingPersonName(e.target.value)}
                        onKeyDown={handleNameKeyDown}
                        className="h-8 text-xl font-medium"
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={handleSavePersonName}
                          className="text-green-600 hover:text-green-800 p-1"
                          aria-label="Сохранить имя"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleCancelEditName}
                          className="text-gray-400 hover:text-red-600 p-1"
                          aria-label="Отменить редактирование"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-medium">{person.name}</h2>
                      <button
                        onClick={() => handleEditPersonName(person.id, person.name)}
                        className="text-gray-400 hover:text-blue-600 p-1"
                        aria-label="Редактировать имя"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => handleDeletePerson(person.id)}
                    className="text-gray-400 hover:text-red-600 p-1"
                    aria-label="Удалить человека"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-3xl font-bold">{person.totalScore}</div>

                <div className="mt-2">
                  <Label htmlFor={`level-${person.id}`} className="text-sm mb-1 block">
                    Уровень
                  </Label>
                  <Select
                    value={person.level.toString()}
                    onValueChange={(value) => handleChangeLevel(person.id, value)}
                  >
                    <SelectTrigger id={`level-${person.id}`} className="w-full">
                      <SelectValue placeholder="Выберите уровень" />
                    </SelectTrigger>
                    <SelectContent>
                      {levels.map((level) => (
                        <SelectItem key={level} value={level.toString()}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex-1 flex overflow-x-auto gap-4 pl-4 pb-4">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => handleDragEnd(event, person.id)}
                >
                  <SortableContext items={person.tasks.map((task) => task.id)} strategy={horizontalListSortingStrategy}>
                    {person.tasks.map((task) => (
                      <SortableTaskItem
                        key={task.id}
                        task={task}
                        personId={person.id}
                        onDelete={() => handleDeleteTask(person.id, task.id)}
                        onEdit={() => handleEditTask(person.id, task)}
                        isEditing={editingTask?.id === task.id && selectedPersonId === person.id}
                        editingTask={editingTask}
                        onUpdateTask={handleUpdateTask}
                        onCancelEdit={() => {
                          setEditingTask(null)
                          setSelectedPersonId(null)
                        }}
                      />
                    ))}
                  </SortableContext>
                </DndContext>

                {showAddTask && selectedPersonId === person.id && !editingTask ? (
                  <div className="min-w-[150px] min-h-[150px]">
                    <AddTaskForm
                      onAddTask={handleAddTask}
                      onCancel={() => {
                        setShowAddTask(false)
                        setSelectedPersonId(null)
                      }}
                      inline={true}
                    />
                  </div>
                ) : (
                  !editingTask && (
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center min-h-[150px] min-w-[150px] cursor-pointer hover:bg-gray-50 flex-shrink-0"
                      onClick={() => {
                        setSelectedPersonId(person.id)
                        setShowAddTask(true)
                      }}
                    >
                      <div className="flex flex-col items-center text-gray-500">
                        <PlusCircle className="h-8 w-8 mb-2" />
                        <span>Добавить задачу</span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

