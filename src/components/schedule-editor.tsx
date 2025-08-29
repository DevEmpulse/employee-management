"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Edit3, Save, X, Clock, Calendar, Building2 } from "lucide-react"
import type { Schedule, Sucursal, DaySchedule, Employee } from "@/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
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

// Helper para convertir fecha de input a Date
const fromInput = (s: string) => { 
  const [y,m,d] = s.split("-").map(Number); 
  return new Date(y, (m??1)-1, d??1) 
}

// ==== helpers fecha SIN UTC (local) + compat UTC ====
const isoLocal = (d: Date) => {
  const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,"0"); const da = String(d.getDate()).padStart(2,"0")
  return `${y}-${m}-${da}`
}
const isoUTC = (d: Date) => d.toISOString().split("T")[0]

interface ScheduleEditorProps {
  schedules: Schedule[]
  setSchedules: (schedules: Schedule[]) => void
  sucursales: Sucursal[]
  employees: Employee[]
  selectedDate?: string
}

type EditingSlot = {
  date: string
  sucursalId: string
  employeeId: string
  shift: "morning" | "afternoon"
  currentStart: string
  currentEnd: string
}

export function ScheduleEditor({ schedules, setSchedules, sucursales, employees, selectedDate }: ScheduleEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editingSlot, setEditingSlot] = useState<EditingSlot | null>(null)
  const [newStartTime, setNewStartTime] = useState<string>("")
  const [newEndTime, setNewEndTime] = useState<string>("")
  const [selectedSucursal, setSelectedSucursal] = useState<string>("")



     const getSucursal = (id: string) => sucursales.find(s => s.id === id)
   const getEmployee = (id: string) => employees.find(e => e.id === id)

   // Lookup robusto (LOCAL -> UTC) - igual que en el viewer
   const getBlock = (s: Schedule, isoKey: string, isoKeyUTC: string) =>
     (s.schedule as Record<string, DaySchedule | undefined>)[isoKey] ??
     (s.schedule as Record<string, DaySchedule | undefined>)[isoKeyUTC]

  // Helper para formatear horarios
  const formatTime = (time: string) => {
    const [h, m] = time.split(":")
    return `${h}:${m}`
  }

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

  const handleEditSlot = (slot: EditingSlot) => {
    setEditingSlot(slot)
    // Usar los horarios actuales (personalizados o por defecto)
    setNewStartTime(slot.currentStart)
    setNewEndTime(slot.currentEnd)
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    if (!editingSlot || !newStartTime || !newEndTime) {
      toast.error("Por favor completa todos los campos")
      return
    }

    // Validar que la hora de inicio sea menor que la de fin
    if (newStartTime >= newEndTime) {
      toast.error("La hora de inicio debe ser menor que la hora de fin")
      return
    }

         const { date, employeeId, shift } = editingSlot
     const employee = getEmployee(employeeId)
     
     if (!employee) {
       toast.error("Empleado no encontrado")
       return
     }

     if (!selectedSucursalData) {
       toast.error("Sucursal no encontrada")
       return
     }

     // Obtener el horario actual
     const currentSchedule = schedules.find(s => s.employeeId === employeeId)
     if (!currentSchedule) {
       toast.error("Error al obtener horario")
       return
     }

    // Crear copias de los horarios para modificar
    const newSchedules = [...schedules]
    const employeeSchedule = newSchedules.find(s => s.employeeId === employeeId)!

         // Asegurar que existe el día en el horario usando la misma lógica de fechas
     const dateObj = new Date(date)
     const isoKey = isoLocal(dateObj)
     const isoKeyUTC = isoUTC(dateObj)
     
     if (!employeeSchedule.schedule[isoKey]) {
       employeeSchedule.schedule[isoKey] = {
         morning: false,
         afternoon: false,
         hours: 0
       }
     }

                  // Actualizar el turno específico
     if (shift === "morning") {
       employeeSchedule.schedule[isoKey].morning = true
       // Solo guardar horarios personalizados si son diferentes a los por defecto
       if (newStartTime !== selectedSucursalData.morningStart || newEndTime !== selectedSucursalData.morningEnd) {
         employeeSchedule.schedule[isoKey].morningStart = newStartTime
         employeeSchedule.schedule[isoKey].morningEnd = newEndTime
       } else {
         // Si son iguales a los por defecto, eliminar los horarios personalizados
         delete employeeSchedule.schedule[isoKey].morningStart
         delete employeeSchedule.schedule[isoKey].morningEnd
       }
     } else {
       employeeSchedule.schedule[isoKey].afternoon = true
       // Solo guardar horarios personalizados si son diferentes a los por defecto
       if (newStartTime !== selectedSucursalData.afternoonStart || newEndTime !== selectedSucursalData.afternoonEnd) {
         employeeSchedule.schedule[isoKey].afternoonStart = newStartTime
         employeeSchedule.schedule[isoKey].afternoonEnd = newEndTime
       } else {
         // Si son iguales a los por defecto, eliminar los horarios personalizados
         delete employeeSchedule.schedule[isoKey].afternoonStart
         delete employeeSchedule.schedule[isoKey].afternoonEnd
       }
     }

     // Recalcular horas totales del día
     const schedule = employeeSchedule.schedule[isoKey]
    let totalHours = 0
    
    if (schedule.morning) {
      const startTime = schedule.morningStart || selectedSucursalData.morningStart
      const endTime = schedule.morningEnd || selectedSucursalData.morningEnd
      const [h1, m1] = startTime.split(":").map(Number)
      const [h2, m2] = endTime.split(":").map(Number)
      totalHours += (h2 * 60 + m2 - h1 * 60 - m1) / 60
    }
    
    if (schedule.afternoon) {
      const startTime = schedule.afternoonStart || selectedSucursalData.afternoonStart
      const endTime = schedule.afternoonEnd || selectedSucursalData.afternoonEnd
      const [h1, m1] = startTime.split(":").map(Number)
      const [h2, m2] = endTime.split(":").map(Number)
      totalHours += (h2 * 60 + m2 - h1 * 60 - m1) / 60
    }
    
    schedule.hours = Number(totalHours.toFixed(2))

    setSchedules(newSchedules)
    setIsEditing(false)
    setEditingSlot(null)
    setNewStartTime("")
    setNewEndTime("")
    
    
    toast.success(`Horario ${shift === "morning" ? "mañana" : "tarde"} de ${employee.name} actualizado a ${formatTime(newStartTime)} - ${formatTime(newEndTime)}`)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditingSlot(null)
    setNewStartTime("")
    setNewEndTime("")
  }

     // Agrupar horarios por sucursal
   const schedulesBySucursal = schedules.reduce((acc, s) => {
     (acc[s.sucursal] ||= []).push(s)
     return acc
   }, {} as Record<string, Schedule[]>)

   

   // Obtener sucursales que tienen horarios
   const sucursalesWithSchedules = sucursales.filter(suc => schedulesBySucursal[suc.id])

  if (schedules.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <Calendar className="h-4 w-4" />
            <AlertDescription>
              No hay horarios generados para editar. Genera horarios desde la pestaña &quot;Generar Horarios&quot; para poder editarlos aquí.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Si no hay sucursal seleccionada, seleccionar la primera por defecto
  if (!selectedSucursal && sucursalesWithSchedules.length > 0) {
    setSelectedSucursal(sucursalesWithSchedules[0].id)
  }

     const selectedSucursalData = getSucursal(selectedSucursal)
   const selectedSucursalSchedules = selectedSucursal ? schedulesBySucursal[selectedSucursal] || [] : []
   


   

  return (
    <div className="space-y-3 md:space-y-6">
      <Card className="shadow-sm">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex items-center gap-2 text-base md:text-xl">
            <Edit3 className="h-4 w-4 md:h-5 md:w-5" />
            Editor de Horarios
          </CardTitle>
          <CardDescription className="text-xs md:text-base">
            Selecciona una sucursal y modifica las horas de inicio y fin de cada turno.
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
                      ? "bg-white text-gray-900 shadow-sm ring-2 ring-purple-500/20" 
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

          {/* Contenido de la sucursal seleccionada */}
          {selectedSucursalData && selectedSucursalSchedules.length > 0 && (
            <div className="space-y-3 md:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                <div>
                  <h3 className="text-base md:text-xl font-semibold text-gray-900">
                    {selectedSucursalData.name}
                  </h3>
                  <p className="text-xs md:text-sm text-purple-600 font-medium">
                    Día libre: {selectedSucursalData.dayOff}
                  </p>
                </div>
                <Badge variant="secondary" className="w-fit bg-purple-100 text-purple-800 border-purple-200">
                  {selectedSucursalSchedules.length} empleados
                </Badge>
              </div>

                             {/* Obtener todas las fechas del mes */}
               {(() => {
                 // Obtener todas las fechas del mes desde la fecha seleccionada
                 const start = fromInput(selectedDate || new Date().toISOString().split('T')[0])
                 const first = new Date(start.getFullYear(), start.getMonth(), 1)
                 const last = new Date(start.getFullYear(), start.getMonth() + 1, 0)
                 
                 const allDates: string[] = []
                 for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
                   const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
                   allDates.push(isoDate)
                 }
                 
                 const sortedDates = allDates.sort()

                                                                   return (
                    <div className="grid gap-3 md:gap-4">
                {sortedDates.map(date => {
                  const dateObj = new Date(date)
                  const dayName = DAYS[dateObj.getDay() === 0 ? 6 : dateObj.getDay() - 1]
                  const isDayOff = dateObj.getDay() === DAY_TO_DOW[selectedSucursalData.dayOff.toLowerCase()]

                  if (isDayOff) {
                    return (
                      <Card key={date} className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 shadow-sm">
                        <CardContent className="pt-4">
                          <div className="text-center text-yellow-800 font-medium text-sm md:text-base">
                            <span className="hidden sm:inline">{dateObj.toLocaleDateString("es-AR")} - {dayName} - Día Libre</span>
                            <span className="sm:hidden">{dateObj.toLocaleDateString("es-AR")} - {dayName.substring(0, 3)} - Libre</span>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  }

                  return (
                    <Card key={date} className="shadow-sm hover:shadow-md transition-shadow duration-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base md:text-lg text-gray-900">
                          <span className="hidden sm:inline">{dateObj.toLocaleDateString("es-AR")} - {dayName}</span>
                          <span className="sm:hidden">{dateObj.toLocaleDateString("es-AR")} - {dayName.substring(0, 3)}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {/* Turno Mañana */}
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm text-muted-foreground">Turno Mañana</h4>
                            <div className="space-y-2">
                              {selectedSucursalSchedules.map(schedule => {
                                const dateObj = new Date(date)
                                const daySchedule = getBlock(schedule, isoLocal(dateObj), isoUTC(dateObj))
                                if (!daySchedule?.morning) return null

                                const employee = getEmployee(schedule.employeeId)
                                if (!employee) return null

                                const currentStart = daySchedule.morningStart || selectedSucursalData.morningStart
                                const currentEnd = daySchedule.morningEnd || selectedSucursalData.morningEnd

                                const isCurrentlyEditing = editingSlot?.date === date && 
                                  editingSlot?.sucursalId === selectedSucursal && 
                                  editingSlot?.employeeId === schedule.employeeId && 
                                  editingSlot?.shift === "morning"

                                                                 return (
                                   <div key={`${schedule.employeeId}-morning`} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all duration-200">
                                     <div className="flex-1 min-w-0">
                                       <div className="font-medium text-sm md:text-base truncate text-gray-900">{employee.name}</div>
                                       <div className="text-xs md:text-sm text-blue-600 font-medium">
                                         <span className="hidden sm:inline">{formatShift(daySchedule, selectedSucursalData, "morning")}</span>
                                         <span className="sm:hidden">{formatShift(daySchedule, selectedSucursalData, "morning").replace('-', '→')}</span>
                                       </div>
                                     </div>
                                     <Button
                                       size="sm"
                                       variant="outline"
                                       onClick={() => handleEditSlot({
                                         date,
                                         sucursalId: selectedSucursal,
                                         employeeId: schedule.employeeId,
                                         shift: "morning",
                                         currentStart,
                                         currentEnd
                                       })}
                                       disabled={isEditing && !isCurrentlyEditing}
                                       className="ml-2 flex-shrink-0 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300"
                                     >
                                       <Edit3 className="h-3 w-3 md:h-4 md:w-4" />
                                     </Button>
                                   </div>
                                 )
                              })}
                            </div>
                          </div>

                          {/* Turno Tarde */}
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm text-muted-foreground">Turno Tarde</h4>
                            <div className="space-y-2">
                              {selectedSucursalSchedules.map(schedule => {
                                const dateObj = new Date(date)
                                const daySchedule = getBlock(schedule, isoLocal(dateObj), isoUTC(dateObj))
                                if (!daySchedule?.afternoon) return null

                                const employee = getEmployee(schedule.employeeId)
                                if (!employee) return null

                                const currentStart = daySchedule.afternoonStart || selectedSucursalData.afternoonStart
                                const currentEnd = daySchedule.afternoonEnd || selectedSucursalData.afternoonEnd

                                const isCurrentlyEditing = editingSlot?.date === date && 
                                  editingSlot?.sucursalId === selectedSucursal && 
                                  editingSlot?.employeeId === schedule.employeeId && 
                                  editingSlot?.shift === "afternoon"

                                                                 return (
                                   <div key={`${schedule.employeeId}-afternoon`} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-all duration-200">
                                     <div className="flex-1 min-w-0">
                                       <div className="font-medium text-sm md:text-base truncate text-gray-900">{employee.name}</div>
                                       <div className="text-xs md:text-sm text-green-600 font-medium">
                                         <span className="hidden sm:inline">{formatShift(daySchedule, selectedSucursalData, "afternoon")}</span>
                                         <span className="sm:hidden">{formatShift(daySchedule, selectedSucursalData, "afternoon").replace('-', '→')}</span>
                                       </div>
                                     </div>
                                     <Button
                                       size="sm"
                                       variant="outline"
                                       onClick={() => handleEditSlot({
                                         date,
                                         sucursalId: selectedSucursal,
                                         employeeId: schedule.employeeId,
                                         shift: "afternoon",
                                         currentStart,
                                         currentEnd
                                       })}
                                       disabled={isEditing && !isCurrentlyEditing}
                                       className="ml-2 flex-shrink-0 bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300"
                                     >
                                       <Edit3 className="h-3 w-3 md:h-4 md:w-4" />
                                     </Button>
                                   </div>
                                 )
                              })}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                                 })}
                   </div>
                 )
               })()}
             </div>
           )}

          {/* Modal de edición */}
          {isEditing && editingSlot && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-sm md:max-w-md shadow-2xl border-0">
                <CardHeader className="pb-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl text-gray-900">
                    <Clock className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
                    Editar Horario
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base text-purple-700">
                    Modifica las horas de inicio y fin del turno
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Empleado:</label>
                    <div className="p-3 bg-gray-50 rounded-lg text-sm border border-gray-200">
                      <span className="font-medium text-gray-900">{getEmployee(editingSlot.employeeId)?.name}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Turno:</label>
                    <div className="p-3 bg-gray-50 rounded-lg text-sm border border-gray-200">
                      <span className="font-medium text-gray-900">{editingSlot.shift === "morning" ? "Mañana" : "Tarde"}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-time" className="text-sm font-medium text-gray-700">Hora de inicio</Label>
                      <Input
                        id="start-time"
                        type="time"
                        value={newStartTime}
                        onChange={(e) => setNewStartTime(e.target.value)}
                        className="text-sm border-gray-200 focus:border-purple-500 focus:ring-purple-500/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-time" className="text-sm font-medium text-gray-700">Hora de fin</Label>
                      <Input
                        id="end-time"
                        type="time"
                        value={newEndTime}
                        onChange={(e) => setNewEndTime(e.target.value)}
                        className="text-sm border-gray-200 focus:border-purple-500 focus:ring-purple-500/20"
                      />
                    </div>
                  </div>

                                     <div className="flex flex-col sm:flex-row gap-3 pt-4">
                     <Button 
                       onClick={handleSaveEdit} 
                       className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                     >
                       <Save className="h-4 w-4 mr-2" />
                       Guardar
                     </Button>
                     <Button 
                       variant="outline" 
                       onClick={handleCancelEdit} 
                       className="flex-1 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                     >
                       <X className="h-4 w-4 mr-2" />
                       Cancelar
                     </Button>
                   </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
