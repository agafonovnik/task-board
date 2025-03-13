export type EstimationType = "L" | "M" | "S" | "XS"
export type LevelType = number // 14-22

export interface EstimationWeight {
  type: EstimationType
  weights: {
    [key: number]: number // Level -> weight mapping
  }
}

export interface Task {
  id: string
  title: string
  estimation: EstimationType
  color: string
}

export interface Person {
  id: string
  name: string
  level: LevelType
  tasks: Task[]
  totalScore: number
}

