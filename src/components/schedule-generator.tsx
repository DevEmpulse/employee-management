"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, Shuffle, AlertCircle, Clock } from "lucide-react"
import type { Employee, Sucursal, Schedule, DaySchedule } from "@/types"

type DayBlock = {
  morning: boolean
  afternoon: boolean
  hours: number
  morningStart?: string
  morningEnd?: string
  afternoonStart?: string
  afternoonEnd?: string
}

interface MonthlyScheduleGeneratorProps {
  employees: Employee[]
  sucursales: Sucursal[]
  setSchedules: (schedules: Schedule[]) => void
  month?: string               // "YYYY-MM"; default: mes actual
  forbidConsecutiveDoubles?: boolean
  fixedCapacityPerShift?: number | null // si null => total-1
}

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"] as const

// ---------- utilidades de tiempo ----------
const t2m = (t: string) => { const [h,m] = t.split(":").map(Number); return h*60+m }
const m2t = (mins: number) => { const h = Math.floor(mins/60); const m = mins%60; return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}` }
const addMin = (t: string, mins: number) => m2t(t2m(t)+mins)
const hoursBetween = (a: string, b: string) => (t2m(b)-t2m(a))/60
const iso = (d: Date) => d.toISOString().split("T")[0]

// Semana ISO simple: "YYYY-Www" (lunes como inicio)
function isoWeekId(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = (date.getUTCDay() + 6) % 7
  date.setUTCDate(date.getUTCDate() - dayNum + 3)
  const firstThu = new Date(Date.UTC(date.getUTCFullYear(),0,4))
  const week = 1 + Math.round(((+date - +firstThu)/86400000 - 3)/7)
  const year = date.getUTCFullYear()
  return `${year}-W${String(week).padStart(2,"0")}`
}

function monthDates(year: number, monthIndex: number) {
  const first = new Date(year, monthIndex, 1)
  const last  = new Date(year, monthIndex+1, 0)
  const out: { iso: string; date: Date; dow: number; weekId: string; dayName: string }[] = []
  for (let d = new Date(first); d <= last; d.setDate(d.getDate()+1)) {
    const dow = d.getDay() // 0 Dom .. 6 Sáb
    if (dow >= 1 && dow <= 6) {
      out.push({
        iso: iso(d),
        date: new Date(d),
        dow,
        weekId: isoWeekId(d),
        dayName: DAYS[dow-1],
      })
    }
  }
  return out
}

// ---------- componente ----------
export function ScheduleGenerator({
  employees, sucursales, setSchedules, month,
  forbidConsecutiveDoubles = true,
  fixedCapacityPerShift = null,
}: MonthlyScheduleGeneratorProps) {

  const [isGenerating, setIsGenerating] = useState(false)

  // blocks
  const makeBlock = (opts: {
    kind: "M" | "MS" | "A" | "AL" | "MA" | "MAL"
    suc: Sucursal; hM: number; hA: number; hAL: number; hMS: number
  }): DayBlock => {
    const { kind, suc, hM, hA, hAL, hMS } = opts
    if (kind==="M")  return { morning:true, afternoon:false, morningStart:suc.morningStart, morningEnd:suc.morningEnd, hours:hM }
    if (kind==="MS") return { morning:true, afternoon:false, morningStart:suc.morningStart, morningEnd:addMin(suc.morningEnd,-30), hours:hMS }
    if (kind==="A")  return { morning:false, afternoon:true, afternoonStart:suc.afternoonStart, afternoonEnd:suc.afternoonEnd, hours:hA }
    if (kind==="AL") return { morning:false, afternoon:true, afternoonStart:addMin(suc.afternoonStart,60), afternoonEnd:suc.afternoonEnd, hours:hAL }
    if (kind==="MA") return { morning:true, afternoon:true, morningStart:suc.morningStart, morningEnd:suc.morningEnd, afternoonStart:suc.afternoonStart, afternoonEnd:suc.afternoonEnd, hours:hM+hA }
    return { morning:true, afternoon:true, morningStart:suc.morningStart, morningEnd:suc.morningEnd, afternoonStart:addMin(suc.afternoonStart,60), afternoonEnd:suc.afternoonEnd, hours:hM+hAL }
  }

  const recalcBlock = (b: DayBlock) => {
    let h = 0
    if (b.morning && b.morningStart && b.morningEnd) h += hoursBetween(b.morningStart, b.morningEnd)
    if (b.afternoon && b.afternoonStart && b.afternoonEnd) h += hoursBetween(b.afternoonStart, b.afternoonEnd)
    b.hours = Number(h.toFixed(2))
  }

  // cobertura por día (contar turnos completos)
  function countFullMorning(dayMap: Record<string, DayBlock>, suc: Sucursal) {
    return Object.values(dayMap).filter(b => b.morning && (b.morningEnd ?? suc.morningEnd) === suc.morningEnd).length
  }
  function countFullAfternoon(dayMap: Record<string, DayBlock>, suc: Sucursal) {
    return Object.values(dayMap).filter(b => b.afternoon && (b.afternoonStart ?? suc.afternoonStart) === suc.afternoonStart).length
  }

  const generate = () => {
    setIsGenerating(true)
    setTimeout(() => {
      const out: Schedule[] = []

      // agrupar por sucursal
      const bySucursal = employees.reduce((acc, e) => {
        (acc[e.sucursal] ||= []).push(e)
        return acc
      }, {} as Record<string, Employee[]>)

      Object.entries(bySucursal).forEach(([sucId, emps]) => {
        const suc = sucursales.find(s => s.id === sucId)
        if (!suc) return

        // mes
        const [Y,M] = (month ?? new Date().toISOString().slice(0,7)).split("-").map(Number)
        const dates = monthDates(Y, M-1) // L–S
        const weekIds = Array.from(new Set(dates.map(d=>d.weekId)))

        // duraciones
        const hM  = hoursBetween(suc.morningStart, suc.morningEnd)
        const hMS = hoursBetween(suc.morningStart, addMin(suc.morningEnd,-30))
        const hA  = hoursBetween(suc.afternoonStart, suc.afternoonEnd)
        const hAL = hoursBetween(addMin(suc.afternoonStart,60), suc.afternoonEnd)

        // metas
        const TARGET_WEEK_MIN = 32*60
        const BAND_LOW  = 31.5*60
        const BAND_HIGH = 32.5*60
        const TARGET_MONTH_MIN = weekIds.length * TARGET_WEEK_MIN

        const perShiftCap = (n: number) =>
          fixedCapacityPerShift ? Math.min(n, Math.max(1, fixedCapacityPerShift)) : Math.min(n, Math.max(1, n-1))

        // estado
        type EmpState = {
          id: string
          name: string
          totalMonthMin: number
          weekMin: Record<string, number>
          byDate: Record<string, DayBlock|undefined>
          lastDoubleDay: string | null
        }
        const E: Record<string, EmpState> = {}
        emps.forEach(e => E[e.id] = {
          id: e.id, name: e.name,
          totalMonthMin: 0,
          weekMin: Object.fromEntries(weekIds.map(w=>[w,0])),
          byDate: {},
          lastDoubleDay: null
        })

        const needWeek  = (id: string, w: string) => TARGET_WEEK_MIN - E[id].weekMin[w]
        const needMonth = (id: string) => TARGET_MONTH_MIN  - E[id].totalMonthMin

        // --- PRE-PASO: SÁBADOS OBLIGATORIOS (todos trabajan sábado con 1 turno) ---
        const saturdays = dates.filter(d => d.dow === 6) // 6 = Sábado

        const addMorning = (empId: string, dIso: string) => {
          const ex = E[empId].byDate[dIso]
          if (!ex) {
            E[empId].byDate[dIso] = makeBlock({ kind: "M", suc, hM, hA, hAL, hMS })
          } else if (!ex.morning) {
            ex.morning = true; ex.morningStart = suc.morningStart; ex.morningEnd = suc.morningEnd; recalcBlock(ex)
          }
          E[empId].totalMonthMin += hM * 60
          const w = dates.find(x => x.iso === dIso)!.weekId
          E[empId].weekMin[w] += hM * 60
        }

        const addAfternoon = (empId: string, dIso: string) => {
          const ex = E[empId].byDate[dIso]
          if (!ex) {
            E[empId].byDate[dIso] = makeBlock({ kind: "A", suc, hM, hA, hAL, hMS })
          } else if (!ex.afternoon) {
            ex.afternoon = true; ex.afternoonStart = suc.afternoonStart; ex.afternoonEnd = suc.afternoonEnd; recalcBlock(ex)
          }
          E[empId].totalMonthMin += hA * 60
          const w = dates.find(x => x.iso === dIso)!.weekId
          E[empId].weekMin[w] += hA * 60
        }

        saturdays.forEach(d => {
          const shuffled = [...emps].sort(() => Math.random() - 0.5)
          const capSat = Math.max(1, Math.ceil(emps.length / 2)) // sin "todos" a la vez
          const morningIds   = shuffled.slice(0, capSat).map(e => e.id)
          const afternoonIds = shuffled.slice(capSat, Math.min(emps.length, capSat * 2)).map(e => e.id)
          morningIds.forEach(id => addMorning(id, d.iso))
          afternoonIds.forEach(id => addAfternoon(id, d.iso))
        })

        // -------- Asignación base (fecha/slot) --------
        dates.forEach(d => {
          if (d.dow === 6) return // sábado ya resuelto

          const cap = perShiftCap(emps.length)
          const dayCount: Record<string, number> = Object.fromEntries(emps.map(x=>[x.id,0]))

          const assign = (kind: "M"|"A") => {
            let placed = 0
            while (placed < cap) {
              const cands = emps.filter(e => {
                const blk = E[e.id].byDate[d.iso]
                const hasM = blk?.morning ?? false
                const hasA = blk?.afternoon ?? false
                if (kind==="M" && hasM) return false
                if (kind==="A" && hasA) return false
                if (dayCount[e.id] >= 2) return false
                if (forbidConsecutiveDoubles && E[e.id].lastDoubleDay) {
                  const prev = new Date(d.date); prev.setDate(prev.getDate()-1)
                  if (iso(prev) === E[e.id].lastDoubleDay && dayCount[e.id]===1) return false
                }
                return true
              })
              if (!cands.length) break

              // peso por déficit semanal + mensual + ruido
              const chosen = cands
                .map(e => ({ e, w: Math.max(0, needWeek(e.id, d.weekId)) + Math.max(0, needMonth(e.id)) + Math.random()*300 }))
                .sort((a,b)=> b.w - a.w)[0].e

              const existing = E[chosen.id].byDate[d.iso]
              if (!existing) {
                E[chosen.id].byDate[d.iso] = makeBlock({ kind: kind==="M" ? "M" : "A", suc, hM, hA, hAL, hMS })
              } else {
                if (kind==="M") { existing.morning = true; existing.morningStart=suc.morningStart; existing.morningEnd=suc.morningEnd }
                else { existing.afternoon = true; existing.afternoonStart=suc.afternoonStart; existing.afternoonEnd=suc.afternoonEnd }
                recalcBlock(existing)
              }

              dayCount[chosen.id] += 1
              const inc = (kind==="M" ? hM : hA) * 60
              E[chosen.id].totalMonthMin += inc
              E[chosen.id].weekMin[d.weekId] += inc
              if (dayCount[chosen.id] >= 2) E[chosen.id].lastDoubleDay = d.iso

              placed++
            }
          }

          assign("M")
          assign("A")
        })

        // -------- Afinado semanal a bandas --------
        const blocksByDate = (isoDate: string) => {
          const map: Record<string, DayBlock> = {}
          Object.values(E).forEach(st => { const b = st.byDate[isoDate]; if (b) map[st.id] = b })
          return map
        }

        weekIds.forEach(wid => {
          const weekIsos = dates.filter(x => x.weekId===wid).map(x=>x.iso)

          const sumWeek = (id: string) =>
            weekIsos.reduce((s,isoDate)=>{
              const b = E[id].byDate[isoDate]
              return s + (b ? b.hours*60 : 0)
            }, 0)

          emps.forEach(emp => {
            let cur = sumWeek(emp.id)
            let guard = 400
            while (guard-- > 0 && (cur < BAND_LOW - 0.01 || cur > BAND_HIGH + 0.01)) {
              let done = false

              if (cur > BAND_HIGH + 0.01) {
                // recortar: A->AL si no rompe apertura de tarde
                for (const isoDate of weekIsos) {
                  const b = E[emp.id].byDate[isoDate]; if (!b) continue
                  const dayMap = blocksByDate(isoDate)
                  if (b.afternoon && (b.afternoonStart ?? suc.afternoonStart) === suc.afternoonStart && countFullAfternoon(dayMap, suc) > 1) {
                    b.afternoonStart = addMin(suc.afternoonStart, 60); recalcBlock(b)
                    cur -= 60; E[emp.id].totalMonthMin -= 60; E[emp.id].weekMin[wid] -= 60
                    done = true; break
                  }
                }
                if (!done) {
                  // M->MS si no rompe cierre de mañana
                  for (const isoDate of weekIsos) {
                    const b = E[emp.id].byDate[isoDate]; if (!b) continue
                    const dayMap = blocksByDate(isoDate)
                    if (b.morning && (b.morningEnd ?? suc.morningEnd) === suc.morningEnd && countFullMorning(dayMap, suc) > 1) {
                      b.morningEnd = addMin(suc.morningEnd, -30); recalcBlock(b)
                      cur -= 30; E[emp.id].totalMonthMin -= 30; E[emp.id].weekMin[wid] -= 30
                      done = true; break
                    }
                  }
                }
              } else {
                // expandir: AL->A, luego MS->M
                for (const isoDate of weekIsos) {
                  const b = E[emp.id].byDate[isoDate]; if (!b) continue
                  if (b.afternoon && (b.afternoonStart ?? "") === addMin(suc.afternoonStart,60)) {
                    b.afternoonStart = suc.afternoonStart; recalcBlock(b)
                    cur += 60; E[emp.id].totalMonthMin += 60; E[emp.id].weekMin[wid] += 60
                    done = true; break
                  }
                }
                if (!done) {
                  for (const isoDate of weekIsos) {
                    const b = E[emp.id].byDate[isoDate]; if (!b) continue
                    if (b.morning && (b.morningEnd ?? "") === addMin(suc.morningEnd,-30)) {
                      b.morningEnd = suc.morningEnd; recalcBlock(b)
                      cur += 30; E[emp.id].totalMonthMin += 30; E[emp.id].weekMin[wid] += 30
                      done = true; break
                    }
                  }
                }
              }
              if (!done) break
            }
          })
        })

        // -------- Balance mensual: total exacto = 32 * #semanas --------
        emps.forEach(emp => {
          let cur = E[emp.id].totalMonthMin
          let guard = 600
          while (guard-- > 0 && Math.abs(cur - TARGET_MONTH_MIN) > 0.01) {
            let moved = false
            if (cur > TARGET_MONTH_MIN + 0.01) {
              const richWeeks = weekIds.filter(w => E[emp.id].weekMin[w] >= BAND_HIGH - 0.01)
              for (const w of richWeeks) {
                const weekIsos = dates.filter(x=>x.weekId===w).map(x=>x.iso)
                for (const isoDate of weekIsos) {
                  const b = E[emp.id].byDate[isoDate]; if (!b) continue
                  const dayMap = blocksByDate(isoDate)
                  if (b.afternoon && (b.afternoonStart ?? suc.afternoonStart) === suc.afternoonStart && countFullAfternoon(dayMap, suc) > 1) {
                    b.afternoonStart = addMin(suc.afternoonStart,60); recalcBlock(b)
                    cur -= 60; E[emp.id].totalMonthMin = cur; E[emp.id].weekMin[w] -= 60; moved = true; break
                  }
                }
                if (moved) break
                for (const isoDate of weekIsos) {
                  const b = E[emp.id].byDate[isoDate]; if (!b) continue
                  const dayMap = blocksByDate(isoDate)
                  if (b.morning && (b.morningEnd ?? suc.morningEnd) === suc.morningEnd && countFullMorning(dayMap, suc) > 1) {
                    b.morningEnd = addMin(suc.morningEnd,-30); recalcBlock(b)
                    cur -= 30; E[emp.id].totalMonthMin = cur; E[emp.id].weekMin[w] -= 30; moved = true; break
                  }
                }
                if (moved) break
              }
              if (!moved) break
            } else {
              const poorWeeks = weekIds.filter(w => E[emp.id].weekMin[w] <= BAND_LOW + 0.01)
              for (const w of poorWeeks) {
                const weekIsos = dates.filter(x=>x.weekId===w).map(x=>x.iso)
                for (const isoDate of weekIsos) {
                  const b = E[emp.id].byDate[isoDate]; if (!b) continue
                  if (b.afternoon && (b.afternoonStart ?? "") === addMin(suc.afternoonStart,60)) {
                    b.afternoonStart = suc.afternoonStart; recalcBlock(b)
                    cur += 60; E[emp.id].totalMonthMin = cur; E[emp.id].weekMin[w] += 60; moved = true; break
                  }
                }
                if (moved) break
                for (const isoDate of weekIsos) {
                  const b = E[emp.id].byDate[isoDate]; if (!b) continue
                  if (b.morning && (b.morningEnd ?? "") === addMin(suc.morningEnd,-30)) {
                    b.morningEnd = suc.morningEnd; recalcBlock(b)
                    cur += 30; E[emp.id].totalMonthMin = cur; E[emp.id].weekMin[w] += 30; moved = true; break
                  }
                }
                if (moved) break
              }
              if (!moved) break
            }
          }
        })

        // Emitir schedules
        Object.values(E).forEach(st => {
          const sched: Record<string, DaySchedule> = {}
          Object.entries(st.byDate).forEach(([k,v]) => {
            if (!v) return
            sched[k] = {
              morning: v.morning,
              afternoon: v.afternoon,
              morningStart: v.morningStart,
              morningEnd: v.morningEnd,
              afternoonStart: v.afternoonStart,
              afternoonEnd: v.afternoonEnd,
              hours: Number(v.hours.toFixed(2)),
            }
          })
          out.push({
            employeeId: st.id,
            employeeName: st.name,
            sucursal: suc.id,
            weeklyHours: 32, // mantené si tu tipo lo necesita
            schedule: sched,
          } as Schedule)
        })
      })

      setSchedules(out)
      setIsGenerating(false)
    }, 300)
  }

  if (employees.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert><AlertCircle className="h-4 w-4" /><AlertDescription>No hay empleados registrados.</AlertDescription></Alert>
        </CardContent>
      </Card>
    )
  }

  // Nota: estadísticas por sucursal no usadas en esta versión del UI

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Generador Mensual (promedio 32 h/semana)
          </CardTitle>
          <CardDescription>
            Mes completo (L–S). Cada semana queda en 31.5–32.5 h; el total mensual por empleado se ajusta a 32×semanas. Cobertura en cierre de mañana y apertura de tarde. Sábados: todos trabajan.
          </CardDescription>
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
              <p className="text-xs text-muted-foreground">Máx 2 turnos/día • Nunca todos • {forbidConsecutiveDoubles ? "Sin dobles seguidos" : "Permite dobles seguidos"}</p>
            </div>
          </div>

          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>Bandas semanales 31.5–32.5 h. Cobertura dura (no se rompe 13:30 ni 17:00 según sucursal). Sábados obligatorios.</AlertDescription>
          </Alert>

          <Button onClick={generate} disabled={isGenerating} size="lg" className="w-full">
            {isGenerating ? <>Generando…</> : <><Shuffle className="h-4 w-4 mr-2" />Generar Mes (prom. 32 h/sem)</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
