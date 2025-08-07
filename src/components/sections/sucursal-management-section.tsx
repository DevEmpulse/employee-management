"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2 } from "lucide-react"
import { SucursalForm } from "@/components/forms/sucursal-form"
import { SucursalList } from "@/components/lists/sucursal-list"
import type { Sucursal, SucursalFormData } from "@/types"

interface SucursalManagementSectionProps {
  sucursales: Sucursal[]
  newSucursal: SucursalFormData
  onUpdateSucursal: (field: keyof SucursalFormData, value: string) => void
  onAddSucursal: () => void
  onRemoveSucursal: (id: string) => void
}

export function SucursalManagementSection({
  sucursales,
  newSucursal,
  onUpdateSucursal,
  onAddSucursal,
  onRemoveSucursal,
}: SucursalManagementSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Gestión de Sucursales
        </CardTitle>
        <CardDescription>Agrega y administra las sucursales</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SucursalForm
          newSucursal={newSucursal}
          onUpdate={onUpdateSucursal}
          onSubmit={onAddSucursal}
        />

        <div className="space-y-2">
          <h4 className="font-medium">Sucursales Registradas</h4>
          <SucursalList sucursales={sucursales} onRemove={onRemoveSucursal} />
        </div>
      </CardContent>
    </Card>
  )
}
