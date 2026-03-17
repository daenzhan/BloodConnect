"use client"

import { Card } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]

// Sample appointments
const appointments = [
    { date: new Date(2026, 2, 15), title: "Blood Donation", type: "donation" },
    { date: new Date(2026, 2, 22), title: "Health Check", type: "checkup" },
]

export function DonationCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date())

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)

    // Adjust for Monday start (0 = Monday, 6 = Sunday)
    let startDay = firstDayOfMonth.getDay() - 1
    if (startDay < 0) startDay = 6

    const daysInMonth = lastDayOfMonth.getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const prevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1))
    }

    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1))
    }

    const hasAppointment = (day: number) => {
        return appointments.find(
            (apt) =>
                apt.date.getDate() === day &&
                apt.date.getMonth() === month &&
                apt.date.getFullYear() === year
        )
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

                    const appointment = hasAppointment(day)
                    const today = isToday(day)

                    return (
                        <div
                            key={day}
                            className={`
                aspect-square flex items-center justify-center relative cursor-pointer
                rounded-md transition-colors hover:bg-muted text-sm
                ${today ? "bg-primary text-primary-foreground hover:bg-primary/90 font-semibold" : ""}
              `}
                        >
                            {day}
                            {appointment && (
                                <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${
                                    appointment.type === "donation" ? "bg-primary" : "bg-chart-2"
                                } ${today ? "bg-white" : ""}`} />
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Upcoming appointments */}
            {appointments.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border">
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">Upcoming</h4>
                    <div className="space-y-1.5">
                        {appointments.map((apt, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg"
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${
                                    apt.type === "donation" ? "bg-primary" : "bg-chart-2"
                                }`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-foreground truncate">{apt.title}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                        {apt.date.toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Card>
    )
}
