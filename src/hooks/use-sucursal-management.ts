import { useState } from 'react'
import type { Sucursal, SucursalFormData } from '@/types'

export function useSucursalManagement() {
  const [newSucursal, setNewSucursal] = useState<SucursalFormData>({
    name: "",
    address: "",
    dayOff: "",
    morningStart: "08:00",
    morningEnd: "13:30",
    afternoonStart: "17:00",
    afternoonEnd: "21:30",
  })

  const createSucursal = (): Sucursal | null => {
    if (newSucursal.name && newSucursal.address && newSucursal.dayOff) {
      const sucursal: Sucursal = {
        id: Date.now().toString(),
        name: newSucursal.name,
        address: newSucursal.address,
        dayOff: newSucursal.dayOff,
        morningStart: newSucursal.morningStart,
        morningEnd: newSucursal.morningEnd,
        afternoonStart: newSucursal.afternoonStart,
        afternoonEnd: newSucursal.afternoonEnd,
      }
      
      // Reset form
      setNewSucursal({
        name: "",
        address: "",
        dayOff: "",
        morningStart: "08:00",
        morningEnd: "13:30",
        afternoonStart: "17:00",
        afternoonEnd: "21:30",
      })
      
      return sucursal
    }
    return null
  }

  const updateSucursalField = (field: keyof SucursalFormData, value: string) => {
    setNewSucursal({ ...newSucursal, [field]: value })
  }

  return {
    newSucursal,
    createSucursal,
    updateSucursalField,
  }
}
