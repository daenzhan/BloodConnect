"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarPlus, MapPin, Clock } from "lucide-react"

export function ScheduleAppointment() {
    return (
        <Card className="p-4 rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-primary/10">
            <div className="flex items-center gap-2 mb-3">
                <CalendarPlus className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Book Donation</h3>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
                Schedule your next blood donation appointment at a nearby center.
            </p>

            <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>Multiple centers available</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Flexible time slots</span>
                </div>
            </div>

            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                Schedule Now
            </Button>
        </Card>
    )
}
