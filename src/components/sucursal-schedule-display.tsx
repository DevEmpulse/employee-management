"use client"

import { Badge } from "@/components/ui/badge"

export interface Sucursal {
  id: string
  name: string
  morningStart: string
  morningEnd: string
  afternoonStart: string
  afternoonEnd: string
}

interface DaySchedule {
  morning: boolean
  afternoon: boolean
  hours: number
}

interface SucursalScheduleDisplayProps {
  sucursal: Sucursal
  daySchedule?: DaySchedule
  day: string
}

export function SucursalScheduleDisplay({ sucursal, daySchedule, day }: SucursalScheduleDisplayProps) {
  if (!daySchedule) {
    return (
      <>
        <div className="text-center">
          <span className="text-muted-foreground text-xs">No trabaja</span>
        </div>
        <div className="text-center">
          <span className="text-muted-foreground text-xs">No trabaja</span>
        </div>
        <div className="text-center font-medium">0h</div>
      </>
    )
  }

  return (
    <>
      <div className="text-center">
        {daySchedule.morning ? (
          <Badge variant="default" className="text-xs">
            {sucursal.morningStart}-{sucursal.morningEnd}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">No trabaja</span>
        )}
      </div>
      <div className="text-center">
        {daySchedule.afternoon ? (
          <Badge variant="default" className="text-xs">
            {sucursal.afternoonStart}-{sucursal.afternoonEnd}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">No trabaja</span>
        )}
      </div>
      <div className="text-center font-medium">{daySchedule.hours}h</div>
    </>
  )
}
