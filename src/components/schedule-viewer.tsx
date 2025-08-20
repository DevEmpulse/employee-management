"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, FileText, AlertCircle } from "lucide-react";
import type { Schedule } from "@/app/page";
import { SucursalScheduleDisplay } from "@/components/sucursal-schedule-display";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import type { Sucursal } from "@/types/sucursal"; // Import Sucursal type

interface ScheduleViewerProps {
  schedules: Schedule[];
  sucursales: Sucursal[];
}

// Nueva constante para todos los días de la semana
const ALL_DAYS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

export function ScheduleViewer({ schedules, sucursales }: ScheduleViewerProps) {
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Verificación de seguridad para props
  if (!sucursales) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error: No se pudieron cargar los datos de las sucursales.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Función para obtener datos de sucursal
  const getSucursalData = (id: string) => {
    if (!sucursales || !Array.isArray(sucursales)) {
      return undefined;
    }
    return sucursales.find((s) => s.id === id);
  };

  // Ahora la función `generatePDF` también usará los días laborables correctos
  const generatePDF = () => {
    if (!sucursales || sucursales.length === 0) {
      alert("No hay sucursales disponibles para generar el PDF");
      return;
    }

    // Función para obtener datos de sucursal
    const getSucursalData = (id: string) => {
      return sucursales.find((s) => s.id === id);
    };

    const formatScheduleTime = (
      daySchedule:
        | { morning: boolean; afternoon: boolean; hours: number }
        | undefined,
      sucursal: Sucursal
    ) => {
      if (!daySchedule || daySchedule.hours === 0) return "Descanso";

      const parts = [];
      if (daySchedule.morning) {
        parts.push(
          `${sucursal.morningStart.replace(
            ":",
            ""
          )} a ${sucursal.morningEnd.replace(":", "")}`
        );
      }
      if (daySchedule.afternoon) {
        parts.push(
          `${sucursal.afternoonStart.replace(
            ":",
            ""
          )} a ${sucursal.afternoonEnd.replace(":", "")}`
        );
      }

      return parts.join(" y ");
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Horarios Semanales</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 10px; 
            font-size: 12px;
          }
          .header { 
            text-align: center; 
            margin-bottom: 20px; 
          }
          .schedule-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 30px;
          }
          .schedule-table th, .schedule-table td { 
            border: 2px solid #000; 
            padding: 8px; 
            text-align: center; 
            vertical-align: middle;
            font-weight: bold;
          }
          .date-header { 
            background-color: #4CAF50; 
            color: white; 
            font-weight: bold;
            font-size: 11px;
          }
          .employee-name { 
            background-color: #4CAF50; 
            color: white; 
            font-weight: bold;
            text-align: center;
            width: 100px;
          }
          .schedule-cell { 
            background-color: white; 
            min-height: 40px;
            font-size: 10px;
            font-weight: bold;
          }
          .rest-day { 
            background-color: #FFEB3B; 
            color: #000;
            font-weight: bold;
          }
          .sucursal-title {
            background-color: #2196F3;
            color: white;
            padding: 10px;
            font-size: 16px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0 10px 0;
          }
          .summary {
            text-align: center;
            margin-top: 10px;
            font-size: 10px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>HORARIOS SEMANALES</h1>
          <p>Generado el ${new Date().toLocaleDateString("es-ES")}</p>
          <p><strong>Todos los empleados trabajan 32 horas exactas</strong></p>
        </div>
        
        ${Object.entries(
          schedules.reduce((acc, schedule) => {
            if (!acc[schedule.sucursal]) {
              acc[schedule.sucursal] = [];
            }
            acc[schedule.sucursal].push(schedule);
            return acc;
          }, {} as Record<string, typeof schedules>)
        )
          .map(([sucursalId, sucursalSchedules]) => {
            const sucursalData = getSucursalData(sucursalId);
            if (!sucursalData) return "";

            const workingDays = ALL_DAYS.filter(
              (day) => day !== sucursalData.freeDay
            );

            // Calcular las fechas de la semana basadas en la fecha de inicio
            const getWeekDates = (startDateStr: string) => {
              const startDate = new Date(startDateStr);
              const dates = [];

              // Encontrar el día de inicio (Lunes o el día de inicio de semana de la sucursal)
              const dayOfWeek = startDate.getDay();
              const firstDayOfWeek = workingDays.includes("Lunes")
                ? "Lunes"
                : workingDays[0];
              const startDayIndex = ALL_DAYS.indexOf(firstDayOfWeek);
              const monday = new Date(startDate);
              monday.setDate(
                startDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
              );

              // Generar las fechas para los días laborables
              for (const day of workingDays) {
                const dayIndex = ALL_DAYS.indexOf(day);
                const date = new Date(monday);
                date.setDate(monday.getDate() + dayIndex);
                dates.push({
                  date: date.toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  }),
                  dayName: day,
                });
              }
              return dates;
            };

            const weekDates = getWeekDates(startDate);

            return `
            <div class="sucursal-title">${
              sucursalData?.name || sucursalId
            }</div>
            <table class="schedule-table">
              <thead>
                <tr>
                  <th class="employee-name">EMPLEADO</th>
                  ${weekDates
                    .map(
                      (dateInfo) => `
                    <th class="date-header">${
                      dateInfo.date
                    }<br>${dateInfo.dayName.toUpperCase()}</th>
                  `
                    )
                    .join("")}
                </tr>
              </thead>
              <tbody>
                ${sucursalSchedules
                  .map((schedule) => {
                    const totalHours = Object.values(schedule.schedule).reduce(
                      (sum, day) => sum + day.hours,
                      0
                    );
                    const isExact = Math.abs(totalHours - 32) < 0.1;

                    return `
                    <tr>
                      <td class="employee-name">${schedule.employeeName.toUpperCase()}</td>
                      ${workingDays
                        .map((dayName) => {
                          const daySchedule = schedule.schedule[dayName];
                          const scheduleText = formatScheduleTime(
                            daySchedule,
                            sucursalData
                          );

                          return `
                          <td class="schedule-cell">
                            ${scheduleText}
                          </td>
                        `;
                        })
                        .join("")}
                    </tr>
                    <tr>
                      <td colspan="${workingDays.length + 1}" class="summary">
                        ${schedule.employeeName}: Total ${totalHours.toFixed(
                      1
                    )} horas semanales
                        ${isExact ? "✓ (Exacto)" : "⚠️ (No exacto)"}
                      </td>
                    </tr>
                  `;
                  })
                  .join("")}
              </tbody>
            </table>
          `;
          })
          .join("")}
        
        <div style="margin-top: 30px; text-align: center; font-size: 10px; color: #666;">
          Generado el ${new Date().toLocaleDateString(
            "es-ES"
          )} - Sistema de Horarios Equitativos
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `horarios-semana-${new Date()
      .toLocaleDateString("es-ES")
      .replace(/\//g, "-")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (schedules.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No hay horarios generados. Ve a la pestaña Generar Horarios para
              crear los horarios automáticamente.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Agrupar horarios por sucursal
  const schedulesBySucursal = schedules.reduce((acc, schedule) => {
    if (!acc[schedule.sucursal]) {
      acc[schedule.sucursal] = [];
    }
    acc[schedule.sucursal].push(schedule);
    return acc;
  }, {} as Record<string, Schedule[]>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Horarios Generados - Sin Descansos
          </CardTitle>
          <CardDescription>
            Todos los empleados trabajan 6 días con exactamente 32 horas
            semanales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{schedules.length}</p>
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
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {Object.keys(schedulesBySucursal).length}
                </p>
                <p className="text-sm text-muted-foreground">Sucursales</p>
              </div>
            </div>
            <div className="flex gap-4 items-center">
              <div className="flex flex-col gap-2">
                <Label htmlFor="start-date" className="text-sm">
                  Fecha de inicio de semana:
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-40"
                />
              </div>
              <Button onClick={generatePDF} size="lg">
                <Download className="h-4 w-4 mr-2" />
                Descargar PDF
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {Object.entries(schedulesBySucursal).map(
              ([sucursalId, sucursalSchedules]) => {
                const sucursalData = getSucursalData(sucursalId);
                if (!sucursalData) return null;

                const workingDays = ALL_DAYS.filter(
                  (day) => day !== sucursalData.freeDay
                );

                return (
                  <div key={sucursalId} className="space-y-4">
                    <h3 className="text-xl font-semibold border-b pb-2">
                      Sucursal: {sucursalData.name}
                    </h3>

                    <div className="space-y-4">
                      {sucursalSchedules.map((schedule) => {
                        const totalAssignedHours = Object.values(
                          schedule.schedule
                        ).reduce((sum, day) => sum + day.hours, 0);
                        const workingDaysCount = Object.keys(
                          schedule.schedule
                        ).length;

                        return (
                          <Card key={schedule.employeeId}>
                            <CardHeader className="pb-3">
                              <div className="flex justify-between items-center">
                                <CardTitle className="text-lg">
                                  {schedule.employeeName}
                                </CardTitle>
                                <div className="flex gap-2">
                                  <Badge variant="outline">
                                    {workingDaysCount}/6 días
                                  </Badge>
                                  <Badge
                                    variant={
                                      Math.abs(totalAssignedHours - 32) < 0.1
                                        ? "default"
                                        : "destructive"
                                    }
                                  >
                                    {totalAssignedHours.toFixed(1)}h
                                  </Badge>
                                  {Math.abs(totalAssignedHours - 32) < 0.1 &&
                                    workingDaysCount === 6 && (
                                      <Badge
                                        variant="default"
                                        className="bg-green-500"
                                      >
                                        ✓ Perfecto
                                      </Badge>
                                    )}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="grid gap-2">
                                <div className="grid grid-cols-7 gap-2 text-sm font-medium text-center">
                                  <div>Día</div>
                                  <div>Mañana</div>
                                  <div>Tarde</div>
                                  <div>Horas</div>
                                  <div></div>
                                  <div></div>
                                  <div></div>
                                </div>
                                {workingDays.map((day) => {
                                  const daySchedule = schedule.schedule[day];
                                  return (
                                    <div
                                      key={day}
                                      className="grid grid-cols-7 gap-2 items-center py-2 border-t"
                                    >
                                      <div className="font-medium">{day}</div>
                                      <SucursalScheduleDisplay
                                        sucursal={sucursalData}
                                        daySchedule={daySchedule}
                                        day={day}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
