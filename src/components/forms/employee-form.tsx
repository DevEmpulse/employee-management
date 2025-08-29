"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import type { EmployeeFormData, Sucursal } from "@/types"

interface EmployeeFormProps {
  newEmployee: EmployeeFormData
  sucursales: Sucursal[]
  onUpdate: (field: keyof EmployeeFormData, value: string | number | boolean) => void
  onSubmit: () => void
}

export function EmployeeForm({ newEmployee, sucursales, onUpdate, onSubmit }: EmployeeFormProps) {
  const handleSubmit = () => {
    // Validar campos requeridos
    if (!newEmployee.name.trim()) {
      toast.error("El nombre del empleado es obligatorio")
      return
    }
    if (!newEmployee.sucursal) {
      toast.error("Debe seleccionar una sucursal")
      return
    }
    
    onSubmit()
  }

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

      <Button 
        onClick={handleSubmit} 
        className="w-full cursor-pointer bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" 
        disabled={sucursales.length === 0}
      >
        <Plus className="h-4 w-4 mr-2" />
        Agregar Empleado (32hs)
      </Button>
    </div>
  )
}
