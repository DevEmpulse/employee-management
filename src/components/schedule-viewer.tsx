"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, FileText, AlertCircle } from "lucide-react"
import type { Schedule } from "@/app/page"
import type { Sucursal } from "./sucursal-schedule-display" // Importar el nuevo componente y agregar sucursales como prop
import { SucursalScheduleDisplay } from "./sucursal-schedule-display"

// Actualizar la interfaz para recibir sucursales
interface ScheduleViewerProps {
  schedules: Schedule[]
  sucursales: Sucursal[]
}

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]

export function ScheduleViewer({ schedules, sucursales }: ScheduleViewerProps) {
  // Función para obtener datos de sucursal
  const getSucursalData = (id: string) => {
    return sucursales.find((s) => s.id === id)
  }
  // Actualizar la función generatePDF para usar horarios específicos de cada sucursal
  const generatePDF = () => {
    // Crear un mapa de sucursales para acceso rápido
    const sucursalMap = schedules.reduce(
      (acc, schedule) => {
        if (!acc[schedule.sucursal]) {
          // Buscar la sucursal en el array de sucursales (necesitamos pasarlo como prop)
          acc[schedule.sucursal] = schedule.sucursal
        }
        return acc
      },
      {} as Record<string, string>,
    )

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Horarios Semanales</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .sucursal { margin-bottom: 30px; page-break-inside: avoid; }
        .sucursal-title { background-color: #f5f5f5; padding: 10px; font-weight: bold; font-size: 18px; }
        .employee { margin-bottom: 20px; border: 1px solid #ddd; }
        .employee-header { background-color: #f9f9f9; padding: 10px; font-weight: bold; }
        .schedule-table { width: 100%; border-collapse: collapse; }
        .schedule-table th, .schedule-table td { border: 1px solid #ddd; padding: 8px; text-align: center; }
        .schedule-table th { background-color: #f5f5f5; }
        .working { background-color: #e8f5e8; }
        .not-working { background-color: #f5f5f5; color: #999; }
        .summary { margin-top: 10px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Horarios Semanales</h1>
        <p>Generado el ${new Date().toLocaleDateString("es-ES")}</p>
      </div>
      
      ${schedules.reduce((acc, schedule, index, arr) => {
        const isNewSucursal = index === 0 || schedule.sucursal !== arr[index - 1].sucursal
        const totalHours = Object.values(schedule.schedule).reduce((sum, day) => sum + day.hours, 0)

        let html = ""

        if (isNewSucursal) {
          html += `<div class="sucursal-title">Sucursal: ${schedule.sucursal}</div>`
        }

        html += `
          <div class="employee">
            <div class="employee-header">
              ${schedule.employeeName} - ${schedule.weeklyHours} horas semanales
            </div>
            <table class="schedule-table">
              <tr>
                <th>Día</th>
                <th>Turno Mañana</th>
                <th>Turno Tarde</th>
                <th>Horas del Día</th>
              </tr>
              ${DAYS.map((day) => {
                const daySchedule = schedule.schedule[day]
                if (!daySchedule) {
                  return `
                    <tr>
                      <td><strong>${day}</strong></td>
                      <td class="not-working">No trabaja</td>
                      <td class="not-working">No trabaja</td>
                      <td class="not-working">0h</td>
                    </tr>
                  `
                }
                return `
                  <tr>
                    <td><strong>${day}</strong></td>
                    <td class="${daySchedule.morning ? "working" : "not-working"}">
                      ${daySchedule.morning ? "Trabaja" : "No trabaja"}
                    </td>
                    <td class="${daySchedule.afternoon ? "working" : "not-working"}">
                      ${daySchedule.afternoon ? "Trabaja" : "No trabaja"}
                    </td>
                    <td class="working">${daySchedule.hours}h</td>
                  </tr>
                `
              }).join("")}
            </table>
            <div class="summary">
              Total horas asignadas: ${totalHours.toFixed(1)}h de ${schedule.weeklyHours}h
            </div>
          </div>
        `

        return acc + html
      }, "")}
    </body>
    </html>
  `

    const blob = new Blob([htmlContent], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `horarios-semanales-${new Date().toISOString().split("T")[0]}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (schedules.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No hay horarios generados. Ve a la pestaña Generar Horarios para crear los horarios automáticamente.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Agrupar horarios por sucursal
  const schedulesBySucursal = schedules.reduce(
    (acc, schedule) => {
      if (!acc[schedule.sucursal]) {
        acc[schedule.sucursal] = []
      }
      acc[schedule.sucursal].push(schedule)
      return acc
    },
    {} as Record<string, Schedule[]>,
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Horarios Generados
          </CardTitle>
          <CardDescription>Visualiza y descarga los horarios semanales de todos los empleados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{schedules.length}</p>
                <p className="text-sm text-muted-foreground">Empleados</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{Object.keys(schedulesBySucursal).length}</p>
                <p className="text-sm text-muted-foreground">Sucursales</p>
              </div>
            </div>
            <Button onClick={generatePDF} size="lg">
              <Download className="h-4 w-4 mr-2" />
              Descargar PDF
            </Button>
          </div>

          <div className="space-y-6">
            {Object.entries(schedulesBySucursal).map(([sucursalId, sucursalSchedules]) => (
              <div key={sucursalId} className="space-y-4">
                <h3 className="text-xl font-semibold border-b pb-2">Sucursal: {sucursalId}</h3>

                <div className="space-y-4">
                  {sucursalSchedules.map((schedule) => {
                    const totalAssignedHours = Object.values(schedule.schedule).reduce((sum, day) => sum + day.hours, 0)

                    return (
                      <Card key={schedule.employeeId}>
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">{schedule.employeeName}</CardTitle>
                            <div className="flex gap-2">
                              <Badge variant="outline">{schedule.weeklyHours}h semanales</Badge>
                              <Badge variant={totalAssignedHours === schedule.weeklyHours ? "default" : "secondary"}>
                                {totalAssignedHours.toFixed(1)}h asignadas
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-2">
                            <div className="grid grid-cols-7 gap-2 text-sm font-medium text-center">
                              <div>Día</div>
                              <div>Mañana</div>
                              <div>Tarde</div>
                              <div>Horas</div>
                              <div></div>
                              <div></div>
                              <div></div>
                            </div>
                            {DAYS.map((day) => {
                              const daySchedule = schedule.schedule[day]
                              const sucursalData = getSucursalData(schedule.sucursal)

                              return (
                                <div key={day} className="grid grid-cols-7 gap-2 items-center py-2 border-t">
                                  <div className="font-medium">{day}</div>
                                  {sucursalData ? (
                                    <SucursalScheduleDisplay
                                      sucursal={sucursalData}
                                      daySchedule={daySchedule}
                                      day={day}
                                    />
                                  ) : (
                                    <>
                                      <div className="text-center">
                                        <span className="text-muted-foreground text-xs">-</span>
                                      </div>
                                      <div className="text-center">
                                        <span className="text-muted-foreground text-xs">-</span>
                                      </div>
                                      <div className="text-center font-medium">0h</div>
                                    </>
                                  )}
                                  <div></div>
                                  <div></div>
                                  <div></div>
                                </div>
                              )
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
