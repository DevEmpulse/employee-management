"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, Building2, Plus, Trash2, AlertCircle } from "lucide-react"
import type { Employee, Sucursal } from "@/app/page"

interface EmployeeManagementProps {
  sucursales: Sucursal[]
  setSucursales: (sucursales: Sucursal[]) => void
  employees: Employee[]
  setEmployees: (employees: Employee[]) => void
}

export function EmployeeManagement({ sucursales, setSucursales, employees, setEmployees }: EmployeeManagementProps) {
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    sucursal: "",
    weeklyHours: 32,
  })

  const [newSucursal, setNewSucursal] = useState({
    name: "",
    address: "",
    morningStart: "08:00",
    morningEnd: "12:00",
    afternoonStart: "13:00",
    afternoonEnd: "17:00",
  })

  const addEmployee = () => {
    if (!newEmployee.name || !newEmployee.sucursal) return

    const employee: Employee = {
      id: Date.now().toString(),
      name: newEmployee.name,
      sucursal: newEmployee.sucursal,
      weeklyHours: newEmployee.weeklyHours,
    }

    setEmployees([...employees, employee])
    setNewEmployee({ name: "", sucursal: "", weeklyHours: 32 })
  }

  const removeEmployee = (id: string) => {
    setEmployees(employees.filter((emp) => emp.id !== id))
  }

  const addSucursal = () => {
    if (!newSucursal.name || !newSucursal.address) return

    const sucursal: Sucursal = {
      id: Date.now().toString(),
      name: newSucursal.name,
      address: newSucursal.address,
      morningStart: newSucursal.morningStart,
      morningEnd: newSucursal.morningEnd,
      afternoonStart: newSucursal.afternoonStart,
      afternoonEnd: newSucursal.afternoonEnd,
    }

    setSucursales([...sucursales, sucursal])
    setNewSucursal({
      name: "",
      address: "",
      morningStart: "08:00",
      morningEnd: "12:00",
      afternoonStart: "13:00",
      afternoonEnd: "17:00",
    })
  }

  const removeSucursal = (id: string) => {
    setSucursales(sucursales.filter((suc) => suc.id !== id))
    // También eliminar empleados de esa sucursal
    setEmployees(employees.filter((emp) => emp.sucursal !== id))
  }

  return (
    <div className="space-y-6">
      {/* Gestión de Sucursales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Gestión de Sucursales
          </CardTitle>
          <CardDescription>Agrega y gestiona las sucursales de la empresa</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <Label htmlFor="sucursal-name">Nombre de la Sucursal</Label>
                <Input
                  id="sucursal-name"
                  value={newSucursal.name}
                  onChange={(e) => setNewSucursal({ ...newSucursal, name: e.target.value })}
                  placeholder="Ej: Sucursal Centro"
                />
              </div>
              <div>
                <Label htmlFor="sucursal-address">Dirección</Label>
                <Input
                  id="sucursal-address"
                  value={newSucursal.address}
                  onChange={(e) => setNewSucursal({ ...newSucursal, address: e.target.value })}
                  placeholder="Ej: Av. Principal 123"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="morning-start">Inicio Mañana</Label>
                  <Input
                    id="morning-start"
                    type="time"
                    value={newSucursal.morningStart}
                    onChange={(e) => setNewSucursal({ ...newSucursal, morningStart: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="morning-end">Fin Mañana</Label>
                  <Input
                    id="morning-end"
                    type="time"
                    value={newSucursal.morningEnd}
                    onChange={(e) => setNewSucursal({ ...newSucursal, morningEnd: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="afternoon-start">Inicio Tarde</Label>
                  <Input
                    id="afternoon-start"
                    type="time"
                    value={newSucursal.afternoonStart}
                    onChange={(e) => setNewSucursal({ ...newSucursal, afternoonStart: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="afternoon-end">Fin Tarde</Label>
                  <Input
                    id="afternoon-end"
                    type="time"
                    value={newSucursal.afternoonEnd}
                    onChange={(e) => setNewSucursal({ ...newSucursal, afternoonEnd: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
          <Button onClick={addSucursal} className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Sucursal
          </Button>

          <div className="mt-6 space-y-2">
            {sucursales.map((sucursal) => (
              <div key={sucursal.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{sucursal.name}</h4>
                  <p className="text-sm text-muted-foreground">{sucursal.address}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline">{sucursal.morningStart} - {sucursal.morningEnd}</Badge>
                    <Badge variant="outline">{sucursal.afternoonStart} - {sucursal.afternoonEnd}</Badge>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeSucursal(sucursal.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gestión de Empleados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestión de Empleados
          </CardTitle>
          <CardDescription>Agrega y gestiona los empleados de la empresa</CardDescription>
        </CardHeader>
        <CardContent>
          {sucursales.length === 0 && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Debes agregar al menos una sucursal antes de agregar empleados.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="employee-name">Nombre del Empleado</Label>
              <Input
                id="employee-name"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                placeholder="Ej: Juan Pérez"
                disabled={sucursales.length === 0}
              />
            </div>
            <div>
              <Label htmlFor="employee-sucursal">Sucursal</Label>
              <Select
                value={newEmployee.sucursal}
                onValueChange={(value) => setNewEmployee({ ...newEmployee, sucursal: value })}
                disabled={sucursales.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar sucursal" />
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
            <div>
              <Label htmlFor="weekly-hours">Horas Semanales</Label>
              <Input
                id="weekly-hours"
                type="number"
                value={newEmployee.weeklyHours}
                onChange={(e) => setNewEmployee({ ...newEmployee, weeklyHours: Number(e.target.value) })}
                min="1"
                max="40"
                disabled={sucursales.length === 0}
              />
            </div>
          </div>
          <Button onClick={addEmployee} className="mt-4" disabled={sucursales.length === 0}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Empleado
          </Button>

          <div className="mt-6 space-y-2">
            {employees.map((employee) => {
              const sucursal = sucursales.find((s) => s.id === employee.sucursal)
              return (
                <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{employee.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {sucursal?.name || "Sucursal no encontrada"}
                    </p>
                    <Badge variant="outline" className="mt-1">
                      {employee.weeklyHours} horas semanales
                    </Badge>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeEmployee(employee.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
