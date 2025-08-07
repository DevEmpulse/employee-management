"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, Shuffle, AlertCircle, Users, Clock } from 'lucide-react'
import type { Employee, Sucursal, Schedule } from "@/app/page"

interface ScheduleGeneratorProps {
  employees: Employee[]
  sucursales: Sucursal[]
  schedules: Schedule[]
  setSchedules: (schedules: Schedule[]) => void
}

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]

// Utilidades de tiempo
const t2m = (t: string) => {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}
const m2t = (mins: number) => {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}
const addMin = (t: string, mins: number) => m2t(t2m(t) + mins)
const hoursBetween = (start: string, end: string) => (t2m(end) - t2m(start)) / 60

type DayBlock = {
  morning: boolean
  afternoon: boolean
  hours: number
  morningStart?: string
  morningEnd?: string
  afternoonStart?: string
  afternoonEnd?: string
}

export function ScheduleGenerator({ employees, sucursales, setSchedules }: ScheduleGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const makeBlock = (opts: {
    kind: "M" | "MS" | "A" | "AL" | "MA" | "MAL"
    sucursal: Sucursal
    hM: number
    hA: number
    hAL: number
    hMS: number
  }): DayBlock => {
    const { kind, sucursal, hM, hA, hAL, hMS } = opts
    if (kind === "M") {
      return {
        morning: true,
        afternoon: false,
        morningStart: sucursal.morningStart,
        morningEnd: sucursal.morningEnd,
        hours: hM,
      }
    }
    if (kind === "MS") {
      // Mañana corta 9-13:00
      return {
        morning: true,
        afternoon: false,
        morningStart: sucursal.morningStart,
        morningEnd: addMin(sucursal.morningEnd, -30),
        hours: hMS,
      }
    }
    if (kind === "A") {
      return {
        morning: false,
        afternoon: true,
        afternoonStart: sucursal.afternoonStart,
        afternoonEnd: sucursal.afternoonEnd,
        hours: hA,
      }
    }
    if (kind === "AL") {
      // Tarde atrasada 18-21
      return {
        morning: false,
        afternoon: true,
        afternoonStart: addMin(sucursal.afternoonStart, 60),
        afternoonEnd: sucursal.afternoonEnd,
        hours: hAL,
      }
    }
    if (kind === "MA") {
      return {
        morning: true,
        afternoon: true,
        morningStart: sucursal.morningStart,
        morningEnd: sucursal.morningEnd,
        afternoonStart: sucursal.afternoonStart,
        afternoonEnd: sucursal.afternoonEnd,
        hours: hM + hA,
      }
    }
    // MAL
    return {
      morning: true,
      afternoon: true,
      morningStart: sucursal.morningStart,
      morningEnd: sucursal.morningEnd,
      afternoonStart: addMin(sucursal.afternoonStart, 60),
      afternoonEnd: sucursal.afternoonEnd,
      hours: hM + hAL,
    }
  }

  const recalcBlock = (b: DayBlock) => {
    let h = 0
    if (b.morning && b.morningStart && b.morningEnd) h += hoursBetween(b.morningStart, b.morningEnd)
    if (b.afternoon && b.afternoonStart && b.afternoonEnd) h += hoursBetween(b.afternoonStart, b.afternoonEnd)
    b.hours = Number(h.toFixed(2))
  }

  const generateSchedules = () => {
    setIsGenerating(true)
    setTimeout(() => {
      const newSchedules: Schedule[] = []

      // Agrupar por sucursal
      const bySucursal = employees.reduce((acc, e) => {
        if (!acc[e.sucursal]) acc[e.sucursal] = []
        acc[e.sucursal].push(e)
        return acc
      }, {} as Record<string, Employee[]>)

      Object.entries(bySucursal).forEach(([sucursalId, list]) => {
        const sucursal = sucursales.find((s) => s.id === sucursalId)
        if (!sucursal) return

        // Duraciones (h)
        const hM = hoursBetween(sucursal.morningStart, sucursal.morningEnd) // 4.5
        const hMS = hoursBetween(sucursal.morningStart, addMin(sucursal.morningEnd, -30)) // 4.0
        const hA = hoursBetween(sucursal.afternoonStart, sucursal.afternoonEnd) // 4.0
        const hAL = hoursBetween(addMin(sucursal.afternoonStart, 60), sucursal.afternoonEnd) // 3.0
        const targetWeekMin = 32 * 60

        const totalEmployees = list.length
        const perShiftCap = Math.min(totalEmployees, Math.max(1, totalEmployees - 1)) // nunca todos

        // Estado por empleado
        const empMap: Record<
          string,
          Schedule & { schedule: Record<string, DayBlock>; _totalMin: number }
        > = {}
        list.forEach((e) => {
          empMap[e.id] = {
            employeeId: e.id,
            employeeName: e.name,
            sucursal: e.sucursal,
            weeklyHours: 32,
            schedule: {},
            _totalMin: 0,
          } as Schedule & { schedule: Record<string, DayBlock>; _totalMin: number }
        })

        const getTotalMin = (id: string) =>
          Math.round(Object.values(empMap[id].schedule).reduce((s, d) => s + d.hours * 60, 0))

        // Asignación base por día con cobertura y rotación
        DAYS.forEach((day) => {
          // Orden por menos minutos acumulados
          const sorted = [...list].sort((a, b) => getTotalMin(a.id) - getTotalMin(b.id))

          // Mañana: perShiftCap empleados
          const morningIds = sorted.slice(0, perShiftCap).map((e) => e.id)

          // Aplicar mañana
          morningIds.forEach((id) => {
            empMap[id].schedule[day] = makeBlock({ kind: "M", sucursal, hM, hA, hAL, hMS })
          })

          // Tarde: priorizar los que NO estuvieron en mañana
          const notInMorning = sorted.filter((e) => !morningIds.includes(e.id))
          const needA = perShiftCap
          const chosenA: string[] = []

          // 1) Agregar los que no trabajaron mañana hasta llenar cupo
          for (const e of notInMorning) {
            if (chosenA.length >= needA) break
            chosenA.push(e.id)
          }
          // 2) Si falta, completar con quienes sí trabajaron mañana pero con menos minutos
          if (chosenA.length < needA) {
            const candidates = sorted.filter((e) => morningIds.includes(e.id) && !chosenA.includes(e.id))
            for (const e of candidates) {
              if (chosenA.length >= needA) break
              chosenA.push(e.id)
            }
          }

          // Aplicar tarde
          chosenA.forEach((id) => {
            const existing = empMap[id].schedule[day]
            if (existing) {
              // ya tiene mañana → doble turno
              existing.afternoon = true
              existing.afternoonStart = sucursal.afternoonStart
              existing.afternoonEnd = sucursal.afternoonEnd
              recalcBlock(existing)
            } else {
              empMap[id].schedule[day] = makeBlock({ kind: "A", sucursal, hM, hA, hAL, hMS })
            }
          })

          // Garantía de apertura y cierre: ya cumplida porque siempre hay perShiftCap >= 1 en M y A
          // Garantía 6 días: con la lógica anterior, todos tienen al menos un turno por día.
        })

        // Ajustes para llegar a 32h exactas por empleado sin romper cupos ni cobertura
        const dayAfternoonSets: Record<string, Set<string>> = {}
        const dayMorningSets: Record<string, Set<string>> = {}
        DAYS.forEach((day) => {
          const am = new Set<string>()
          const pm = new Set<string>()
          list.forEach((e) => {
            const b = empMap[e.id].schedule[day]
            if (b?.morning) am.add(e.id)
            if (b?.afternoon) pm.add(e.id)
          })
          dayMorningSets[day] = am
          dayAfternoonSets[day] = pm
        })

        // Funciones de ayuda de ajuste
        const canAddAfternoonFor = (empId: string, day: string) => {
          const b = empMap[empId].schedule[day]
          // Debe tener mañana sin tarde para poder añadir y el turno tarde debe estar lleno (haremos swap)
          return b?.morning && !b.afternoon && dayAfternoonSets[day].size === perShiftCap
        }
        const swapAfternoonTo = (toEmpId: string, day: string): boolean => {
          // Buscar alguien con doble turno ese día para quitarle la tarde y dársela a toEmpId
          const pmIds = Array.from(dayAfternoonSets[day])
          // Ordenar candidatos por mayor total de minutos (quien más tenga cede primero)
          pmIds.sort((a, b) => getTotalMin(b) - getTotalMin(a))
          for (const fromId of pmIds) {
            const bFrom = empMap[fromId].schedule[day]
            if (bFrom && bFrom.morning && bFrom.afternoon) {
              // quitar tarde a fromId
              bFrom.afternoon = false
              bFrom.afternoonStart = undefined
              bFrom.afternoonEnd = undefined
              recalcBlock(bFrom)
              dayAfternoonSets[day].delete(fromId)

              // dar tarde a toEmpId (A por defecto)
              const bTo = empMap[toEmpId].schedule[day]
              if (bTo) {
                bTo.afternoon = true
                bTo.afternoonStart = sucursal.afternoonStart
                bTo.afternoonEnd = sucursal.afternoonEnd
                recalcBlock(bTo)
              } else {
                empMap[toEmpId].schedule[day] = makeBlock({ kind: "A", sucursal, hM, hA, hAL, hMS })
              }
              dayAfternoonSets[day].add(toEmpId)
              return true
            }
          }
          return false
        }

        // Ajustar cada empleado a 32h exactas (1920 min)
        list.forEach((e) => {
          // 1) Calcular total actual
          let totalMin = getTotalMin(e.id)

          // 2) Si faltan minutos: intentar ganar por swaps de tardes (A) desde dobles turnos
          while (totalMin < targetWeekMin) {
            let progressed = false

            // Añadir tarde completa por swap si es posible
            for (const day of DAYS) {
              if (totalMin >= targetWeekMin) break
              if (canAddAfternoonFor(e.id, day)) {
                const ok = swapAfternoonTo(e.id, day)
                if (ok) {
                  totalMin = getTotalMin(e.id)
                  progressed = true
                }
              }
            }
            if (totalMin >= targetWeekMin) break

            // No hubo swaps posibles; usar incrementos finos:
            // Preferir AL->A (+60) si ya tiene alguna AL
            const daysWithAL: string[] = []
            DAYS.forEach((day) => {
              const b: DayBlock | undefined = empMap[e.id].schedule[day]
              if (b?.afternoon && b.afternoonStart === addMin(sucursal.afternoonStart, 60)) {
                daysWithAL.push(day)
              }
            })
            if (daysWithAL.length > 0 && targetWeekMin - totalMin >= 60 - 0.01) {
              const d = daysWithAL[0]
              const b = empMap[e.id].schedule[d]!
              b.afternoonStart = sucursal.afternoonStart
              recalcBlock(b)
              totalMin = getTotalMin(e.id)
              progressed = true
            } else {
              // MS->M (+30)
              const daysWithMS: string[] = []
              DAYS.forEach((day) => {
                const b: DayBlock | undefined = empMap[e.id].schedule[day]
                if (b?.morning && b.morningEnd === addMin(sucursal.morningEnd, -30) && (!b.afternoon || b.afternoon)) {
                  daysWithMS.push(day)
                }
              })
              if (daysWithMS.length > 0) {
                const d = daysWithMS[0]
                const b = empMap[e.id].schedule[d]!
                b.morningEnd = sucursal.morningEnd
                recalcBlock(b)
                totalMin = getTotalMin(e.id)
                progressed = true
              }
            }

            if (!progressed) {
              // Como último recurso, convertir un día con mañana en MAL (añadir tarde tardía) si hay cupo por swap
              let done = false
              for (const day of DAYS) {
                if (totalMin >= targetWeekMin) break
                // Si tiene mañana y no tarde, intentar swap pero con AL (para subir +180)
                const b = empMap[e.id].schedule[day]
                if (b?.morning && !b.afternoon && dayAfternoonSets[day].size === perShiftCap) {
                  // quitar tarde a alguien con doble turno y colocar AL a este empleado
                  const pmIds = Array.from(dayAfternoonSets[day]).sort((a, b) => getTotalMin(b) - getTotalMin(a))
                  const donor = pmIds.find((id) => {
                    const db = empMap[id].schedule[day]
                    return db?.morning && db.afternoon
                  })
                  if (donor) {
                    // donar
                    const db = empMap[donor].schedule[day]!
                    db.afternoon = false
                    db.afternoonStart = undefined
                    db.afternoonEnd = undefined
                    recalcBlock(db)
                    dayAfternoonSets[day].delete(donor)

                    // receptor con AL
                    b.afternoon = true
                    b.afternoonStart = addMin(sucursal.afternoonStart, 60)
                    b.afternoonEnd = sucursal.afternoonEnd
                    recalcBlock(b)
                    dayAfternoonSets[day].add(e.id)
                    totalMin = getTotalMin(e.id)
                    done = true
                    break
                  }
                }
              }
              if (!done) break
            }
          }

          // 3) Si sobran minutos: reducir con A->AL (-60) y M->MS (-30)
          totalMin = getTotalMin(e.id)
          while (totalMin > targetWeekMin + 1) {
            let reduced = false
            // A -> AL
            for (const day of DAYS) {
              if (totalMin <= targetWeekMin + 1) break
              const b = empMap[e.id].schedule[day]
              if (b?.afternoon && b.afternoonStart === sucursal.afternoonStart) {
                b.afternoonStart = addMin(sucursal.afternoonStart, 60)
                recalcBlock(b)
                totalMin = getTotalMin(e.id)
                reduced = true
              }
            }
            if (totalMin <= targetWeekMin + 1) break
            if (reduced) continue

            // M -> MS
            for (const day of DAYS) {
              if (totalMin <= targetWeekMin + 1) break
              const b = empMap[e.id].schedule[day]
              if (b?.morning && b.morningEnd === sucursal.morningEnd) {
                b.morningEnd = addMin(sucursal.morningEnd, -30)
                recalcBlock(b)
                totalMin = getTotalMin(e.id)
                reduced = true
              }
            }
            if (!reduced) break
          }
        })

        // Redondeo y push
        Object.values(empMap).forEach((s) => {
          // Ajuste final numérico
          Object.values(s.schedule).forEach((d) => (d.hours = Number(d.hours.toFixed(2))))
          newSchedules.push(s as unknown as Schedule)
        })
      })

      setSchedules(newSchedules)
      setIsGenerating(false)
    }, 600)
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

  // Estadísticas por sucursal
  const stats = sucursales.map((s) => {
    const count = employees.filter((e) => e.sucursal === s.id).length
    return {
      ...s,
      employeeCount: count,
      perShiftCap: Math.min(count, Math.max(1, count - 1)),
    }
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Generador de Horarios con Cobertura y Equidad
          </CardTitle>
          <CardDescription>
            6 días por semana, 32h exactas, apertura 9:00-13:30 y cierre 17:00-21:00. Ajustes permitidos: 18:00-21:00 y
            9:00-13:00.
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
              <p className="text-2xl font-bold">32</p>
              <p className="text-sm text-muted-foreground">Horas/empleado</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Cobertura por Sucursal
            </h4>
            <div className="space-y-2">
              {stats.map((s) => (
                <div key={s.id} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{s.name}</p>
                      <div className="text-sm text-muted-foreground">
                        Capacidad por turno: {s.perShiftCap} • Nunca todos al mismo tiempo
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">{s.employeeCount} empleados</Badge>
                      <Badge variant="default">{s.perShiftCap} por turno</Badge>
                    </div>
                  </div>
                  <div className="grid gap-1 md:grid-cols-2 text-xs text-muted-foreground mt-2">
                    <div>
                      Apertura: {s.morningStart} - {s.morningEnd} (M) • Variante: 9:00-13:00
                    </div>
                    <div>
                      Cierre: {s.afternoonStart} - {s.afternoonEnd} (A) • Variante: 18:00-21:00
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Reglas:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Todos trabajan 6 días (L-S), mínimo 1 persona en apertura y en cierre</li>
                <li>Nunca todos los empleados a la vez: máximo total-1 por turno</li>
                <li>32 horas exactas por semana; ajustes finos: tarde 18-21 (-1h) y mañana 9-13 (-0.5h)</li>
                <li>Rotación equitativa: se prioriza al que menos minutos acumula</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Button onClick={generateSchedules} disabled={isGenerating} className="w-full" size="lg">
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Generando horarios…
              </>
            ) : (
              <>
                <Shuffle className="h-4 w-4 mr-2" />
                Generar Horarios (32h + Cobertura)
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
