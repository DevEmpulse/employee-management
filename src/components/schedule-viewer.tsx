"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, FileText, AlertCircle, CheckCircle2, XCircle, Building2 } from "lucide-react"
import type { Schedule, Sucursal, DaySchedule } from "@/types"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"] as const
const DAY_TO_DOW: Record<string, number> = {
  "lunes": 1,
  "martes": 2,
  "miercoles": 3,
  "jueves": 4,
  "viernes": 5,
  "sabado": 6,
  "domingo": 0
}

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
  selectedDate?: string
  onDateChange?: (date: string) => void
}

export function ScheduleViewer({ schedules, sucursales, selectedDate, onDateChange }: ScheduleViewerProps) {
  const [startDate, setStartDate] = useState<string>(selectedDate || isoLocal(new Date()))
  const [selectedSucursal, setSelectedSucursal] = useState<string>("")

  // Sincronizar con la fecha seleccionada desde el componente padre
  useEffect(() => {
    if (selectedDate && selectedDate !== startDate) {
      setStartDate(selectedDate)
    }
  }, [selectedDate, startDate])

  // Debug: Log cuando cambian los schedules
  useEffect(() => {
    console.log("ScheduleViewer - schedules actualizados:", schedules.length, "horarios")
  }, [schedules])

  const getSucursal = (id: string) => sucursales.find(s => s.id === id)

  // Semana L–S (LOCAL) - ahora dinámico según el día libre de la sucursal
  const weekDates = useMemo(() => {
    const start = fromInput(startDate)
    const dow = start.getDay()
    const mondayOffset = dow === 0 ? -6 : 1 - dow
    const monday = new Date(start); monday.setDate(start.getDate() + mondayOffset)
    const out: { iso: string; isoUTC: string; date: string; dayName: string; d: Date }[] = []
    for (let i=0;i<7;i++){
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
      out.push({
        iso: isoLocal(d), isoUTC: isoUTC(d),
        date: d.toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit"}),
        dayName: DAYS[dow === 0 ? 6 : dow - 1], d: new Date(d), weekId: isoWeekId(d)
      })
    }
    return out
  }, [startDate])

  const schedulesBySucursal = schedules.reduce((acc, s) => {
    (acc[s.sucursal] ||= []).push(s)
    return acc
  }, {} as Record<string, Schedule[]>)

  // Obtener sucursales que tienen horarios
  const sucursalesWithSchedules = sucursales.filter(suc => schedulesBySucursal[suc.id])

  // Si no hay sucursal seleccionada, seleccionar la primera por defecto
  if (!selectedSucursal && sucursalesWithSchedules.length > 0) {
    setSelectedSucursal(sucursalesWithSchedules[0].id)
  }

     const selectedSucursalData = getSucursal(selectedSucursal)
   const selectedSucursalSchedules = selectedSucursal ? schedulesBySucursal[selectedSucursal] || [] : []
   




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

  // Función para formatear horarios (igual que en el editor)
  const formatShift = (schedule: DaySchedule | undefined, sucursal: Sucursal, shift: "morning" | "afternoon") => {
    if (!schedule) return "Descanso"
    
    if (shift === "morning" && schedule.morning) {
      const start = schedule.morningStart || sucursal.morningStart
      const end = schedule.morningEnd || sucursal.morningEnd
      return `${start}-${end}`
    }
    
    if (shift === "afternoon" && schedule.afternoon) {
      const start = schedule.afternoonStart || sucursal.afternoonStart
      const end = schedule.afternoonEnd || sucursal.afternoonEnd
      return `${start}-${end}`
    }
    
    return "Descanso"
  }

  // Función para obtener las fechas de trabajo de una sucursal (excluyendo su día libre)
  const getWorkingDates = (suc: Sucursal, dates: typeof weekDates | typeof monthDates) => {
    const dayOffDow = DAY_TO_DOW[suc.dayOff.toLowerCase()] ?? 0
    return dates.filter(d => d.d.getDay() !== dayOffDow)
  }

  // ======= HTML SEMANAL =======
  const generateWeeklyHTML = () => {
    if (!selectedSucursalData) return

    const html = `
<!doctype html><html><head><meta charset="utf-8"/>
<title>Horarios Semana - ${selectedSucursalData.name}</title>
<style>
 body{font-family:Arial,sans-serif;margin:10px;font-size:12px}
 .header{text-align:center;margin-bottom:16px}.title{font-size:18px;font-weight:bold}
 .sucursal{background:#2196F3;color:#fff;text-align:center;font-weight:bold;padding:8px;margin:16px 0 8px}
 table{width:100%;border-collapse:collapse;margin-bottom:14px}
 th,td{border:2px solid #000;padding:6px;text-align:center;vertical-align:middle;font-weight:bold}
 th.date{background:#2e7d32;color:#fff} th.emp{background:#2e7d32;color:#fff;width:160px} th.rest{background:#ff9800;color:#fff}
 .badge{display:inline-block;padding:2px 6px;border-radius:8px;font-weight:600}
 .ok{background:#e8f5e9;color:#1b5e20}.bad{background:#ffebee;color:#b71c1c}
 .foot{text-align:center;color:#666;margin-top:10px}
</style></head><body>
<div class="header"><div class="title">HORARIOS SEMANALES - ${selectedSucursalData.name}</div><div>Semana del ${weekDates[0].date} al ${weekDates[6].date}</div></div>

<div class="sucursal">${selectedSucursalData.name} (Día libre: ${selectedSucursalData.dayOff})</div>
<table>
<thead><tr><th class="emp">EMPLEADO</th>${weekDates.map(d=>`<th class="date">${d.date}<br>${d.dayName.toUpperCase()}</th>`).join("")}</tr></thead>
<tbody>
${selectedSucursalSchedules.map(s=>{
  const cells = weekDates.map(d=>{
    const b = getBlock(s,d.iso,d.isoUTC)
    const isDayOff = d.d.getDay() === DAY_TO_DOW[selectedSucursalData.dayOff.toLowerCase()]
    return isDayOff ? `<td class="rest">Descanso</td>` : (!b ? `<td>Descanso</td>` : `<td>${prettyDay(b,selectedSucursalData)}</td>`)
  }).join("")
  
  return `<tr><td class="emp">${s.employeeName.toUpperCase()}</td>${cells}</tr>`
}).join("")}
</tbody>
</table>
<div class="foot">Generado el ${new Date().toLocaleDateString("es-AR")}</div>
</body></html>`
    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url
    a.download = `horarios-semana-${selectedSucursalData.name}-${weekDates[0].date.replace(/\//g,"-")}.html`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
  }

  // ======= HTML MENSUAL (cronograma) =======
  const generateMonthlyHTML = () => {
    if (!selectedSucursalData) return

    const byWeek = Array.from(new Set(monthDates.map(d=>d.weekId))).map(w=>{
      return { id: w, days: monthDates.filter(x=>x.weekId===w) } // cada semana con sus días
    })

    const html = `
<!doctype html><html><head><meta charset="utf-8"/>
<title>Cronograma Mensual - ${selectedSucursalData.name}</title>
<style>
 body{font-family:Arial,sans-serif;margin:10px;font-size:11px}
 .header{text-align:center;margin-bottom:16px}.title{font-size:18px;font-weight:bold}
 .sucursal{background:#1565C0;color:#fff;text-align:center;font-weight:bold;padding:8px;margin:16px 0 8px}
 .weekTitle{font-weight:bold;margin:6px 0}
 table{width:100%;border-collapse:collapse;margin-bottom:10px}
 th,td{border:1.8px solid #000;padding:4px;text-align:center;vertical-align:middle;font-weight:bold}
 th.date{background:#2e7d32;color:#fff} th.emp{background:#2e7d32;color:#fff;width:160px} th.rest{background:#ff9800;color:#fff}
 .subtotal{background:#f6f6f6}
 .foot{text-align:center;color:#666;margin-top:10px}
</style></head><body>
<div class="header">
  <div class="title">CRONOGRAMA MENSUAL - ${selectedSucursalData.name}</div>
  <div>${monthDates[0]?.d.toLocaleDateString("es-AR", { month: "long", year: "numeric" })?.toUpperCase() || ""}</div>
  <div><strong>Días de trabajo • Totales por semana y por mes</strong></div>
</div>

<div class="sucursal">${selectedSucursalData.name} (Día libre: ${selectedSucursalData.dayOff})</div>

${byWeek.map(week=>{
  const head = '<thead><tr><th class="emp">EMPLEADO</th>' +
    week.days.map(d=>`<th class="date">${d.date}<br>${d.dayName.toUpperCase()}</th>`).join("") +
    '</tr></thead>'

  const rows = selectedSucursalSchedules.map(s=>{
    const cells = week.days.map(d=>{
      const b = getBlock(s,d.iso,d.isoUTC)
      const isDayOff = d.d.getDay() === DAY_TO_DOW[selectedSucursalData.dayOff.toLowerCase()]
      const txt = isDayOff ? "Descanso" : (!b ? "Descanso" : prettyDay(b,selectedSucursalData))
      return isDayOff ? `<td class="rest">${txt}</td>` : `<td>${txt}</td>`
    }).join("")
    
    return `<tr><td class="emp">${s.employeeName.toUpperCase()}</td>${cells}</tr>`
  }).join("")

  return `<div class="weekTitle">Semana ${week.id}</div><table>${head}<tbody>${rows}</tbody></table>`
}).join("")}

<div class="foot">Generado el ${new Date().toLocaleDateString("es-AR")}</div>
</body></html>`

    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url
    const y = fromInput(startDate).getFullYear()
    const m = String(fromInput(startDate).getMonth()+1).padStart(2,"0")
    a.download = `cronograma-${selectedSucursalData.name}-${y}-${m}.html`
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
  }

  if (schedules.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No hay horarios generados. Genera horarios desde la pestaña &quot;Generar Horarios&quot; para poder visualizarlos aquí.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // ====== UI ======
  return (
    <div className="space-y-3 md:space-y-6">
      <Card className="shadow-sm">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex items-center gap-2 text-base md:text-xl">
            <FileText className="h-4 w-4 md:h-5 md:w-5" />
            Horarios
          </CardTitle>
          <CardDescription className="text-xs md:text-base">
            Respeta el día libre configurado en cada sucursal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-6">
          {/* Barra de filtros por sucursal */}
          <div className="mb-3 md:mb-6">
            <div className="bg-gray-50 rounded-lg p-1 flex flex-wrap gap-1 overflow-x-auto">
              {sucursalesWithSchedules.map((sucursal) => (
                <Button
                  key={sucursal.id}
                  variant={selectedSucursal === sucursal.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedSucursal(sucursal.id)}
                  className={cn(
                    "flex items-center gap-1 md:gap-2 cursor-pointer transition-all duration-200 text-xs md:text-sm whitespace-nowrap",
                    selectedSucursal === sucursal.id 
                      ? "bg-white text-gray-900 shadow-sm ring-2 ring-blue-500/20" 
                      : "hover:bg-gray-200 text-gray-600 hover:shadow-sm"
                  )}
                >
                  <Building2 className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">{sucursal.name}</span>
                  <span className="sm:hidden">{sucursal.name.length > 6 ? sucursal.name.substring(0, 6) + '...' : sucursal.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Stats y controles */}
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3 md:gap-4 mb-3 md:mb-6">
            <div className="flex gap-3 md:gap-6">
              <div className="text-center bg-blue-50 rounded-lg p-2 md:p-3 flex-1">
                <p className="text-lg md:text-2xl font-bold text-blue-600">{selectedSucursalSchedules.length}</p>
                <p className="text-xs md:text-sm text-blue-700/70">Empleados</p>
              </div>
              <div className="text-center bg-green-50 rounded-lg p-2 md:p-3 flex-1">
                <p className="text-lg md:text-2xl font-bold text-green-600">{sucursalesWithSchedules.length}</p>
                <p className="text-xs md:text-sm text-green-700/70">Sucursales</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 md:gap-4 items-start sm:items-center">
              <div className="flex flex-col gap-1 md:gap-2 w-full sm:w-auto">
                <Label htmlFor="start-date" className="text-xs md:text-sm font-medium">Fecha inicio</Label>
                <Input 
                  id="start-date" 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => {
                    const newDate = e.target.value
                    setStartDate(newDate)
                    onDateChange?.(newDate)
                  }} 
                  className="w-full sm:w-44 text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500/20" 
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                                 <Button 
                   onClick={generateWeeklyHTML} 
                   disabled={!selectedSucursalData}
                   size="sm"
                   className="flex-1 sm:flex-none text-xs bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   <Download className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                   <span className="hidden sm:inline">HTML (semana)</span>
                   <span className="sm:hidden">Semana</span>
                 </Button>
                 <Button 
                   onClick={generateMonthlyHTML} 
                   disabled={!selectedSucursalData}
                   size="sm"
                   className="flex-1 sm:flex-none text-xs bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   <Download className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                   <span className="hidden sm:inline">HTML (mes)</span>
                   <span className="sm:hidden">Mes</span>
                 </Button>
              </div>
            </div>
          </div>

          {/* Contenido de la sucursal seleccionada */}
          {selectedSucursalData && selectedSucursalSchedules.length > 0 && (
            <div className="space-y-3 md:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <div>
                  <h3 className="text-base md:text-xl font-semibold text-gray-900">
                    {selectedSucursalData.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs md:text-sm text-blue-600 font-medium">
                      Día libre: {selectedSucursalData.dayOff}
                    </p>
                    <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 rounded-full border border-yellow-200">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-xs text-yellow-700 font-medium">Descanso</span>
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="w-fit bg-blue-100 text-blue-800 border-blue-200">
                  {selectedSucursalSchedules.length} empleados
                </Badge>
              </div>

              {/* Cobertura por sucursal en la semana seleccionada */}
                             {(() => {
                 const cov = weekDates.map(d=>{
                   const isDayOff = d.d.getDay() === DAY_TO_DOW[selectedSucursalData.dayOff.toLowerCase()]
                   if (isDayOff) {
                     return { iso: d.iso, dayName: d.dayName, morningClose: false, afternoonOpen: false, isDayOff: true }
                   }
                  let morningClose=false, afternoonOpen=false
                  selectedSucursalSchedules.forEach(s=>{
                    const b = getBlock(s,d.iso,d.isoUTC)
                    if (!b) return
                    if (b.morning && (b.morningEnd ?? selectedSucursalData.morningEnd) === selectedSucursalData.morningEnd) morningClose = true
                    if (b.afternoon && (b.afternoonStart ?? selectedSucursalData.afternoonStart) === selectedSucursalData.afternoonStart) afternoonOpen = true
                                     })
                   return { iso: d.iso, dayName: d.dayName, morningClose, afternoonOpen, isDayOff: false }
                 })

                                 return (
                   <div className="space-y-4">
                     {/* Cobertura semanal */}
                     <div className="flex gap-1 md:gap-2 mb-2 flex-wrap">
                       {cov.map(c=>(
                         <Badge 
                           key={c.iso} 
                           variant={c.isDayOff ? "secondary" : (c.morningClose && c.afternoonOpen) ? "default" : "destructive"}
                           className="text-xs"
                         >
                           <span className="hidden sm:inline">{c.dayName}: </span>
                           <span className="sm:hidden">{c.dayName.substring(0, 3)}: </span>
                           {c.isDayOff ? "Descanso" : (
                             <>
                               {c.morningClose ? <CheckCircle2 className="inline h-3 w-3 md:h-4 md:w-4 mr-1"/> : <XCircle className="inline h-3 w-3 md:h-4 md:w-4 mr-1"/>}
                               <span className="hidden sm:inline">M · </span>
                               <span className="sm:hidden">M</span>
                               {c.afternoonOpen ? <CheckCircle2 className="inline h-3 w-3 md:h-4 md:w-4 mr-1"/> : <XCircle className="inline h-3 w-3 md:h-4 md:w-4 mr-1"/>}
                               <span className="hidden sm:inline">A</span>
                               <span className="sm:hidden">A</span>
                             </>
                           )}
                         </Badge>
                       ))}
                     </div>

                     <div className="space-y-3 md:space-y-4">
                       {selectedSucursalSchedules.map(s=>{
                         const weekTotal = weekDates.reduce((sum,d)=> {
                           const isDayOff = d.d.getDay() === DAY_TO_DOW[selectedSucursalData.dayOff.toLowerCase()]
                           return sum + (isDayOff ? 0 : ((getBlock(s,d.iso,d.isoUTC)?.hours)||0))
                         }, 0)

                        return (
                          <Card key={s.employeeId} className="shadow-sm hover:shadow-md transition-shadow duration-200">
                            <CardHeader className="pb-3">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                <CardTitle className="text-base md:text-lg text-gray-900">{s.employeeName}</CardTitle>
                                                                 <div className="flex gap-2">
                                   <Badge 
                                     variant={(weekTotal>=31.5 && weekTotal<=32.5) ? "default" : "destructive"} 
                                     className={cn(
                                       "text-xs font-medium flex items-center gap-1",
                                       (weekTotal>=31.5 && weekTotal<=32.5) 
                                         ? "bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300 shadow-sm" 
                                         : "bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300 shadow-sm"
                                     )}
                                   >
                                     <div className={cn(
                                       "w-2 h-2 rounded-full",
                                       (weekTotal>=31.5 && weekTotal<=32.5) ? "bg-green-500" : "bg-red-500"
                                     )}></div>
                                     <span className="hidden sm:inline">Semana: </span>
                                     <span className="sm:hidden">Sem: </span>
                                     {weekTotal.toFixed(2)}h
                                   </Badge>
                                 </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-1">
                                {/* Header de la tabla */}
                                <div className="grid grid-cols-4 gap-2 text-xs md:text-sm font-semibold text-center bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-lg border border-gray-200">
                                  <div className="text-gray-700 flex items-center justify-center">
                                    <span className="hidden sm:inline">Día</span>
                                    <span className="sm:hidden">D</span>
                                  </div>
                                  <div className="text-blue-700 flex items-center justify-center">
                                    <span className="hidden sm:inline">Mañana</span>
                                    <span className="sm:hidden">M</span>
                                  </div>
                                  <div className="text-green-700 flex items-center justify-center">
                                    <span className="hidden sm:inline">Tarde</span>
                                    <span className="sm:hidden">T</span>
                                  </div>
                                  <div className="text-purple-700 flex items-center justify-center">
                                    <span className="hidden sm:inline">Horas</span>
                                    <span className="sm:hidden">H</span>
                                  </div>
                                </div>
                                                                 {weekDates.map(d=>{
                                   const b = getBlock(s,d.iso,d.isoUTC)
                                   const isDayOff = d.d.getDay() === DAY_TO_DOW[selectedSucursalData.dayOff.toLowerCase()]
                                   

                                   
                                                                       if (isDayOff) {
                                                                             return (
                                         <div key={d.iso} className="grid grid-cols-4 gap-2 items-center py-3 border-t border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg mx-1">
                                           <div className="font-semibold text-yellow-800 text-xs md:text-sm flex items-center justify-center">
                                             <span className="hidden sm:inline">{d.dayName}</span>
                                             <span className="sm:hidden">{d.dayName.substring(0, 3)}</span>
                                           </div>
                                           <div className="text-center">
                                             <span className="text-yellow-800 text-xs font-semibold bg-yellow-200 px-3 py-1.5 rounded-full border border-yellow-300">Descanso</span>
                                           </div>
                                           <div className="text-center">
                                             <span className="text-yellow-800 text-xs font-semibold bg-yellow-200 px-3 py-1.5 rounded-full border border-yellow-300">Descanso</span>
                                           </div>
                                           <div className="text-center font-bold text-yellow-800 text-xs md:text-sm">0h</div>
                                         </div>
                                       )
                                    }
                                    
                                                                         return (
                                       <div key={d.iso} className="grid grid-cols-4 gap-2 items-center py-3 border-t border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 rounded-lg mx-1 group">
                                         <div className="font-semibold text-xs md:text-sm text-gray-900 flex items-center justify-center">
                                           <span className="hidden sm:inline">{d.dayName}</span>
                                           <span className="sm:hidden">{d.dayName.substring(0, 3)}</span>
                                         </div>
                                         <div className="text-center">
                                                                                       {b?.morning ? (
                                              <Badge variant="default" className="text-xs bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300 hover:from-blue-200 hover:to-blue-300 transition-all duration-200 shadow-sm">
                                                <span className="hidden sm:inline">{formatShift(b, selectedSucursalData, "morning")}</span>
                                                <span className="sm:hidden">{formatShift(b, selectedSucursalData, "morning").replace('-', '→')}</span>
                                              </Badge>
                                            ) : (
                                              <span className="text-gray-400 text-xs font-medium">-</span>
                                            )}
                                         </div>
                                         <div className="text-center">
                                                                                       {b?.afternoon ? (
                                              <Badge variant="default" className="text-xs bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300 hover:from-green-200 hover:to-green-300 transition-all duration-200 shadow-sm">
                                                <span className="hidden sm:inline">{formatShift(b, selectedSucursalData, "afternoon")}</span>
                                                <span className="sm:hidden">{formatShift(b, selectedSucursalData, "afternoon").replace('-', '→')}</span>
                                              </Badge>
                                            ) : (
                                              <span className="text-gray-400 text-xs font-medium">-</span>
                                            )}
                                         </div>
                                         <div className="text-center font-bold text-xs md:text-sm text-purple-700 group-hover:text-purple-800 transition-colors">
                                           {b?.hours ?? 0}h
                                         </div>
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
              })()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
