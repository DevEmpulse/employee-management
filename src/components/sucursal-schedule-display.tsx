"use client"

import { Badge } from "@/components/ui/badge"
import type { Sucursal } from "@/app/page"

interface SucursalScheduleDisplayProps {
  sucursal: Sucursal
  daySchedule?: {
    morning: boolean
    afternoon: boolean
    hours: number
    flexibleSchedule?: {
      morningDelay?: number
      afternoonDelay?: number
      earlyLeave?: number
    }
  }
  day: string
}

export function SucursalScheduleDisplay({ sucursal, daySchedule, day }: SucursalScheduleDisplayProps) {
  // Verificación de seguridad
  if (!sucursal) {
    return (
      <>
        <div className="text-center">
          <span className="text-muted-foreground text-xs">-</span>
        </div>
        <div className="text-center">
          <span className="text-muted-foreground text-xs">-</span>
        </div>
        <div className="text-center font-medium">0h</div>
      </>
    )
  }

  const getBadgeVariant = (delayMinutes?: number, earlyLeaveMinutes?: number) => {
    if (delayMinutes && delayMinutes !== 0) {
      if (delayMinutes > 0) {
        return "secondary" // Entrada tardía
      } else {
        return "outline" // Entrada temprana
      }
    } else if (earlyLeaveMinutes && earlyLeaveMinutes !== 0) {
      if (earlyLeaveMinutes > 0) {
        return "destructive" // Salida temprana
      } else {
        return "default" // Salida tardía
      }
    }
    return "default"
  }

  const formatTimeRange = (start: string, end: string, delayMinutes?: number, earlyLeaveMinutes?: number) => {
    if (delayMinutes && delayMinutes !== 0) {
      if (delayMinutes > 0) {
        // Calcular nueva hora de inicio con retraso
        const [startHour, startMinute] = start.split(":").map(Number)
        const totalStartMinutes = startHour * 60 + startMinute + delayMinutes
        const newStartHour = Math.floor(totalStartMinutes / 60)
        const newStartMinute = totalStartMinutes % 60
        const newStart = `${newStartHour.toString().padStart(2, '0')}:${newStartMinute.toString().padStart(2, '0')}`
        
        return `${newStart}-${end}`
      } else {
        // Calcular nueva hora de inicio con entrada temprana
        const [startHour, startMinute] = start.split(":").map(Number)
        const totalStartMinutes = startHour * 60 + startMinute + delayMinutes // delayMinutes es negativo
        const newStartHour = Math.floor(totalStartMinutes / 60)
        const newStartMinute = totalStartMinutes % 60
        const newStart = `${newStartHour.toString().padStart(2, '0')}:${newStartMinute.toString().padStart(2, '0')}`
        
        return `${newStart}-${end}`
      }
    } else if (earlyLeaveMinutes && earlyLeaveMinutes !== 0) {
      if (earlyLeaveMinutes > 0) {
        // Calcular nueva hora de fin con salida temprana
        const [endHour, endMinute] = end.split(":").map(Number)
        const totalEndMinutes = endHour * 60 + endMinute - earlyLeaveMinutes
        const newEndHour = Math.floor(totalEndMinutes / 60)
        const newEndMinute = totalEndMinutes % 60
        const newEnd = `${newEndHour.toString().padStart(2, '0')}:${newEndMinute.toString().padStart(2, '0')}`
        
        return `${start}-${newEnd}`
      } else {
        // Calcular nueva hora de fin con salida tardía
        const [endHour, endMinute] = end.split(":").map(Number)
        const totalEndMinutes = endHour * 60 + endMinute - earlyLeaveMinutes // earlyLeaveMinutes es negativo
        const newEndHour = Math.floor(totalEndMinutes / 60)
        const newEndMinute = totalEndMinutes % 60
        const newEnd = `${newEndHour.toString().padStart(2, '0')}:${newEndMinute.toString().padStart(2, '0')}`
        
        return `${start}-${newEnd}`
      }
    }
    
    return `${start}-${end}`
  }

  if (!daySchedule) {
    return (
      <>
        <div className="text-center">
          <span className="text-muted-foreground text-xs">-</span>
        </div>
        <div className="text-center">
          <span className="text-muted-foreground text-xs">-</span>
        </div>
        <div className="text-center font-medium">0h</div>
      </>
    )
  }

  return (
    <>
             <div className="text-center">
         {daySchedule.morning ? (
           <Badge 
             variant={getBadgeVariant(daySchedule.flexibleSchedule?.morningDelay, daySchedule.flexibleSchedule?.earlyLeave)} 
             className="text-xs"
           >
             {formatTimeRange(
               sucursal.morningStart, 
               sucursal.morningEnd, 
               daySchedule.flexibleSchedule?.morningDelay,
               daySchedule.flexibleSchedule?.earlyLeave
             )}
           </Badge>
         ) : (
           <span className="text-muted-foreground text-xs">-</span>
         )}
       </div>
       <div className="text-center">
         {daySchedule.afternoon ? (
           <Badge 
             variant={getBadgeVariant(daySchedule.flexibleSchedule?.afternoonDelay, daySchedule.flexibleSchedule?.earlyLeave)} 
             className="text-xs"
           >
             {formatTimeRange(
               sucursal.afternoonStart, 
               sucursal.afternoonEnd, 
               daySchedule.flexibleSchedule?.afternoonDelay,
               daySchedule.flexibleSchedule?.earlyLeave
             )}
           </Badge>
         ) : (
           <span className="text-muted-foreground text-xs">-</span>
         )}
       </div>
      <div className="text-center font-medium">{daySchedule.hours}h</div>
    </>
  )
}
