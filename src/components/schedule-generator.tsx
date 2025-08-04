"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, Shuffle, AlertCircle } from "lucide-react"
import type { Employee, Sucursal, Schedule } from "@/app/page"

interface ScheduleGeneratorProps {
  employees: Employee[]
  sucursales: Sucursal[]
  schedules: Schedule[]
  setSchedules: (schedules: Schedule[]) => void
}

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
const MORNING_HOURS = 5.5 // 8:00 a 13:30
const AFTERNOON_HOURS = 4.5 // 17:00 a 21:30

export function ScheduleGenerator({ employees, sucursales, schedules, setSchedules }: ScheduleGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  // Agregar función para calcular horas entre dos tiempos
  const calculateHours = (startTime: string, endTime: string): number => {
    const [startHour, startMinute] = startTime.split(":").map(Number)
    const [endHour, endMinute] = endTime.split(":").map(Number)

    const startTotalMinutes = startHour * 60 + startMinute
    const endTotalMinutes = endHour * 60 + endMinute

    return (endTotalMinutes - startTotalMinutes) / 60
  }

  // Actualizar la función generateSchedules para usar horarios específicos de cada sucursal
  const generateSchedules = () => {
    setIsGenerating(true)

    setTimeout(() => {
      const newSchedules: Schedule[] = []

      employees.forEach((employee) => {
        const sucursal = sucursales.find((s) => s.id === employee.sucursal)
        if (!sucursal) return

        const morningHours = calculateHours(sucursal.morningStart, sucursal.morningEnd)
        const afternoonHours = calculateHours(sucursal.afternoonStart, sucursal.afternoonEnd)

        const schedule: Schedule = {
          employeeId: employee.id,
          employeeName: employee.name,
          sucursal: employee.sucursal,
          weeklyHours: employee.weeklyHours,
          schedule: {},
        }

        let remainingHours = employee.weeklyHours
        const availableDays = [...DAYS]

        while (remainingHours > 0 && availableDays.length > 0) {
          const randomDayIndex = Math.floor(Math.random() * availableDays.length)
          const day = availableDays[randomDayIndex]

          const workMorning = Math.random() > 0.5
          const workAfternoon = Math.random() > 0.5

          const finalMorning = workMorning || !workAfternoon
          const finalAfternoon = workAfternoon

          let dayHours = 0
          if (finalMorning) dayHours += morningHours
          if (finalAfternoon) dayHours += afternoonHours

          if (dayHours > remainingHours) {
            if (remainingHours >= morningHours) {
              schedule.schedule[day] = {
                morning: true,
                afternoon: false,
                hours: morningHours,
              }
              remainingHours -= morningHours
            } else if (remainingHours >= afternoonHours) {
              schedule.schedule[day] = {
                morning: false,
                afternoon: true,
                hours: afternoonHours,
              }
              remainingHours -= afternoonHours
            } else {
              schedule.schedule[day] = {
                morning: true,
                afternoon: false,
                hours: remainingHours,
              }
              remainingHours = 0
            }
          } else {
            schedule.schedule[day] = {
              morning: finalMorning,
              afternoon: finalAfternoon,
              hours: dayHours,
            }
            remainingHours -= dayHours
          }

          availableDays.splice(randomDayIndex, 1)
        }

        newSchedules.push(schedule)
      })

      setSchedules(newSchedules)
      setIsGenerating(false)
    }, 1500)
  }

  const getSucursalName = (id: string) => {
    return sucursales.find((s) => s.id === id)?.name || "Sucursal no encontrada"
  }

  if (employees.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No hay empleados registrados. Ve a la pestaña Empleados para agregar empleados antes de generar
              horarios.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Generador de Horarios
          </CardTitle>
          <CardDescription>Genera automáticamente los horarios semanales para todos los empleados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold">{employees.length}</p>
              <p className="text-sm text-muted-foreground">Empleados</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold">{sucursales.length}</p>
              <p className="text-sm text-muted-foreground">Sucursales</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold">10hs</p>
              <p className="text-sm text-muted-foreground">Horas por día</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Horarios por Sucursal:</h4>
            <div className="space-y-2">
              {sucursales.map((sucursal) => (
                <div key={sucursal.id} className="p-3 border rounded-lg">
                  <p className="font-medium">{sucursal.name}</p>
                  <div className="grid gap-1 md:grid-cols-2 text-sm text-muted-foreground">
                    <div>
                      Mañana: {sucursal.morningStart} - {sucursal.morningEnd}
                    </div>
                    <div>
                      Tarde: {sucursal.afternoonStart} - {sucursal.afternoonEnd}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={generateSchedules} disabled={isGenerating} className="w-full" size="lg">
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Generando Horarios...
              </>
            ) : (
              <>
                <Shuffle className="h-4 w-4 mr-2" />
                Generar Horarios Automáticamente
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {schedules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vista Previa de Horarios Generados</CardTitle>
            <CardDescription>Resumen de los horarios generados para cada empleado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sucursales.map((sucursal) => {
                const sucursalSchedules = schedules.filter((s) => s.sucursal === sucursal.id)
                if (sucursalSchedules.length === 0) return null

                return (
                  <div key={sucursal.id} className="space-y-2">
                    <h4 className="font-medium text-lg">{sucursal.name}</h4>
                    <div className="grid gap-2">
                      {sucursalSchedules.map((schedule) => {
                        const totalAssignedHours = Object.values(schedule.schedule).reduce(
                          (sum, day) => sum + day.hours,
                          0,
                        )
                        const workingDays = Object.keys(schedule.schedule).length

                        return (
                          <div
                            key={schedule.employeeId}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{schedule.employeeName}</p>
                              <p className="text-sm text-muted-foreground">
                                {workingDays} días • {totalAssignedHours.toFixed(1)} horas asignadas de{" "}
                                {schedule.weeklyHours}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant="outline">{workingDays} días</Badge>
                              <Badge variant={totalAssignedHours === schedule.weeklyHours ? "default" : "secondary"}>
                                {totalAssignedHours.toFixed(1)}h
                              </Badge>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}