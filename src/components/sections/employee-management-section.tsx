"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User } from "lucide-react"
import { EmployeeForm } from "@/components/forms/employee-form"
import type { Employee, EmployeeFormData, Sucursal } from "@/types"

interface EmployeeManagementSectionProps {
  sucursales: Sucursal[]
  newEmployee: EmployeeFormData
  onUpdateEmployee: (field: keyof EmployeeFormData, value: string | number | boolean) => void
  onAddEmployee: () => void
}

export function EmployeeManagementSection({
  sucursales,
  newEmployee,
  onUpdateEmployee,
  onAddEmployee,
}: EmployeeManagementSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Gestión de Empleados
        </CardTitle>
        <CardDescription>Agrega empleados (todos deben cumplir 32hs semanales)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <EmployeeForm
          newEmployee={newEmployee}
          sucursales={sucursales}
          onUpdate={onUpdateEmployee}
          onSubmit={onAddEmployee}
        />
      </CardContent>
    </Card>
  )
}
