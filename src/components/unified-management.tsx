"use client"

import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SucursalManagementSection } from "@/components/sections/sucursal-management-section"
import { EmployeeManagementSection } from "@/components/sections/employee-management-section"
import { EmployeeListSection } from "@/components/sections/employee-list-section"
import { useSucursalManagement } from "@/hooks/use-sucursal-management"
import { useEmployeeManagement } from "@/hooks/use-employee-management"
import { Building2, Users } from "lucide-react"
import type { Employee, Sucursal } from "@/types"

interface UnifiedManagementProps {
  sucursales: Sucursal[]
  setSucursales: (sucursales: Sucursal[]) => void
  employees: Employee[]
  setEmployees: (employees: Employee[]) => void
}

export function UnifiedManagement({ 
  sucursales, 
  setSucursales, 
  employees, 
  setEmployees 
}: UnifiedManagementProps) {
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
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
          <Users className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Gestión de Sucursales y Empleados</h2>
        </div>
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Building2 className="h-4 w-4 md:h-5 md:w-5" />
              Gestión de Sucursales
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">Agrega y gestiona las sucursales de la empresa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4">
            <SucursalForm
              newSucursal={newSucursal}
              onUpdate={updateSucursalField}
              onSubmit={handleAddSucursal}
            />

            <div className="space-y-2">
              <h4 className="font-medium text-sm md:text-base">Sucursales Registradas</h4>
              <SucursalList sucursales={sucursales} onRemove={handleRemoveSucursal} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Users className="h-4 w-4 md:h-5 md:w-5" />
              Gestión de Empleados
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">Agrega y gestiona los empleados de la empresa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4">
            <EmployeeForm
              sucursales={sucursales}
              newEmployee={newEmployee}
              onUpdate={updateEmployeeField}
              onSubmit={handleAddEmployee}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Users className="h-4 w-4 md:h-5 md:w-5" />
            Lista de Empleados por Sucursal
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">Visualiza todos los empleados organizados por sucursal</CardDescription>
        </CardHeader>
        <CardContent>
          <EmployeeListSection
            employees={employees}
            sucursales={sucursales}
            onRemoveEmployee={handleRemoveEmployee}
          />
        </CardContent>
      </Card>
    </div>
  )
}

// Importar los componentes necesarios
import { SucursalForm } from "@/components/forms/sucursal-form"
import { EmployeeForm } from "@/components/forms/employee-form"
import { SucursalList } from "@/components/lists/sucursal-list"
