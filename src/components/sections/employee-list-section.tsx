"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmployeeList } from "@/components/lists/employee-list"
import type { Employee, Sucursal } from "@/types"

interface EmployeeListSectionProps {
  employees: Employee[]
  sucursales: Sucursal[]
  onRemoveEmployee: (id: string) => void
}

export function EmployeeListSection({
  employees,
  sucursales,
  onRemoveEmployee,
}: EmployeeListSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Empleados Registrados</CardTitle>
        <CardDescription>Lista de todos los empleados por sucursal (todos con 32hs semanales)</CardDescription>
      </CardHeader>
      <CardContent>
        <EmployeeList
          employees={employees}
          sucursales={sucursales}
          onRemove={onRemoveEmployee}
        />
      </CardContent>
    </Card>
  )
}
