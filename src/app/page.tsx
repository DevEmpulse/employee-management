"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UnifiedManagement } from "@/components/unified-management"
import { ScheduleGenerator } from "@/components/schedule-generator"
import { ScheduleViewer } from "@/components/schedule-viewer"
import { ScheduleEditor } from "@/components/schedule-editor"
import { Sidebar } from "@/components/ui/sidebar"
import { Building2, Users, Calendar, BarChart3 } from "lucide-react"
import type { Employee, Sucursal, Schedule } from "@/types"

export default function HomePage() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [activeTab, setActiveTab] = useState("management")
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])



  const renderContent = () => {
    switch (activeTab) {
      case "management":
        return (
          <UnifiedManagement
            sucursales={sucursales}
            setSucursales={setSucursales}
            employees={employees}
            setEmployees={setEmployees}
          />
        )
      case "generator":
        return (
          <ScheduleGenerator
            employees={employees}
            sucursales={sucursales}
            setSchedules={setSchedules}
            selectedDate={selectedDate}
          />
        )
             case "schedules":
         return (
           <ScheduleViewer 
             schedules={schedules} 
             sucursales={sucursales}
             selectedDate={selectedDate}
             onDateChange={setSelectedDate}
           />
         )
      case "editor":
        return (
          <ScheduleEditor
            schedules={schedules}
            setSchedules={setSchedules}
            sucursales={sucursales}
            employees={employees}
            selectedDate={selectedDate}
          />
        )
      case "stats":
        return (
          <div className="space-y-4 md:space-y-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">Estadísticas y Reportes</h2>
              <p className="text-sm md:text-base text-muted-foreground">
                Métricas y análisis del sistema de gestión
              </p>
            </div>

            <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium">Total Sucursales</CardTitle>
                  <Building2 className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg md:text-2xl font-bold text-blue-600">{sucursales.length}</div>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium">Total Empleados</CardTitle>
                  <Users className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg md:text-2xl font-bold text-green-600">{employees.length}</div>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium">Horarios Generados</CardTitle>
                  <Calendar className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg md:text-2xl font-bold text-purple-600">{schedules.length}</div>
                </CardContent>
              </Card>
            </div>
          </div>
        )
      default:
        return (
          <div className="space-y-4 md:space-y-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">Dashboard</h2>
              <p className="text-sm md:text-base text-muted-foreground">
                Bienvenido al sistema de gestión de empleados
              </p>
            </div>

            <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium">Total Sucursales</CardTitle>
                  <Building2 className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg md:text-2xl font-bold text-blue-600">{sucursales.length}</div>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium">Total Empleados</CardTitle>
                  <Users className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg md:text-2xl font-bold text-green-600">{employees.length}</div>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium">Horarios Generados</CardTitle>
                  <Calendar className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg md:text-2xl font-bold text-purple-600">{schedules.length}</div>
                </CardContent>
              </Card>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 overflow-auto lg:ml-64">
        <div className="container mx-auto py-4 md:py-8 px-4 md:px-6">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}
