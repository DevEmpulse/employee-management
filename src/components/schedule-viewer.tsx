"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, FileText, AlertCircle } from 'lucide-react'
import type { Schedule } from "@/app/page"
import { SucursalScheduleDisplay } from "@/components/sucursal-schedule-display"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import type { Sucursal } from "@/types/sucursal"

interface ScheduleViewerProps {
  schedules: Schedule[]
  sucursales: Sucursal[]
}

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]

export function ScheduleViewer({ schedules, sucursales }: ScheduleViewerProps) {
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split("T")[0])

  if (!sucursales) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Error: No se pudieron cargar los datos de las sucursales.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const getSucursalData = (id: string) => {
    if (!sucursales || !Array.isArray(sucursales)) return undefined
    return sucursales.find((s) => s.id === id)
  }

  // Helpers de formato para PDF estilo "9 A 13.30"
  const prettyHour = (hhmm: string) => {
    const [h, m] = hhmm.split(":")
    const hNum = String(Number(h))
    if (m === "30") return `${hNum}.30`
    if (m === "00") return hNum
    return `${hNum}:${m}`
  }
  const prettyRange = (start: string, end: string) => `${prettyHour(start)} A ${prettyHour(end)}`
  const prettyDay = (daySchedule: { morning?: boolean; afternoon?: boolean; morningStart?: string; morningEnd?: string; afternoonStart?: string; afternoonEnd?: string } | undefined, sucursal: Sucursal | undefined) => {
    if (!daySchedule || !sucursal) return "Descanso"
    const parts: string[] = []
    if (daySchedule.morning) {
      const ms = daySchedule.morningStart || sucursal.morningStart
      const me = daySchedule.morningEnd || sucursal.morningEnd
      parts.push(prettyRange(ms, me))
    }
    if (daySchedule.afternoon) {
      const as = daySchedule.afternoonStart || sucursal.afternoonStart
      const ae = daySchedule.afternoonEnd || sucursal.afternoonEnd
      parts.push(prettyRange(as, ae))
    }
    return parts.length ? parts.join(" Y ") : "Descanso"
  }

  const generatePDF = () => {
    if (!sucursales || sucursales.length === 0) {
      alert("No hay sucursales disponibles para generar el PDF")
      return
    }
    const getWeekDates = (startDateStr: string) => {
      const startDate = new Date(startDateStr)
      const dates: { date: string; dayName: string }[] = []
      // Lunes
      const dow = startDate.getDay()
      const mondayOffset = dow === 0 ? -6 : 1 - dow
      const monday = new Date(startDate)
      monday.setDate(startDate.getDate() + mondayOffset)
      for (let i = 0; i < 6; i++) {
        const date = new Date(monday)
        date.setDate(monday.getDate() + i)
        dates.push({
          date: date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }),
          dayName: DAYS[i],
        })
      }
      return dates
    }

    const weekDates = getWeekDates(startDate)

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>Horarios Semanales</title>
<style>
  body { font-family: Arial, sans-serif; margin: 10px; font-size: 12px; }
  .header { text-align: center; margin-bottom: 20px; }
  .title { font-size: 18px; font-weight: bold; }
  .sucursal { background:#2196F3;color:#fff;text-align:center;font-weight:bold;padding:8px;margin:16px 0 8px; }
  table { width:100%; border-collapse:collapse; margin-bottom: 20px; }
  th, td { border:2px solid #000; padding:6px; text-align:center; vertical-align:middle; font-weight:bold; }
  th.date { background:#2e7d32;color:#fff; font-size:11px; }
  th.emp { background:#2e7d32;color:#fff; width:140px; }
  td.cell { background:#fff; font-size:11px; }
  .foot { text-align:center; font-size:10px; color:#666; margin-top:20px; }
</style>
</head>
<body>
  <div class="header">
    <div class="title">HORARIOS SEMANALES</div>
    <div>Semana del ${weekDates[0].date} al ${weekDates[5].date}</div>
    <div><strong>6 días • 32 horas exactas • Cobertura en apertura y cierre</strong></div>
  </div>

  ${Object.entries(
    schedules.reduce((acc, s) => {
      ;(acc[s.sucursal] ||= []).push(s)
      return acc
    }, {} as Record<string, typeof schedules>),
  )
    .map(([sucId, items]) => {
      const suc = sucursales.find((s) => s.id === sucId)
      return `
      <div class="sucursal">${suc?.name || sucId}</div>
      <table>
        <thead>
          <tr>
            <th class="emp">EMPLEADO</th>
            ${weekDates
              .map((d) => `<th class="date">${d.date}<br>${d.dayName.toUpperCase()}</th>`)
              .join("")}
          </tr>
        </thead>
        <tbody>
          ${items
            .map((s) => {
              const total = Object.values(s.schedule).reduce((sum: number, d: { hours?: number }) => sum + (d?.hours || 0), 0)
              return `
              <tr>
                <td class="emp">${s.employeeName.toUpperCase()}</td>
                ${weekDates
                  .map((d) => {
                    const b = s.schedule[d.dayName]
                    const text = prettyDay(b, suc)
                    return `<td class="cell">${text}</td>`
                  })
                  .join("")}
              </tr>
              <tr><td colspan="${1 + weekDates.length}" class="cell" style="background:#f6f6f6;font-weight:normal;">
                Total semanal: <strong>${total.toFixed(2)} h</strong>
              </td></tr>
            `
            })
            .join("")}
        </tbody>
      </table>
    `
    })
    .join("")}

  <div class="foot">Generado el ${new Date().toLocaleDateString("es-AR")} • Sistema de Horarios</div>
</body>
</html>
    `

    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `horarios-semana-${weekDates[0].date.replace(/\//g, "-")}.html`
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
              No hay horarios generados. Ve a la pestaña Generar Horarios para crearlos.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const schedulesBySucursal = schedules.reduce((acc, s) => {
    ;(acc[s.sucursal] ||= []).push(s)
    return acc
  }, {} as Record<string, Schedule[]>)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Horarios Generados
          </CardTitle>
          <CardDescription>Formato visual y descarga en HTML estilo planilla</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{schedules.length}</p>
                <p className="text-sm text-muted-foreground">Empleados</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{Object.keys(schedulesBySucursal).length}</p>
                <p className="text-sm text-muted-foreground">Sucursales</p>
              </div>
            </div>
            <div className="flex gap-4 items-center">
              <div className="flex flex-col gap-2">
                <Label htmlFor="start-date" className="text-sm">
                  Fecha inicio de semana
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-40"
                />
              </div>
              <Button onClick={generatePDF} size="lg">
                <Download className="h-4 w-4 mr-2" />
                Descargar HTML
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {Object.entries(schedulesBySucursal).map(([sucursalId, sucSchedules]) => (
              <div key={sucursalId} className="space-y-4">
                <h3 className="text-xl font-semibold border-b pb-2">Sucursal: {sucursalId}</h3>
                <div className="space-y-4">
                  {sucSchedules.map((s) => {
                    const total = Object.values(s.schedule).reduce((sum, d: { hours?: number }) => sum + (d?.hours || 0), 0)
                    return (
                      <Card key={s.employeeId}>
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">{s.employeeName}</CardTitle>
                            <div className="flex gap-2">
                              <Badge variant={Math.abs(total - 32) < 0.01 ? "default" : "destructive"}>
                                {total.toFixed(2)}h / 32h
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
                              const d = s.schedule[day]
                              const suc = getSucursalData(s.sucursal)
                              return (
                                <div key={day} className="grid grid-cols-7 gap-2 items-center py-2 border-t">
                                  <div className="font-medium">{day}</div>
                                  {suc ? (
                                    <SucursalScheduleDisplay sucursal={suc} daySchedule={d} day={day} />
                                  ) : (
                                    <>
                                      <div className="text-center text-xs text-muted-foreground">-</div>
                                      <div className="text-center text-xs text-muted-foreground">-</div>
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
