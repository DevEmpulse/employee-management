"use client"

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import type { Sucursal } from "@/types"

interface SucursalListProps {
  sucursales: Sucursal[]
  onRemove: (id: string) => void
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
              <span className="inline-block">
                Tarde: {sucursal.afternoonStart} - {sucursal.afternoonEnd}
              </span>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => onRemove(sucursal.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}
