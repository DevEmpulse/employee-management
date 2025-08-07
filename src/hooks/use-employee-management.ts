import { useState } from 'react'
import type { Employee, EmployeeFormData } from '@/types'

export function useEmployeeManagement() {
  const [newEmployee, setNewEmployee] = useState<EmployeeFormData>({
    name: "",
    sucursal: "",
    weeklyHours: 32,
    hasFlexibleSchedule: false,
    morningDelay: 0,
    afternoonDelay: 0,
    earlyLeave: 0,
  })

  const createEmployee = (): Employee | null => {
    if (newEmployee.name && newEmployee.sucursal) {
      const employee: Employee = {
        id: Date.now().toString(),
        name: newEmployee.name,
        sucursal: newEmployee.sucursal,
        weeklyHours: 32,
        flexibleSchedule: newEmployee.hasFlexibleSchedule
          ? {
              morningDelay: newEmployee.morningDelay,
              afternoonDelay: newEmployee.afternoonDelay,
              earlyLeave: newEmployee.earlyLeave,
            }
          : undefined,
      }
      
      // Reset form
      setNewEmployee({
        name: "",
        sucursal: "",
        weeklyHours: 32,
        hasFlexibleSchedule: false,
        morningDelay: 0,
        afternoonDelay: 0,
        earlyLeave: 0,
      })
      
      return employee
    }
    return null
  }

  const updateEmployeeField = (field: keyof EmployeeFormData, value: string | number | boolean) => {
    setNewEmployee({ ...newEmployee, [field]: value })
  }

  return {
    newEmployee,
    createEmployee,
    updateEmployeeField,
  }
}
