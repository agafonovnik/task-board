"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import type { LevelType } from "./types"

interface AddPersonFormProps {
  onAddPerson: (name: string, level: LevelType) => void
  onCancel: () => void
}

export function AddPersonForm({ onAddPerson, onCancel }: AddPersonFormProps) {
  const [name, setName] = useState("")
  const [level, setLevel] = useState<LevelType>(16)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onAddPerson(name.trim(), level)
      setName("")
      setLevel(16)
    }
  }

  // Generate array of levels from 14 to 22
  const levels = Array.from({ length: 9 }, (_, i) => 14 + i)

  return (
    <Card className="w-full max-w-md mx-auto mb-6">
      <CardHeader>
        <CardTitle>Добавить человека</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Имя</Label>
              <Input id="name" placeholder="Имя" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="level">Грейд</Label>
              <Select value={level.toString()} onValueChange={(value) => setLevel(Number.parseInt(value))}>
                <SelectTrigger id="level">
                  <SelectValue placeholder="Выберите грейд" />
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
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onCancel}>
            Отмена
          </Button>
          <Button type="submit">Добавить</Button>
        </CardFooter>
      </form>
    </Card>
  )
}

