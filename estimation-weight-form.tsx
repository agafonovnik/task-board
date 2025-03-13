"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { EstimationType, EstimationWeight } from "./types"

interface EstimationWeightFormProps {
  weights: EstimationWeight[]
  onSaveWeights: (weights: EstimationWeight[]) => void
  onClose: () => void
}

export function EstimationWeightForm({ weights, onSaveWeights, onClose }: EstimationWeightFormProps) {
  // Создаем глубокую копию весов для локального состояния
  const [localWeights, setLocalWeights] = useState<EstimationWeight[]>(() => {
    return JSON.parse(JSON.stringify(weights))
  })

  const [activeTab, setActiveTab] = useState<number>(14)

  // Обновляем локальное состояние при изменении пропсов
  useEffect(() => {
    setLocalWeights(JSON.parse(JSON.stringify(weights)))
  }, [weights])

  const handleWeightChange = (type: EstimationType, level: number, value: string) => {
    const numValue = Number.parseFloat(value) || 0
    setLocalWeights(
      localWeights.map((w) => {
        if (w.type === type) {
          return {
            ...w,
            weights: {
              ...w.weights,
              [level]: numValue,
            },
          }
        }
        return w
      }),
    )
  }

  const handleSave = () => {
    // Передаем все измененные веса обратно в родительский компонент
    onSaveWeights(localWeights)
  }

  // Generate array of levels from 14 to 22
  const levels = Array.from({ length: 9 }, (_, i) => 14 + i)

  return (
    <Card className="w-full max-w-md mx-auto mb-6">
      <CardHeader>
        <CardTitle>Настройки весов оценок</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab.toString()} onValueChange={(value) => setActiveTab(Number.parseInt(value))}>
          <TabsList className="grid grid-cols-9 mb-4">
            {levels.map((level) => (
              <TabsTrigger key={level} value={level.toString()}>
                {level}
              </TabsTrigger>
            ))}
          </TabsList>

          {levels.map((level) => (
            <TabsContent key={level} value={level.toString()}>
              <div className="grid w-full items-center gap-4">
                <h3 className="text-lg font-medium">Веса для грейда {level}</h3>
                {localWeights.map((weight) => (
                  <div key={`${weight.type}-${level}`} className="flex items-center space-x-4">
                    <Label htmlFor={`weight-${weight.type}-${level}`} className="w-10">
                      {weight.type}
                    </Label>
                    <Input
                      id={`weight-${weight.type}-${level}`}
                      type="number"
                      step="0.1"
                      min="0"
                      value={weight.weights[level]}
                      onChange={(e) => handleWeightChange(weight.type, level, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onClose}>
          Отмена
        </Button>
        <Button onClick={handleSave}>Сохранить</Button>
      </CardFooter>
    </Card>
  )
}

