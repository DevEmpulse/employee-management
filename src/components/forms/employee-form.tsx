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

      <div className="space-y-3">

        {newEmployee.hasFlexibleSchedule && (
          <div className="space-y-2 p-3 border rounded-lg bg-muted/50">
            <Label className="text-sm font-medium">Ajustes de Horario (en minutos)</Label>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label htmlFor="morning-delay" className="text-xs">
                  Retraso Mañana
                </Label>
                <Input
                  id="morning-delay"
                  type="number"
                  min="0"
                  max="120"
                  value={newEmployee.morningDelay}
                  onChange={(e) =>
                    onUpdate("morningDelay", Number.parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="afternoon-delay" className="text-xs">
                  Retraso Tarde
                </Label>
                <Input
                  id="afternoon-delay"
                  type="number"
                  min="0"
                  max="120"
                  value={newEmployee.afternoonDelay}
                  onChange={(e) =>
                    onUpdate("afternoonDelay", Number.parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="early-leave" className="text-xs">
                  Salida Temprana
                </Label>
                <Input
                  id="early-leave"
                  type="number"
                  min="0"
                  max="120"
                  value={newEmployee.earlyLeave}
                  onChange={(e) =>
                    onUpdate("earlyLeave", Number.parseInt(e.target.value) || 0)
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <Button onClick={onSubmit} className="w-full" disabled={sucursales.length === 0}>
        <Plus className="h-4 w-4 mr-2" />
        Agregar Empleado (32hs)
      </Button>
    </div>
  )
}
