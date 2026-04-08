"use client"

import { Card } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]

interface Appointment {
    appointmentId?: number;
    appointmentDate: string;
    status?: string;
}

interface DonationCalendarProps {
    appointments?: Appointment[];
}

export function DonationCalendar({ appointments = [] }: DonationCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date())

    // Отладка - проверяем, что приходит
    useEffect(() => {
        console.log("DonationCalendar received appointments:", appointments)
        console.log("Number of appointments:", appointments?.length)
        if (appointments && appointments.length > 0) {
            console.log("First appointment:", appointments[0])
        }
    }, [appointments])

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)

    // Adjust for Monday start (0 = Monday, 6 = Sunday)
    let startDay = firstDayOfMonth.getDay() - 1
    if (startDay < 0) startDay = 6

    const daysInMonth = lastDayOfMonth.getDate()

    const prevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1))
    }

    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1))
    }

    const hasScheduledAppointment = (day: number) => {
        const found = appointments.find((apt) => {
            if (!apt || !apt.appointmentDate) return false
            const aptDate = new Date(apt.appointmentDate)
            const isMatch = aptDate.getDate() === day &&
                aptDate.getMonth() === month &&
                aptDate.getFullYear() === year &&
                apt.status === 'SCHEDULED'

            if (isMatch) {
                console.log(`Found scheduled appointment on day ${day}:`, apt)
            }
            return isMatch
        })
        return found
    }

    const isToday = (day: number) => {
        const today = new Date()
        return (
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
        )
    }

    // Generate calendar days
    const days: (number | null)[] = []

    // Previous month days
    for (let i = startDay - 1; i >= 0; i--) {
        days.push(null)
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i)
    }

    // Get upcoming appointments (next 7 days)
    const getUpcomingAppointments = () => {
        const today = new Date()
        const nextWeek = new Date()
        nextWeek.setDate(today.getDate() + 7)

        const upcoming = appointments
            .filter(apt => {
                if (!apt || !apt.appointmentDate) return false
                const aptDate = new Date(apt.appointmentDate)
                return aptDate >= today && aptDate <= nextWeek && apt.status === 'SCHEDULED'
            })
            .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())
            .slice(0, 3)

        console.log("Upcoming appointments:", upcoming)
        return upcoming
    }

    const upcomingAppointments = getUpcomingAppointments()

    return (
        <Card className="p-4 rounded-2xl border border-border">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                    {MONTHS[month]} {year}
                </h3>
                <div className="flex gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={prevMonth}
                        className="h-7 w-7"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={nextMonth}
                        className="h-7 w-7"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Days header */}
            <div className="grid grid-cols-7 gap-0.5 mb-1">
                {DAYS.map((day) => (
                    <div
                        key={day}
                        className="text-center text-xs font-medium text-muted-foreground py-1"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-0.5">
                {days.map((day, index) => {
                    if (day === null) {
                        return (
                            <div
                                key={`empty-${index}`}
                                className="aspect-square"
                            />
                        )
                    }

                    const hasScheduled = hasScheduledAppointment(day)
                    const today = isToday(day)

                    return (
                        <div
                            key={day}
                            className={`
                                aspect-square flex items-center justify-center relative cursor-pointer
                                rounded-md transition-all text-sm font-medium
                                ${hasScheduled ? "ring-2 ring-primary/70 ring-offset-1 bg-primary/5" : ""}
                                ${today ? "bg-primary text-primary-foreground hover:bg-primary/90 font-semibold" : "hover:bg-muted"}
                            `}
                        >
                            {day}
                            {hasScheduled && !today && (
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary animate-pulse" />
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Debug info - временно, чтобы видеть что приходит */}
            {appointments.length === 0 && (
                <div className="mt-4 p-2 bg-yellow-100/10 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">No appointments data received</p>
                </div>
            )}

            {appointments.length > 0 && (
                <div className="mt-4 p-2 bg-primary/5 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                        Total appointments: {appointments.length} |
                        Scheduled: {appointments.filter(a => a.status === 'SCHEDULED').length}
                    </p>
                </div>
            )}

            {/* Upcoming appointments */}
            {upcomingAppointments.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border">
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">Upcoming Appointments</h4>
                    <div className="space-y-1.5">
                        {upcomingAppointments.map((apt, index) => {
                            const aptDate = new Date(apt.appointmentDate)
                            return (
                                <div
                                    key={index}
                                    className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg cursor-pointer hover:bg-primary/10 transition-colors"
                                    onClick={() => {
                                        setCurrentDate(aptDate)
                                    }}
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-foreground truncate">
                                            Blood Donation
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {aptDate.toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </Card>
    )
}