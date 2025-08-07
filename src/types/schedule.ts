export interface DaySchedule {
  morning: boolean
  afternoon: boolean
  hours: number
  morningStart?: string
  morningEnd?: string
  afternoonStart?: string
  afternoonEnd?: string
}

export interface Schedule {
  employeeId: string
  employeeName: string
  sucursal: string
  weeklyHours: number
  schedule: {
    [key: string]: DaySchedule
  }
}
