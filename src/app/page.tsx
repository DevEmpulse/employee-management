"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmployeeManagement } from "../components/employee-management"
import { ScheduleGenerator } from "../components/schedule-generator"
import { ScheduleViewer } from "../components/schedule-viewer"
import { Building2, Users, Calendar, FileText } from "lucide-react"

export interface Employee {
  id: string
  name: string
  sucursal: string
  weeklyHours: number
}

export interface Sucursal {
  id: string
  name: string
  address: string
  morningStart: string
  morningEnd: string
  afternoonStart: string
  afternoonEnd: string
}

export interface Schedule {
  employeeId: string
  employeeName: string
  sucursal: string
  weeklyHours: number
  schedule: {
    [key: string]: {
      morning: boolean
      afternoon: boolean
      hours: number
    }
  }
}

export default function HomePage() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Sistema de Distribución de Horarios</h1>
          <p className="text-muted-foreground">Gestiona empleados, sucursales y genera horarios automáticamente</p>
        </div>

        <Tabs defaultValue="employees" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="employees" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Empleados
            </TabsTrigger>
            <TabsTrigger value="generator" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Generar Horarios
            </TabsTrigger>
            <TabsTrigger value="schedules" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Ver Horarios
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Estadísticas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="employees">
            <EmployeeManagement
              sucursales={sucursales}
              setSucursales={setSucursales}
              employees={employees}
              setEmployees={setEmployees}
            />
          </TabsContent>

          <TabsContent value="generator">
            <ScheduleGenerator
              employees={employees}
              sucursales={sucursales}
              schedules={schedules}
              setSchedules={setSchedules}
            />
          </TabsContent>

          <TabsContent value="schedules">
            <ScheduleViewer schedules={schedules} sucursales={sucursales} />
          </TabsContent>

          <TabsContent value="stats">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sucursales</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{sucursales.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Empleados</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{employees.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Horarios Generados</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{schedules.length}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}