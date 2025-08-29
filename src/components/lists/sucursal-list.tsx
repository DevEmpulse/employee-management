"use client"

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import type { Sucursal } from "@/types"

interface SucursalListProps {
  sucursales: Sucursal[]
  onRemove: (id: string) => void
}

const DAY_LABELS: Record<string, string> = {
  lunes: "Lunes",
  martes: "Martes", 
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  domingo: "Domingo"
}

export function SucursalList({ sucursales, onRemove }: SucursalListProps) {
  if (sucursales.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay sucursales registradas</p>
  }

  return (
    <div className="space-y-2">
      {sucursales.map((sucursal) => (
        <div key={sucursal.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex-1">
            <p className="font-medium">{sucursal.name}</p>
            <p className="text-sm text-muted-foreground">{sucursal.address}</p>
            <div className="text-xs text-muted-foreground mt-1">
              <span className="inline-block mr-3">
                Mañana: {sucursal.morningStart} - {sucursal.morningEnd}
              </span>
              <span className="inline-block mr-3">
                Tarde: {sucursal.afternoonStart} - {sucursal.afternoonEnd}
              </span>
              <span className="inline-block">
                Día libre: {DAY_LABELS[sucursal.dayOff] || sucursal.dayOff}
              </span>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onRemove(sucursal.id)} 
            className="cursor-pointer bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300 hover:text-red-800 transition-all duration-200"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}
