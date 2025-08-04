"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Building2, User } from "lucide-react"
import type { Employee, Sucursal } from "@/app/page"

interface EmployeeManagementProps {
  sucursales: Sucursal[]
  setSucursales: (sucursales: Sucursal[]) => void
  employees: Employee[]
  setEmployees: (employees: Employee[]) => void
}

export function EmployeeManagement({ sucursales, setSucursales, employees, setEmployees }: EmployeeManagementProps) {
  // Actualizar el estado inicial de nueva sucursal para incluir horarios
  const [newSucursal, setNewSucursal] = useState({
    name: "",
    address: "",
    morningStart: "08:00",
    morningEnd: "13:30",
    afternoonStart: "17:00",
    afternoonEnd: "21:30",
  })
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    sucursal: "",
    weeklyHours: 32,
  })

  // En la función addSucursal, incluir los horarios
  const addSucursal = () => {
    if (newSucursal.name && newSucursal.address) {
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
        morningEnd: "13:30",
        afternoonStart: "17:00",
        afternoonEnd: "21:30",
      })
    }
  }

  const removeSucursal = (id: string) => {
    setSucursales(sucursales.filter((s) => s.id !== id))
    setEmployees(employees.filter((e) => e.sucursal !== id))
  }

  const addEmployee = () => {
    if (newEmployee.name && newEmployee.sucursal) {
      const employee: Employee = {
        id: Date.now().toString(),
        name: newEmployee.name,
        sucursal: newEmployee.sucursal,
        weeklyHours: newEmployee.weeklyHours,
      }
      setEmployees([...employees, employee])
      setNewEmployee({ name: "", sucursal: "", weeklyHours: 32 })
    }
  }

  const removeEmployee = (id: string) => {
    setEmployees(employees.filter((e) => e.id !== id))
  }

  const getSucursalName = (id: string) => {
    return sucursales.find((s) => s.id === id)?.name || "Sucursal no encontrada"
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gestión de Sucursales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Gestión de Sucursales
            </CardTitle>
            <CardDescription>Agrega y administra las sucursales</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sucursal-name">Nombre de la Sucursal</Label>
              <Input
                id="sucursal-name"
                placeholder="Ej: Sucursal Centro"
                value={newSucursal.name}
                onChange={(e) => setNewSucursal({ ...newSucursal, name: e.target.value })}
              />
            </div>
            {/* Agregar campos de horarios en el formulario después del campo de dirección */}
            <div className="space-y-2">
              <Label htmlFor="sucursal-address">Dirección</Label>
              <Input
                id="sucursal-address"
                placeholder="Ej: Av. Principal 123"
                value={newSucursal.address}
                onChange={(e) => setNewSucursal({ ...newSucursal, address: e.target.value })}
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
                    onChange={(e) => setNewSucursal({ ...newSucursal, morningStart: e.target.value })}
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
                    onChange={(e) => setNewSucursal({ ...newSucursal, morningEnd: e.target.value })}
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
                    onChange={(e) => setNewSucursal({ ...newSucursal, afternoonStart: e.target.value })}
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
                    onChange={(e) => setNewSucursal({ ...newSucursal, afternoonEnd: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <Button onClick={addSucursal} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Sucursal
            </Button>

            <div className="space-y-2">
              <h4 className="font-medium">Sucursales Registradas</h4>
              {sucursales.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay sucursales registradas</p>
              ) : (
                <div className="space-y-2">
                  {/* Actualizar la visualización de sucursales registradas para mostrar horarios */}
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
                      <Button variant="outline" size="sm" onClick={() => removeSucursal(sucursal.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Gestión de Empleados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Gestión de Empleados
            </CardTitle>
            <CardDescription>Agrega empleados y asigna sus horas semanales</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employee-name">Nombre del Empleado</Label>
              <Input
                id="employee-name"
                placeholder="Ej: Juan Pérez"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-sucursal">Sucursal</Label>
              <Select
                value={newEmployee.sucursal}
                onValueChange={(value) => setNewEmployee({ ...newEmployee, sucursal: value })}
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
            <div className="space-y-2">
              <Label htmlFor="weekly-hours">Horas Semanales</Label>
              <Input
                id="weekly-hours"
                type="number"
                min="1"
                max="60"
                value={newEmployee.weeklyHours}
                onChange={(e) => setNewEmployee({ ...newEmployee, weeklyHours: Number.parseInt(e.target.value) || 0 })}
              />
            </div>
            <Button onClick={addEmployee} className="w-full" disabled={sucursales.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Empleado
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Empleados */}
      <Card>
        <CardHeader>
          <CardTitle>Empleados Registrados</CardTitle>
          <CardDescription>Lista de todos los empleados por sucursal</CardDescription>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay empleados registrados. Agrega empleados para comenzar.
            </p>
          ) : (
            <div className="space-y-4">
              {sucursales.map((sucursal) => {
                const sucursalEmployees = employees.filter((e) => e.sucursal === sucursal.id)
                if (sucursalEmployees.length === 0) return null

                return (
                  <div key={sucursal.id} className="space-y-2">
                    <h4 className="font-medium text-lg">{sucursal.name}</h4>
                    <div className="grid gap-2">
                      {sucursalEmployees.map((employee) => (
                        <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-medium">{employee.name}</p>
                              <p className="text-sm text-muted-foreground">{employee.weeklyHours} horas semanales</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{employee.weeklyHours}hs</Badge>
                            <Button variant="outline" size="sm" onClick={() => removeEmployee(employee.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
