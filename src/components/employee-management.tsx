"use client"

import { SucursalManagementSection } from "@/components/sections/sucursal-management-section"
import { EmployeeManagementSection } from "@/components/sections/employee-management-section"
import { EmployeeListSection } from "@/components/sections/employee-list-section"
import { useSucursalManagement } from "@/hooks/use-sucursal-management"
import { useEmployeeManagement } from "@/hooks/use-employee-management"
import type { Employee, Sucursal } from "@/types"

interface EmployeeManagementProps {
  sucursales: Sucursal[]
  setSucursales: (sucursales: Sucursal[]) => void
  employees: Employee[]
  setEmployees: (employees: Employee[]) => void
}

export function EmployeeManagement({ sucursales, setSucursales, employees, setEmployees }: EmployeeManagementProps) {
  const {
    newSucursal,
    createSucursal,
    updateSucursalField,
  } = useSucursalManagement()

  const {
    newEmployee,
    createEmployee,
    updateEmployeeField,
  } = useEmployeeManagement()

  const handleAddSucursal = () => {
    const sucursal = createSucursal()
    if (sucursal) {
      setSucursales([...sucursales, sucursal])
    }
  }

  const handleRemoveSucursal = (id: string) => {
    setSucursales(sucursales.filter((s) => s.id !== id))
    // También remover empleados de esa sucursal
    setEmployees(employees.filter((e) => e.sucursal !== id))
  }

  const handleAddEmployee = () => {
    const employee = createEmployee()
    if (employee) {
      setEmployees([...employees, employee])
    }
  }

  const handleRemoveEmployee = (id: string) => {
    setEmployees(employees.filter((e) => e.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <SucursalManagementSection
          sucursales={sucursales}
          newSucursal={newSucursal}
          onUpdateSucursal={updateSucursalField}
          onAddSucursal={handleAddSucursal}
          onRemoveSucursal={handleRemoveSucursal}
        />

        <EmployeeManagementSection
          sucursales={sucursales}
          newEmployee={newEmployee}
          onUpdateEmployee={updateEmployeeField}
          onAddEmployee={handleAddEmployee}
        />
      </div>

      <EmployeeListSection
        employees={employees}
        sucursales={sucursales}
        onRemoveEmployee={handleRemoveEmployee}
      />
    </div>
  )
}
