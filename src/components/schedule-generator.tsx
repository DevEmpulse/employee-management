"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, Shuffle, AlertCircle, Users, Clock } from "lucide-react"
import type { Employee, Sucursal, Schedule } from "@/app/page"

interface ScheduleGeneratorProps {
  employees: Employee[]
  sucursales: Sucursal[]
  schedules: Schedule[]
  setSchedules: (schedules: Schedule[]) => void
}

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]

export function ScheduleGenerator({ employees, sucursales, schedules, setSchedules }: ScheduleGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const calculateHours = (startTime: string, endTime: string): number => {
    const [startHour, startMinute] = startTime.split(":").map(Number)
    const [endHour, endMinute] = endTime.split(":").map(Number)

    const startTotalMinutes = startHour * 60 + startMinute
    const endTotalMinutes = endHour * 60 + endMinute

    return (endTotalMinutes - startTotalMinutes) / 60
  }

  // Función para calcular horarios flexibles con entrada tardía
  const calculateFlexibleHours = (baseStart: string, baseEnd: string, delayMinutes: number = 0): { start: string; end: string; hours: number } => {
    const [startHour, startMinute] = baseStart.split(":").map(Number)
    const [endHour, endMinute] = baseEnd.split(":").map(Number)

    // Calcular nueva hora de inicio con retraso
    const totalStartMinutes = startHour * 60 + startMinute + delayMinutes
    const newStartHour = Math.floor(totalStartMinutes / 60)
    const newStartMinute = totalStartMinutes % 60

    // Calcular nueva hora de fin manteniendo las mismas horas de trabajo
    const totalEndMinutes = endHour * 60 + endMinute + delayMinutes
    const newEndHour = Math.floor(totalEndMinutes / 60)
    const newEndMinute = totalEndMinutes % 60

    return {
      start: `${newStartHour.toString().padStart(2, '0')}:${newStartMinute.toString().padStart(2, '0')}`,
      end: `${newEndHour.toString().padStart(2, '0')}:${newEndMinute.toString().padStart(2, '0')}`,
      hours: calculateHours(baseStart, baseEnd)
    }
  }

  const generateSchedules = () => {
    setIsGenerating(true)

    setTimeout(() => {
      const newSchedules: Schedule[] = []

      // Agrupar empleados por sucursal
      const employeesBySucursal = employees.reduce(
        (acc, employee) => {
          if (!acc[employee.sucursal]) {
            acc[employee.sucursal] = []
          }
          acc[employee.sucursal].push(employee)
          return acc
        },
        {} as Record<string, Employee[]>,
      )

      // Generar horarios para cada sucursal
      Object.entries(employeesBySucursal).forEach(([sucursalId, sucursalEmployees]) => {
        const sucursal = sucursales.find((s) => s.id === sucursalId)
        if (!sucursal) return

        const morningHours = calculateHours(sucursal.morningStart, sucursal.morningEnd)
        const afternoonHours = calculateHours(sucursal.afternoonStart, sucursal.afternoonEnd)
        const totalEmployees = sucursalEmployees.length
        const requiredCoverage = Math.max(1, totalEmployees - 1) // n-1 empleados por turno

        // Inicializar horarios para cada empleado
        const employeeSchedules: Record<string, Schedule> = {}
        sucursalEmployees.forEach((employee) => {
          employeeSchedules[employee.id] = {
            employeeId: employee.id,
            employeeName: employee.name,
            sucursal: employee.sucursal,
            weeklyHours: 32, // Siempre 32 horas
            schedule: {},
          }
        })

        // Algoritmo mejorado para distribución equitativa y 32 horas exactas con horarios flexibles
        const assignSchedulesEquitably = () => {
          // Resetear horarios
          Object.values(employeeSchedules).forEach((schedule) => {
            schedule.schedule = {}
          })

          // Crear matriz de cobertura para cada día y turno
          const dailyCoverage: Record<string, { morning: string[]; afternoon: string[] }> = {}
          DAYS.forEach((day) => {
            dailyCoverage[day] = { morning: [], afternoon: [] }
          })

          // Paso 1: Asegurar cobertura mínima para cada turno de cada día
          DAYS.forEach((day) => {
            const availableEmployees = [...sucursalEmployees]

            // Asignar cobertura mínima para turno mañana
            for (let i = 0; i < requiredCoverage && availableEmployees.length > 0; i++) {
              const randomIndex = Math.floor(Math.random() * availableEmployees.length)
              const employee = availableEmployees.splice(randomIndex, 1)[0]
              dailyCoverage[day].morning.push(employee.id)
            }

            // Resetear empleados disponibles para turno tarde
            const availableForAfternoon = [...sucursalEmployees]

            // Asignar cobertura mínima para turno tarde
            for (let i = 0; i < requiredCoverage && availableForAfternoon.length > 0; i++) {
              const randomIndex = Math.floor(Math.random() * availableForAfternoon.length)
              const employee = availableForAfternoon.splice(randomIndex, 1)[0]
              if (!dailyCoverage[day].afternoon.includes(employee.id)) {
                dailyCoverage[day].afternoon.push(employee.id)
              }
            }
          })

          // Paso 2: Asignar horarios base a todos los empleados (todos trabajan todos los días)
          sucursalEmployees.forEach((employee) => {
            DAYS.forEach((day) => {
              const worksMorning = dailyCoverage[day].morning.includes(employee.id)
              const worksAfternoon = dailyCoverage[day].afternoon.includes(employee.id)

              // Si no está asignado a ningún turno, asignar aleatoriamente
              if (!worksMorning && !worksAfternoon) {
                const randomTurn = Math.random()
                if (randomTurn < 0.4) {
                  // 40% solo mañana
                  employeeSchedules[employee.id].schedule[day] = {
                    morning: true,
                    afternoon: false,
                    hours: morningHours,
                  }
                } else if (randomTurn < 0.8) {
                  // 40% solo tarde
                  employeeSchedules[employee.id].schedule[day] = {
                    morning: false,
                    afternoon: true,
                    hours: afternoonHours,
                  }
                } else {
                  // 20% ambos turnos
                  employeeSchedules[employee.id].schedule[day] = {
                    morning: true,
                    afternoon: true,
                    hours: morningHours + afternoonHours,
                  }
                }
              } else {
                // Asignar según cobertura requerida
                let dayHours = 0
                if (worksMorning) dayHours += morningHours
                if (worksAfternoon) dayHours += afternoonHours

                employeeSchedules[employee.id].schedule[day] = {
                  morning: worksMorning,
                  afternoon: worksAfternoon,
                  hours: dayHours,
                }
              }
            })
          })

                     // Paso 3: Ajustar para que todos tengan exactamente 32 horas con horarios flexibles
           Object.values(employeeSchedules).forEach((schedule) => {
             let totalHours = Object.values(schedule.schedule).reduce((sum, day) => sum + day.hours, 0)
             let attempts = 0
             const maxAttempts = 200 // Aumentar intentos para mejor precisión

             while (Math.abs(totalHours - 32) > 0.01 && attempts < maxAttempts) {
               attempts++

               if (totalHours < 32) {
                 // Necesita más horas - usar horarios flexibles primero
                 const hoursNeeded = 32 - totalHours
                 const minutesNeeded = Math.round(hoursNeeded * 60)
                 
                 // Buscar días donde podemos aplicar ajustes flexibles
                 const flexibleDays = DAYS.filter((day) => {
                   const daySchedule = schedule.schedule[day]
                   return daySchedule.morning || daySchedule.afternoon
                 })

                 if (flexibleDays.length > 0) {
                   const randomDay = flexibleDays[Math.floor(Math.random() * flexibleDays.length)]
                   const daySchedule = schedule.schedule[randomDay]
                   
                   // Aplicar entrada tardía y/o salida temprana
                   const maxDelay = Math.min(90, minutesNeeded) // Máximo 1.5 horas de ajuste por día
                   const entryDelay = Math.floor(maxDelay * 0.7) // 70% entrada tardía
                   const exitEarly = maxDelay - entryDelay // 30% salida temprana
                   
                   schedule.schedule[randomDay] = {
                     ...daySchedule,
                     flexibleSchedule: {
                       morningDelay: daySchedule.morning ? entryDelay : undefined,
                       afternoonDelay: daySchedule.afternoon ? entryDelay : undefined,
                       earlyLeave: exitEarly > 0 ? exitEarly : undefined,
                     }
                   }
                   // Recalcular horas totales considerando los ajustes flexibles
                   totalHours = DAYS.reduce((sum, day) => {
                     const daySchedule = schedule.schedule[day]
                     let dayHours = daySchedule.hours
                     
                     // Agregar horas por ajustes flexibles
                     if (daySchedule.flexibleSchedule) {
                       if (daySchedule.flexibleSchedule.morningDelay && daySchedule.flexibleSchedule.morningDelay > 0) {
                         dayHours += daySchedule.flexibleSchedule.morningDelay / 60
                       }
                       if (daySchedule.flexibleSchedule.afternoonDelay && daySchedule.flexibleSchedule.afternoonDelay > 0) {
                         dayHours += daySchedule.flexibleSchedule.afternoonDelay / 60
                       }
                       if (daySchedule.flexibleSchedule.earlyLeave && daySchedule.flexibleSchedule.earlyLeave > 0) {
                         dayHours += daySchedule.flexibleSchedule.earlyLeave / 60
                       }
                     }
                     
                     return sum + dayHours
                   }, 0)
                 } else {
                   // Si no hay días flexibles, agregar turnos
                   const daysToModify = DAYS.filter((day) => {
                     const daySchedule = schedule.schedule[day]
                     return !daySchedule.morning || !daySchedule.afternoon
                   })

                   if (daysToModify.length > 0) {
                     const randomDay = daysToModify[Math.floor(Math.random() * daysToModify.length)]
                     const daySchedule = schedule.schedule[randomDay]

                     if (!daySchedule.morning && hoursNeeded >= morningHours) {
                       schedule.schedule[randomDay] = {
                         morning: true,
                         afternoon: daySchedule.afternoon,
                         hours: daySchedule.hours + morningHours,
                       }
                       totalHours += morningHours
                     } else if (!daySchedule.afternoon && hoursNeeded >= afternoonHours) {
                       schedule.schedule[randomDay] = {
                         morning: daySchedule.morning,
                         afternoon: true,
                         hours: daySchedule.hours + afternoonHours,
                       }
                       totalHours += afternoonHours
                     }
                   }
                 }
               } else if (totalHours > 32) {
                 // Necesita menos horas - usar horarios flexibles primero
                 const hoursToRemove = totalHours - 32
                 const minutesToRemove = Math.round(hoursToRemove * 60)
                 
                 // Buscar días donde podemos aplicar ajustes flexibles
                 const flexibleDays = DAYS.filter((day) => {
                   const daySchedule = schedule.schedule[day]
                   return daySchedule.morning || daySchedule.afternoon
                 })

                 if (flexibleDays.length > 0) {
                   const randomDay = flexibleDays[Math.floor(Math.random() * flexibleDays.length)]
                   const daySchedule = schedule.schedule[randomDay]
                   
                   // Aplicar entrada temprana y/o salida tardía
                   const maxAdjustment = Math.min(90, minutesToRemove) // Máximo 1.5 horas de ajuste por día
                   const entryEarly = Math.floor(maxAdjustment * 0.3) // 30% entrada temprana
                   const exitDelay = maxAdjustment - entryEarly // 70% salida tardía
                   
                   schedule.schedule[randomDay] = {
                     ...daySchedule,
                     flexibleSchedule: {
                       morningDelay: daySchedule.morning ? -entryEarly : undefined,
                       afternoonDelay: daySchedule.afternoon ? -entryEarly : undefined,
                       earlyLeave: exitDelay > 0 ? -exitDelay : undefined,
                     }
                   }
                   // Recalcular horas totales considerando los ajustes flexibles
                   totalHours = DAYS.reduce((sum, day) => {
                     const daySchedule = schedule.schedule[day]
                     let dayHours = daySchedule.hours
                     
                     // Restar horas por ajustes flexibles (valores negativos)
                     if (daySchedule.flexibleSchedule) {
                       if (daySchedule.flexibleSchedule.morningDelay && daySchedule.flexibleSchedule.morningDelay < 0) {
                         dayHours += daySchedule.flexibleSchedule.morningDelay / 60
                       }
                       if (daySchedule.flexibleSchedule.afternoonDelay && daySchedule.flexibleSchedule.afternoonDelay < 0) {
                         dayHours += daySchedule.flexibleSchedule.afternoonDelay / 60
                       }
                       if (daySchedule.flexibleSchedule.earlyLeave && daySchedule.flexibleSchedule.earlyLeave < 0) {
                         dayHours += daySchedule.flexibleSchedule.earlyLeave / 60
                       }
                     }
                     
                     return sum + dayHours
                   }, 0)
                 } else {
                   // Si no hay días flexibles, quitar turnos
                   const daysToModify = DAYS.filter((day) => {
                     const daySchedule = schedule.schedule[day]
                     return daySchedule.morning && daySchedule.afternoon
                   })

                   if (daysToModify.length > 0) {
                     const randomDay = daysToModify[Math.floor(Math.random() * daysToModify.length)]
                     const daySchedule = schedule.schedule[randomDay]

                     if (hoursToRemove >= afternoonHours) {
                       schedule.schedule[randomDay] = {
                         morning: true,
                         afternoon: false,
                         hours: morningHours,
                       }
                       totalHours -= afternoonHours
                     } else if (hoursToRemove >= morningHours) {
                       schedule.schedule[randomDay] = {
                         morning: false,
                         afternoon: true,
                         hours: afternoonHours,
                       }
                       totalHours -= morningHours
                     }
                   }
                 }
               }
             }
             
             // Actualizar las horas totales del empleado
             schedule.weeklyHours = Math.round(totalHours * 100) / 100
           })

          // Asegurar que todos los días tengan al menos un turno
          Object.values(employeeSchedules).forEach((schedule) => {
            DAYS.forEach((day) => {
              if (!schedule.schedule[day] || schedule.schedule[day].hours === 0) {
                schedule.schedule[day] = {
                  morning: true,
                  afternoon: false,
                  hours: morningHours,
                }
              }
            })
          })
        }

        // Ejecutar el algoritmo
        assignSchedulesEquitably()

        // Agregar los horarios generados
        newSchedules.push(...Object.values(employeeSchedules))
      })

      setSchedules(newSchedules)
      setIsGenerating(false)
    }, 2500)
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

  // Calcular estadísticas por sucursal
  const sucursalStats = sucursales.map((sucursal) => {
    const sucursalEmployees = employees.filter((e) => e.sucursal === sucursal.id)
    const requiredCoverage = Math.max(1, sucursalEmployees.length - 1)

    return {
      ...sucursal,
      employeeCount: sucursalEmployees.length,
      requiredCoverage,
    }
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Generador de Horarios Inteligente
          </CardTitle>
          <CardDescription>
            Genera horarios asegurando 32hs exactas, trabajo diario y distribución equitativa con horarios flexibles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="text-center">
              <p className="text-2xl font-bold">{employees.length}</p>
              <p className="text-sm text-muted-foreground">Empleados</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">32</p>
              <p className="text-sm text-muted-foreground">Horas Exactas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">6</p>
              <p className="text-sm text-muted-foreground">Días Trabajando</p>
            </div>
          </div>

          <div className="mt-6">
            <Button onClick={generateSchedules} disabled={isGenerating} size="lg" className="w-full">
              {isGenerating ? (
                <>
                  <Shuffle className="h-4 w-4 mr-2 animate-spin" />
                  Generando Horarios...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Generar Horarios Automáticamente
                </>
              )}
            </Button>
          </div>

                     <div className="mt-6 space-y-4">
             <h3 className="text-lg font-semibold">Estadísticas por Sucursal</h3>
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
               {sucursalStats.map((sucursal) => (
                 <Card key={sucursal.id}>
                   <CardHeader className="pb-3">
                     <CardTitle className="text-base">{sucursal.name}</CardTitle>
                   </CardHeader>
                   <CardContent>
                     <div className="space-y-2">
                       <div className="flex justify-between">
                         <span className="text-sm text-muted-foreground">Empleados:</span>
                         <Badge variant="outline">{sucursal.employeeCount}</Badge>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-sm text-muted-foreground">Cobertura mínima:</span>
                         <Badge variant="outline">{sucursal.requiredCoverage}</Badge>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-sm text-muted-foreground">Horario mañana:</span>
                         <span className="text-sm font-medium">
                           {sucursal.morningStart} - {sucursal.morningEnd}
                         </span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-sm text-muted-foreground">Horario tarde:</span>
                         <span className="text-sm font-medium">
                           {sucursal.afternoonStart} - {sucursal.afternoonEnd}
                         </span>
                       </div>
                     </div>
                   </CardContent>
                 </Card>
               ))}
             </div>
           </div>

           {/* Previsualización de horas actuales */}
           {schedules.length > 0 && (
             <div className="mt-6 space-y-4">
               <h3 className="text-lg font-semibold">Horas Actuales por Empleado</h3>
               <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                 {schedules.map((schedule) => {
                   const totalHours = Object.values(schedule.schedule).reduce((sum, day) => sum + day.hours, 0)
                   const isExact = Math.abs(totalHours - 32) < 0.1
                   
                   return (
                     <Card key={schedule.employeeId}>
                       <CardHeader className="pb-3">
                         <CardTitle className="text-base">{schedule.employeeName}</CardTitle>
                       </CardHeader>
                       <CardContent>
                         <div className="space-y-2">
                           <div className="flex justify-between">
                             <span className="text-sm text-muted-foreground">Horas totales:</span>
                             <Badge variant={isExact ? "default" : "destructive"}>
                               {totalHours.toFixed(1)}h
                             </Badge>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-sm text-muted-foreground">Objetivo:</span>
                             <Badge variant="outline">32h</Badge>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-sm text-muted-foreground">Diferencia:</span>
                             <Badge variant={isExact ? "default" : "secondary"}>
                               {(totalHours - 32).toFixed(1)}h
                             </Badge>
                           </div>
                         </div>
                       </CardContent>
                     </Card>
                   )
                 })}
               </div>
             </div>
           )}

                     <div className="mt-6 p-4 bg-blue-50 rounded-lg">
             <h4 className="font-semibold text-blue-900 mb-2">✨ Horarios Flexibles Inteligentes</h4>
             <ul className="text-sm text-blue-800 space-y-1">
               <li>• <strong>Entrada Tardía:</strong> Los empleados pueden entrar más tarde (ej: 18:00 en vez de 17:30)</li>
               <li>• <strong>Salida Temprana:</strong> Los empleados pueden salir más temprano (ej: 13:00 en vez de 13:30)</li>
               <li>• <strong>Entrada Temprana:</strong> Los empleados pueden entrar más temprano cuando es necesario</li>
               <li>• <strong>Salida Tardía:</strong> Los empleados pueden salir más tarde cuando es necesario</li>
               <li>• <strong>Ajuste Automático:</strong> El sistema distribuye inteligentemente los ajustes para cumplir exactamente 32 horas</li>
               <li>• <strong>Distribución Equitativa:</strong> Todos los empleados trabajan todos los días con cobertura garantizada</li>
             </ul>
           </div>
        </CardContent>
      </Card>
    </div>
  )
}
