"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2 } from "lucide-react"
import type { Employee, Sucursal } from "@/types"

interface EmployeeListProps {
  employees: Employee[]
  sucursales: Sucursal[]
  onRemove: (id: string) => void
}

export function EmployeeList({ employees, sucursales, onRemove }: EmployeeListProps) {
  if (employees.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No hay empleados registrados. Agrega empleados para comenzar.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {sucursales.map((sucursal) => {
        const sucursalEmployees = employees.filter((e) => e.sucursal === sucursal.id)
        if (sucursalEmployees.length === 0) return null

        const requiredCoverage = Math.max(1, sucursalEmployees.length - 1)

        return (
          <div key={sucursal.id} className="space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-lg">{sucursal.name}</h4>
              <Badge variant="outline" className="text-xs">
                Cobertura mínima: {requiredCoverage} empleados por turno
              </Badge>
            </div>
            <div className="grid gap-2">
              {sucursalEmployees.map((employee) => (
                <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">32hs</Badge>
                    <Button variant="outline" size="sm" onClick={() => onRemove(employee.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
