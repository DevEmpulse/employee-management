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

// ==== helpers fecha SIN UTC (local) + compat UTC ====
const isoLocal = (d: Date) => {
  const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,"0"); const da = String(d.getDate()).padStart(2,"0")
  return `${y}-${m}-${da}`
}
const isoUTC = (d: Date) => d.toISOString().split("T")[0]
const fromInput = (s: string) => { const [y,m,d] = s.split("-").map(Number); return new Date(y, (m??1)-1, d??1) }

function isoWeekId(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = (date.getUTCDay() + 6) % 7
  date.setUTCDate(date.getUTCDate() - dayNum + 3)
  const firstThu = new Date(Date.UTC(date.getUTCFullYear(),0,4))
  const week = 1 + Math.round(((+date - +firstThu)/86400000 - 3)/7)
  const year = date.getUTCFullYear()
  return `${year}-W${String(week).padStart(2,"0")}`
}

interface ScheduleViewerProps {
  schedules: Schedule[]
  sucursales: Sucursal[]
}

export function ScheduleViewer({ schedules, sucursales }: ScheduleViewerProps) {
  const [startDate, setStartDate] = useState<string>(isoLocal(new Date()))

  const getSucursal = (id: string) => sucursales.find(s => s.id === id)

  // Semana L–S (LOCAL)
  const weekDates = useMemo(() => {
    const start = fromInput(startDate)
    const dow = start.getDay()
    const mondayOffset = dow === 0 ? -6 : 1 - dow
    const monday = new Date(start); monday.setDate(start.getDate() + mondayOffset)
    const out: { iso: string; isoUTC: string; date: string; dayName: string; d: Date }[] = []
    for (let i=0;i<6;i++){
      const d=new Date(monday); d.setDate(monday.getDate()+i)
      out.push({ iso: isoLocal(d), isoUTC: isoUTC(d), date: d.toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit",year:"numeric"}), dayName: DAYS[i], d })
    }
    return out
  }, [startDate])

  // === Fechas del MES (L–S) desde startDate ===
  const monthDates = useMemo(() => {
    const base = fromInput(startDate)
    const first = new Date(base.getFullYear(), base.getMonth(), 1)
    const last  = new Date(base.getFullYear(), base.getMonth()+1, 0)
    const out: { iso: string; isoUTC: string; date: string; dayName: string; d: Date; weekId: string }[] = []
    for (let d=new Date(first); d<=last; d.setDate(d.getDate()+1)){
      const dow = d.getDay() // 0 dom .. 6 sáb
      if (dow>=1 && dow<=6){
        out.push({
          iso: isoLocal(d), isoUTC: isoUTC(d),
          date: d.toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit"}),
          dayName: DAYS[dow-1], d: new Date(d), weekId: isoWeekId(d)
        })
      }
    }
    return out
  }, [startDate])

  const schedulesBySucursal = schedules.reduce((acc, s) => {
    (acc[s.sucursal] ||= []).push(s)
    return acc
  }, {} as Record<string, Schedule[]>)

  // Lookup robusto (LOCAL -> UTC)
  const getBlock = (s: Schedule, isoKey: string, isoKeyUTC: string) =>
    (s.schedule as Record<string, DaySchedule | undefined>)[isoKey] ??
    (s.schedule as Record<string, DaySchedule | undefined>)[isoKeyUTC]

  // Helpers formato
  const prettyHour = (hhmm: string) => { const [h,m]=hhmm.split(":"); const H=String(+h); return m==="30"?`${H}.30` : m==="00"?H : `${H}:${m}` }
  const prettyRange = (a: string, b: string) => `${prettyHour(a)} A ${prettyHour(b)}`
  const prettyDay = (b: DaySchedule | undefined, suc: Sucursal | undefined) => {
    if (!b || !suc) return "Descanso"
    const parts: string[] = []
    if (b.morning)  parts.push(prettyRange(b.morningStart  ?? suc.morningStart,  b.morningEnd  ?? suc.morningEnd))
    if (b.afternoon)parts.push(prettyRange(b.afternoonStart?? suc.afternoonStart,b.afternoonEnd?? suc.afternoonEnd))
    return parts.length ? parts.join(" Y ") : "Descanso"
  }

  // ======= HTML SEMANAL =======
  const generateWeeklyHTML = () => {
    const week = weekDates
    const html = `
<!doctype html><html><head><meta charset="utf-8"/>
<title>Horarios Semana</title>
<style>
 body{font-family:Arial,sans-serif;margin:10px;font-size:12px}
 .header{text-align:center;margin-bottom:16px}.title{font-size:18px;font-weight:bold}
 .sucursal{background:#2196F3;color:#fff;text-align:center;font-weight:bold;padding:8px;margin:16px 0 8px}
 table{width:100%;border-collapse:collapse;margin-bottom:14px}
 th,td{border:2px solid #000;padding:6px;text-align:center;vertical-align:middle;font-weight:bold}
 th.date{background:#2e7d32;color:#fff} th.emp{background:#2e7d32;color:#fff;width:160px}
 .badge{display:inline-block;padding:2px 6px;border-radius:8px;font-weight:600}
 .ok{background:#e8f5e9;color:#1b5e20}.bad{background:#ffebee;color:#b71c1c}
 .foot{text-align:center;color:#666;margin-top:10px}
</style></head><body>
<div class="header"><div class="title">HORARIOS SEMANALES</div><div>Semana del ${week[0].date} al ${week[5].date}</div></div>
${Object.entries(schedulesBySucursal).map(([sucId, items])=>{
  const sucName = getSucursal(sucId)?.name ?? sucId
  const head = '<thead><tr><th class="emp">EMPLEADO</th>' + week.map(d=>`<th class="date">${d.date}<br>${d.dayName.toUpperCase()}</th>`).join("") + '</tr></thead>'
  const rows = items.map(s=>{
    const weekTotal = week.reduce((sum,d)=> sum + ((getBlock(s,d.iso,d.isoUTC)?.hours)||0), 0)
    const cells = week.map(d=>{
      const b = getBlock(s,d.iso,d.isoUTC); const sucObj = getSucursal(s.sucursal)
      return (!b||!sucObj) ? `<td>Descanso</td>` : `<td>${prettyDay(b,sucObj)}</td>`
    }).join("")
    const badgeCls = (weekTotal>=31.5 && weekTotal<=32.5) ? "ok" : "bad"
    return `<tr><td class="emp">${s.employeeName.toUpperCase()}<br><span class="badge ${badgeCls}">${weekTotal.toFixed(2)}h</span></td>${cells}</tr>`
  }).join("")
  return `<div class="sucursal">${sucName}</div><table>${head}<tbody>${rows}</tbody></table>`
}).join("")}
<div class="foot">Generado el ${new Date().toLocaleDateString("es-AR")}</div>
</body></html>`
    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url
    a.download = `horarios-semana-${week[0].date.replace(/\//g,"-")}.html`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
  }

  // ======= HTML MENSUAL (cronograma) =======
  const generateMonthlyHTML = () => {
    const byWeek = Array.from(new Set(monthDates.map(d=>d.weekId))).map(w=>{
      return { id: w, days: monthDates.filter(x=>x.weekId===w) } // cada semana con sus L–S
    })

    const html = `
<!doctype html><html><head><meta charset="utf-8"/>
<title>Cronograma Mensual</title>
<style>
 body{font-family:Arial,sans-serif;margin:10px;font-size:11px}
 .header{text-align:center;margin-bottom:16px}.title{font-size:18px;font-weight:bold}
 .sucursal{background:#1565C0;color:#fff;text-align:center;font-weight:bold;padding:8px;margin:16px 0 8px}
 .weekTitle{font-weight:bold;margin:6px 0}
 table{width:100%;border-collapse:collapse;margin-bottom:10px}
 th,td{border:1.8px solid #000;padding:4px;text-align:center;vertical-align:middle;font-weight:bold}
 th.date{background:#2e7d32;color:#fff} th.emp{background:#2e7d32;color:#fff;width:160px}
 .subtotal{background:#f6f6f6}
 .foot{text-align:center;color:#666;margin-top:10px}
</style></head><body>
<div class="header">
  <div class="title">CRONOGRAMA MENSUAL</div>
  <div>${monthDates[0]?.d.toLocaleDateString("es-AR", { month: "long", year: "numeric" })?.toUpperCase() || ""}</div>
  <div><strong>Días L–S • Totales por semana y por mes</strong></div>
</div>
${Object.entries(schedulesBySucursal).map(([sucId, items])=>{
  const sucName = getSucursal(sucId)?.name ?? sucId

  // totales mensuales por empleado
  const monthTotals: Record<string, number> = {}
  items.forEach(s=>{
    monthTotals[s.employeeId] = monthDates.reduce((sum,d)=> sum + ((getBlock(s,d.iso,d.isoUTC)?.hours)||0), 0)
  })

  const weekTables = byWeek.map(week=>{
    const head = '<thead><tr><th class="emp">EMPLEADO</th>' +
      week.days.map(d=>`<th class="date">${d.date}<br>${d.dayName.toUpperCase()}</th>`).join("") +
      `<th class="date">TOTAL SEM.</th></tr></thead>`

    const rows = items.map(s=>{
      let wsum = 0
      const cells = week.days.map(d=>{
        const b = getBlock(s,d.iso,d.isoUTC); const sucObj = getSucursal(s.sucursal)
        const txt = (!b||!sucObj) ? "Descanso" : prettyDay(b,sucObj)
        const h  = (!b) ? 0 : (b.hours||0); wsum += h
        return `<td>${txt}</td>`
      }).join("")
      return `<tr><td class="emp">${s.employeeName.toUpperCase()}</td>${cells}<td class="subtotal">${wsum.toFixed(2)}h</td></tr>`
    }).join("")

    return `<div class="weekTitle">Semana ${week.id}</div><table>${head}<tbody>${rows}</tbody></table>`
  }).join("")

  // resumen mensual por empleado (debajo)
  const monthSummary = `
  <table>
    <thead><tr><th class="emp">EMPLEADO</th><th class="date">TOTAL MES</th></tr></thead>
    <tbody>
      ${items.map(s=>`<tr><td class="emp">${s.employeeName.toUpperCase()}</td><td class="subtotal">${(monthTotals[s.employeeId]||0).toFixed(2)}h</td></tr>`).join("")}
    </tbody>
  </table>`

  return `<div class="sucursal">${sucName}</div>${weekTables}${monthSummary}`
}).join("")}
<div class="foot">Generado el ${new Date().toLocaleDateString("es-AR")}</div>
</body></html>`

    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url
    const y = fromInput(startDate).getFullYear()
    const m = String(fromInput(startDate).getMonth()+1).padStart(2,"0")
    a.download = `cronograma-${y}-${m}.html`
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
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

  // ====== UI ======
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Horarios (Vista Semanal por ISO)</CardTitle>
          <CardDescription>Lectura por fecha <b>local</b> con fallback a UTC. Incluye descarga Semanal y <b>Mensual</b>.</CardDescription>
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
                <Label htmlFor="start-date" className="text-sm">Fecha inicio de semana / Mes</Label>
                <Input id="start-date" type="date" value={startDate} onChange={(e)=>setStartDate(e.target.value)} className="w-44" />
              </div>
              <Button onClick={generateWeeklyHTML}><Download className="h-4 w-4 mr-2" />HTML (semana)</Button>
              <Button onClick={generateMonthlyHTML}><Download className="h-4 w-4 mr-2" />HTML (mes)</Button>
            </div>
          </div>

          {/* Cobertura por sucursal en la semana seleccionada */}
          {Object.entries(schedulesBySucursal).map(([sucId, items])=>{
            const suc = getSucursal(sucId)!
            const cov = weekDates.map(d=>{
              let morningClose=false, afternoonOpen=false
              items.forEach(s=>{
                const b = getBlock(s,d.iso,d.isoUTC)
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
                  {cov.map(c=>(
                    <Badge key={c.iso} variant={(c.morningClose && c.afternoonOpen) ? "default" : "destructive"}>
                      {c.dayName}: {c.morningClose ? <CheckCircle2 className="inline h-4 w-4 mr-1"/> : <XCircle className="inline h-4 w-4 mr-1"/>}M · {c.afternoonOpen ? <CheckCircle2 className="inline h-4 w-4 mr-1"/> : <XCircle className="inline h-4 w-4 mr-1"/>}A
                    </Badge>
                  ))}
                </div>

                <div className="space-y-4">
                  {items.map(s=>{
                    const weekTotal = weekDates.reduce((sum,d)=> sum + ((getBlock(s,d.iso,d.isoUTC)?.hours)||0), 0)
                    const monthTotal = monthDates.reduce((sum,d)=> sum + ((getBlock(s,d.iso,d.isoUTC)?.hours)||0), 0)
                    const weeksInMonth = new Set(monthDates.map(d=>d.weekId)).size
                    const monthTarget = 32 * weeksInMonth

                    return (
                      <Card key={s.employeeId}>
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">{s.employeeName}</CardTitle>
                            <div className="flex gap-2">
                              <Badge variant={(weekTotal>=31.5 && weekTotal<=32.5) ? "default" : "destructive"}>
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
                            {weekDates.map(d=>{
                              const b = getBlock(s,d.iso,d.isoUTC)
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
        </CardContent>
      </Card>
    </div>
  )
}
