import { useState } from 'react'
import type { Employee, EmployeeFormData } from '@/types'

export function useEmployeeManagement() {
  const [newEmployee, setNewEmployee] = useState<EmployeeFormData>({
    name: "",
    sucursal: "",
    weeklyHours: 32,
  })

  const createEmployee = (): Employee | null => {
    if (newEmployee.name && newEmployee.sucursal) {
      const employee: Employee = {
        id: Date.now().toString(),
        name: newEmployee.name,
        sucursal: newEmployee.sucursal,
        weeklyHours: 32,
      }
      
      // Reset form
      setNewEmployee({
        name: "",
        sucursal: "",
        weeklyHours: 32,
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
