"use client"

import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SucursalManagementSection } from "@/components/sections/sucursal-management-section"
import { Building2 } from "lucide-react"
import type { Sucursal, SucursalFormData } from "@/types"

interface SucursalManagementProps {
  sucursales: Sucursal[]
  setSucursales: (sucursales: Sucursal[]) => void
}

export function SucursalManagement({ sucursales, setSucursales }: SucursalManagementProps) {
  const handleAddSucursal = () => {
    // Esta función se maneja en el componente EmployeeManagement
    // Aquí solo mostramos el toast
    toast.success("Sucursal creada correctamente")
  }

  const handleRemoveSucursal = (id: string) => {
    const sucursalToRemove = sucursales.find(s => s.id === id)
    setSucursales(sucursales.filter((s) => s.id !== id))
    toast.success(`Sucursal "${sucursalToRemove?.name}" eliminada correctamente`)
  }

  const defaultSucursalForm: SucursalFormData = {
    name: "",
    address: "",
    morningStart: "",
    morningEnd: "",
    afternoonStart: "",
    afternoonEnd: "",
    dayOff: ""
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="h-8 w-8 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestión de Sucursales</h2>
          <p className="text-muted-foreground">
            Administra las sucursales de tu empresa
          </p>
        </div>
      </div>

      <SucursalManagementSection
        sucursales={sucursales}
        newSucursal={defaultSucursalForm}
        onUpdateSucursal={() => {}}
        onAddSucursal={handleAddSucursal}
        onRemoveSucursal={handleRemoveSucursal}
      />
    </div>
  )
}
