"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import type { SucursalFormData } from "@/types"

interface SucursalFormProps {
  newSucursal: SucursalFormData
  onUpdate: (field: keyof SucursalFormData, value: string) => void
  onSubmit: () => void
}

const DAYS_OF_WEEK = [
  { value: "lunes", label: "Lunes" },
  { value: "martes", label: "Martes" },
  { value: "miercoles", label: "Miércoles" },
  { value: "jueves", label: "Jueves" },
  { value: "viernes", label: "Viernes" },
  { value: "sabado", label: "Sábado" },
  { value: "domingo", label: "Domingo" },
]

export function SucursalForm({ newSucursal, onUpdate, onSubmit }: SucursalFormProps) {
  const handleSubmit = () => {
    // Validar campos requeridos
    if (!newSucursal.name.trim()) {
      toast.error("El nombre de la sucursal es obligatorio")
      return
    }
    if (!newSucursal.address.trim()) {
      toast.error("La dirección es obligatoria")
      return
    }
    if (!newSucursal.dayOff) {
      toast.error("Debe seleccionar un día libre")
      return
    }
    if (!newSucursal.morningStart || !newSucursal.morningEnd) {
      toast.error("Debe configurar los horarios de mañana")
      return
    }
    if (!newSucursal.afternoonStart || !newSucursal.afternoonEnd) {
      toast.error("Debe configurar los horarios de tarde")
      return
    }
    
    // Validar que las horas de inicio sean menores que las de fin
    if (newSucursal.morningStart >= newSucursal.morningEnd) {
      toast.error("La hora de fin de mañana debe ser mayor que la de inicio")
      return
    }
    if (newSucursal.afternoonStart >= newSucursal.afternoonEnd) {
      toast.error("La hora de fin de tarde debe ser mayor que la de inicio")
      return
    }
    
    onSubmit()
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="sucursal-name">Nombre de la Sucursal</Label>
        <Input
          id="sucursal-name"
          placeholder="Ej: Sucursal Centro"
          value={newSucursal.name}
          onChange={(e) => onUpdate("name", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sucursal-address">Dirección</Label>
        <Input
          id="sucursal-address"
          placeholder="Ej: Av. Principal 123"
          value={newSucursal.address}
          onChange={(e) => onUpdate("address", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sucursal-dayoff">Día Libre</Label>
        <Select
          value={newSucursal.dayOff}
          onValueChange={(value) => onUpdate("dayOff", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar día" />
          </SelectTrigger>
          <SelectContent>
            {DAYS_OF_WEEK.map((day) => (
              <SelectItem key={day.value} value={day.value}>
                {day.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium">Horarios de Apertura</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="morning-start" className="text-xs">
              Inicio Mañana
            </Label>
            <Input
              id="morning-start"
              type="time"
              value={newSucursal.morningStart}
              onChange={(e) => onUpdate("morningStart", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="morning-end" className="text-xs">
              Fin Mañana
            </Label>
            <Input
              id="morning-end"
              type="time"
              value={newSucursal.morningEnd}
              onChange={(e) => onUpdate("morningEnd", e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="afternoon-start" className="text-xs">
              Inicio Tarde
            </Label>
            <Input
              id="afternoon-start"
              type="time"
              value={newSucursal.afternoonStart}
              onChange={(e) => onUpdate("afternoonStart", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="afternoon-end" className="text-xs">
              Fin Tarde
            </Label>
            <Input
              id="afternoon-end"
              type="time"
              value={newSucursal.afternoonEnd}
              onChange={(e) => onUpdate("afternoonEnd", e.target.value)}
            />
          </div>
        </div>
      </div>
      <Button 
        onClick={handleSubmit} 
        className="w-full cursor-pointer bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
      >
        <Plus className="h-4 w-4 mr-2" />
        Agregar Sucursal
      </Button>
    </div>
  )
}
