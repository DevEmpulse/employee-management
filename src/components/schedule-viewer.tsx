"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, FileText, AlertCircle, CheckCircle2, XCircle } from "lucide-react"
import type { Schedule, Sucursal, DaySchedule } from "@/types"
import { SucursalScheduleDisplay } from "@/components/sucursal-schedule-display"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"] as const

// === helpers de fecha sin UTC (LOCAL) ===
const isoLocal = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const da = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${da}`
}
// compat con datos guardados en UTC
const isoUTC = (d: Date) => d.toISOString().split("T")[0]

// parsear <input type=date> como local
const fromInput = (s: string) => {
  const [y, m, d] = s.split("-").map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

// Semana ISO (para stats del mes si querés)
function isoWeekId(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = (date.getUTCDay() + 6) % 7
  date.setUTCDate(date.getUTCDate() - dayNum + 3)
  const firstThu = new Date(Date.UTC(date.getUTCFullYear(), 0, 4))
  const week = 1 + Math.round(((+date - +firstThu) / 86400000 - 3) / 7)
  const year = date.getUTCFullYear()
  return `${year}-W${String(week).padStart(2, "0")}`
}

interface ScheduleViewerProps {
  schedules: Schedule[]
  sucursales: Sucursal[]
}

export function ScheduleViewer({ schedules, sucursales }: ScheduleViewerProps) {
  const [startDate, setStartDate] = useState<string>(isoLocal(new Date()))

  const getSucursal = (id: string) => sucursales.find((s) => s.id === id)

  // Semana L–S desde la fecha elegida (LOCAL)
  const weekDates = useMemo(() => {
    const start = fromInput(startDate)
    const dow = start.getDay()
    const mondayOffset = dow === 0 ? -6 : 1 - dow
    const monday = new Date(start)
    monday.setDate(start.getDate() + mondayOffset)

    const out: { iso: string; isoUTC: string; date: string; dayName: string; d: Date }[] = []
    for (let i = 0; i < 6; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      out.push({
        iso: isoLocal(d),
        isoUTC: isoUTC(d),
        date: d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }),
        dayName: DAYS[i],
        d,
      })
    }
    return out
  }, [startDate])

  const schedulesBySucursal = schedules.reduce((acc, s) => {
    ;(acc[s.sucursal] ||= []).push(s)
    return acc
  }, {} as Record<string, Schedule[]>)

  // Lookup robusto: prueba local, luego UTC
  const getBlock = (s: Schedule, isoKey: string, isoKeyUTC: string) =>
    (s.schedule as Record<string, DaySchedule | undefined>)[isoKey] ??
    (s.schedule as Record<string, DaySchedule | undefined>)[isoKeyUTC]

  // Helpers de formato
  const prettyHour = (hhmm: string) => {
    const [h, m] = hhmm.split(":")
    const H = String(+h)
    return m === "30" ? `${H}.30` : m === "00" ? H : `${H}:${m}`
  }
  const prettyRange = (a: string, b: string) => `${prettyHour(a)} A ${prettyHour(b)}`
  const prettyDay = (b: DaySchedule | undefined, suc: Sucursal | undefined) => {
    if (!b || !suc) return "Descanso"
    const parts: string[] = []
    if (b.morning) parts.push(prettyRange(b.morningStart ?? suc.morningStart, b.morningEnd ?? suc.morningEnd))
    if (b.afternoon) parts.push(prettyRange(b.afternoonStart ?? suc.afternoonStart, b.afternoonEnd ?? suc.afternoonEnd))
    return parts.length ? parts.join(" Y ") : "Descanso"
  }

  // HTML semanal
  const generateHTML = () => {
    const week = weekDates
    const html =
      `<!doctype html><html><head><meta charset="utf-8"/>` +
      `<title>Horarios Semana</title>` +
      `<style>body{font-family:Arial,sans-serif;margin:10px;font-size:12px}.header{text-align:center;margin-bottom:16px}.title{font-size:18px;font-weight:bold}.sucursal{background:#2196F3;color:#fff;text-align:center;font-weight:bold;padding:8px;margin:16px 0 8px}table{width:100%;border-collapse:collapse;margin-bottom:14px}th,td{border:2px solid #000;padding:6px;text-align:center;vertical-align:middle;font-weight:bold}th.date{background:#2e7d32;color:#fff}th.emp{background:#2e7d32;color:#fff;width:160px}.badge{display:inline-block;padding:2px 6px;border-radius:8px;font-weight:600}.ok{background:#e8f5e9;color:#1b5e20}.bad{background:#ffebee;color:#b71c1c}.foot{text-align:center;color:#666;margin-top:10px}</style></head><body>` +
      `<div class="header"><div class="title">HORARIOS SEMANALES</div><div>Semana del ${week[0].date} al ${week[5].date}</div></div>` +
      Object.entries(schedulesBySucursal)
        .map(([sucId, items]) => {
          const sucName = getSucursal(sucId)?.name ?? sucId
          const head =
            `<thead><tr><th class="emp">EMPLEADO</th>` +
            week.map((d) => `<th class="date">${d.date}<br>${d.dayName.toUpperCase()}</th>`).join("") +
            `</tr></thead>`
          const rows = items
            .map((s) => {
              const weekTotal = week.reduce((sum, d) => sum + ((getBlock(s, d.iso, d.isoUTC)?.hours) || 0), 0)
              const cells = week
                .map((d) => {
                  const b = getBlock(s, d.iso, d.isoUTC)
                  const sucObj = getSucursal(s.sucursal)
                  if (!b || !sucObj) return `<td>Descanso</td>`
                  return `<td>${prettyDay(b, sucObj)}</td>`
                })
                .join("")
              const badgeCls = weekTotal >= 31.5 && weekTotal <= 32.5 ? "ok" : "bad"
              return `<tr><td class="emp">${s.employeeName.toUpperCase()}<br><span class="badge ${badgeCls}">${weekTotal.toFixed(2)}h</span></td>${cells}</tr>`
            })
            .join("")
          return `<div class="sucursal">${sucName}</div><table>${head}<tbody>${rows}</tbody></table>`
        })
        .join("") +
      `<div class="foot">Generado el ${new Date().toLocaleDateString("es-AR")}</div></body></html>`

    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `horarios-semana-${week[0].date.replace(/\//g, "-")}.html`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  if (schedules.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert><AlertCircle className="h-4 w-4" /><AlertDescription>No hay horarios generados.</AlertDescription></Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Horarios (Vista Semanal por ISO)</CardTitle>
          <CardDescription>Lectura por fecha <strong>local</strong> con fallback a UTC. El sábado ya no desaparece.</CardDescription>
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
                <Label htmlFor="start-date" className="text-sm">Fecha inicio de semana</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-40"
                />
              </div>
              <Button onClick={generateHTML}><Download className="h-4 w-4 mr-2" />Descargar HTML (semana)</Button>
            </div>
          </div>

          <div className="space-y-6">
            {Object.entries(schedulesBySucursal).map(([sucId, items]) => {
              const suc = getSucursal(sucId)!
              // semáforos de cobertura por día
              const cov = weekDates.map(d => {
                let morningClose = false, afternoonOpen = false
                items.forEach(s => {
                  const b = getBlock(s, d.iso, d.isoUTC)
                  if (!b) return
                  if (b.morning && (b.morningEnd ?? suc.morningEnd) === suc.morningEnd) morningClose = true
                  if (b.afternoon && (b.afternoonStart ?? suc.afternoonStart) === suc.afternoonStart) afternoonOpen = true
                })
                return { iso: d.iso, dayName: d.dayName, morningClose, afternoonOpen }
              })

              return (
                <div key={sucId} className="space-y-4">
                  <h3 className="text-xl font-semibold border-b pb-2">Sucursal: {suc?.name ?? sucId}</h3>

                  <div className="flex gap-2 mb-2 flex-wrap">
                    {cov.map(c => (
                      <Badge key={c.iso} variant={(c.morningClose && c.afternoonOpen) ? "default" : "destructive"}>
                        {c.dayName}: {c.morningClose ? <CheckCircle2 className="inline h-4 w-4 mr-1" /> : <XCircle className="inline h-4 w-4 mr-1" />}M · {c.afternoonOpen ? <CheckCircle2 className="inline h-4 w-4 mr-1" /> : <XCircle className="inline h-4 w-4 mr-1" />}A
                      </Badge>
                    ))}
                  </div>

                  <div className="space-y-4">
                    {items.map(s => {
                      const weekTotal = weekDates.reduce((sum, d) => sum + ((getBlock(s, d.iso, d.isoUTC)?.hours) || 0), 0)
                      const monthTotal = Object.values(s.schedule as Record<string, DaySchedule | undefined>).reduce((sum: number, b) => sum + (b?.hours || 0), 0)
                      const weeksInMonth = new Set(Object.keys(s.schedule as Record<string, DaySchedule | undefined>).map(k => isoWeekId(new Date(k)))).size
                      const monthTarget = 32 * weeksInMonth

                      return (
                        <Card key={s.employeeId}>
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-lg">{s.employeeName}</CardTitle>
                              <div className="flex gap-2">
                                <Badge variant={(weekTotal >= 31.5 && weekTotal <= 32.5) ? "default" : "destructive"}>
                                  Semana: {weekTotal.toFixed(2)}h
                                </Badge>
                                <Badge variant={Math.abs(monthTotal - monthTarget) < 0.01 ? "secondary" : "destructive"}>
                                  Mes: {monthTotal.toFixed(2)}h / {monthTarget}h
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid gap-2">
                              <div className="grid grid-cols-7 gap-2 text-sm font-medium text-center">
                                <div>Día</div><div>Mañana</div><div>Tarde</div><div>Horas</div><div></div><div></div><div></div>
                              </div>
                              {weekDates.map(d => {
                                const b = getBlock(s, d.iso, d.isoUTC)
                                return (
                                  <div key={d.iso} className="grid grid-cols-7 gap-2 items-center py-2 border-t">
                                    <div className="font-medium">{d.dayName}</div>
                                    <SucursalScheduleDisplay sucursal={suc} daySchedule={b} day={d.dayName} />
                                    <div></div><div></div><div></div>
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
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
