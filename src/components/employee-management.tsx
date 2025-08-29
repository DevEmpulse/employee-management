"use client"

import { toast } from "sonner"
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
      toast.success("Sucursal creada correctamente")
    }
  }

  const handleRemoveSucursal = (id: string) => {
    const sucursalToRemove = sucursales.find(s => s.id === id)
    setSucursales(sucursales.filter((s) => s.id !== id))
    // También remover empleados de esa sucursal
    setEmployees(employees.filter((e) => e.sucursal !== id))
    toast.success(`Sucursal "${sucursalToRemove?.name}" eliminada correctamente`)
  }

  const handleAddEmployee = () => {
    const employee = createEmployee()
    if (employee) {
      setEmployees([...employees, employee])
      toast.success("Empleado creado correctamente")
    }
  }

  const handleRemoveEmployee = (id: string) => {
    const employeeToRemove = employees.find(e => e.id === id)
    setEmployees(employees.filter((e) => e.id !== id))
    toast.success(`Empleado "${employeeToRemove?.name}" eliminado correctamente`)
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
