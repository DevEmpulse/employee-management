"use client"

import { Badge } from "@/components/ui/badge"
import type { Sucursal } from "@/types"

interface SucursalScheduleDisplayProps {
  sucursal: Sucursal
  daySchedule?: {
    morning: boolean
    afternoon: boolean
    hours: number
    morningStart?: string
    morningEnd?: string
    afternoonStart?: string
    afternoonEnd?: string
  }
  day: string
}

export function SucursalScheduleDisplay({ sucursal, daySchedule }: SucursalScheduleDisplayProps) {
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

  const getTimeRange = (kind: "morning" | "afternoon") => {
    if (kind === "morning") {
      const start = daySchedule?.morningStart || sucursal.morningStart
      const end = daySchedule?.morningEnd || sucursal.morningEnd
      return `${start}-${end}`
    } else {
      const start = daySchedule?.afternoonStart || sucursal.afternoonStart
      const end = daySchedule?.afternoonEnd || sucursal.afternoonEnd
      return `${start}-${end}`
    }
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
          <Badge variant="default" className="text-xs">
            {getTimeRange("morning")}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">-</span>
        )}
      </div>
      <div className="text-center">
        {daySchedule.afternoon ? (
          <Badge variant="default" className="text-xs">
            {getTimeRange("afternoon")}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">-</span>
        )}
      </div>
      <div className="text-center font-medium">{daySchedule.hours ?? 0}h</div>
    </>
  )
}
