"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import type { SucursalFormData } from "@/types"

interface SucursalFormProps {
  newSucursal: SucursalFormData
  onUpdate: (field: keyof SucursalFormData, value: string) => void
  onSubmit: () => void
}

export function SucursalForm({ newSucursal, onUpdate, onSubmit }: SucursalFormProps) {
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

      <div className="space-y-3">
        <Label className="text-sm font-medium">Horarios de Apertura</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="morning-start" className="text-xs">
              Mañana - Inicio
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
              Mañana - Fin
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
              Tarde - Inicio
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
              Tarde - Fin
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
      <Button onClick={onSubmit} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Agregar Sucursal
      </Button>
    </div>
  )
}
