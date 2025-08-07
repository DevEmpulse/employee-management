export interface Employee {
  id: string
  name: string
  sucursal: string
  weeklyHours: number
  flexibleSchedule?: {
    morningDelay?: number
    afternoonDelay?: number
    earlyLeave?: number
  }
}

export interface EmployeeFormData {
  name: string
  sucursal: string
  weeklyHours: number
  hasFlexibleSchedule: boolean
  morningDelay: number
  afternoonDelay: number
  earlyLeave: number
}
