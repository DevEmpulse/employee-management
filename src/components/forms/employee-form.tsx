"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import type { EmployeeFormData, Sucursal } from "@/types"

interface EmployeeFormProps {
  newEmployee: EmployeeFormData
  sucursales: Sucursal[]
  onUpdate: (field: keyof EmployeeFormData, value: string | number | boolean) => void
  onSubmit: () => void
}

export function EmployeeForm({ newEmployee, sucursales, onUpdate, onSubmit }: EmployeeFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="employee-name">Nombre del Empleado</Label>
        <Input
          id="employee-name"
          placeholder="Ej: Juan Pérez"
          value={newEmployee.name}
          onChange={(e) => onUpdate("name", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="employee-sucursal">Sucursal</Label>
        <Select
          value={newEmployee.sucursal}
          onValueChange={(value) => onUpdate("sucursal", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una sucursal" />
          </SelectTrigger>
          <SelectContent>
            {sucursales.map((sucursal) => (
              <SelectItem key={sucursal.id} value={sucursal.id}>
                {sucursal.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button onClick={onSubmit} className="w-full" disabled={sucursales.length === 0}>
        <Plus className="h-4 w-4 mr-2" />
        Agregar Empleado (32hs)
      </Button>
    </div>
  )
}
