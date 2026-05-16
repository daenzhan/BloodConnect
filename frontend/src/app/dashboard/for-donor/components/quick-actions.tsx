"use client"

import { Card } from "@/components/ui/card"
import { MapPin, FileText, CalendarPlus, Droplet, Calendar } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export function QuickActions() {
    const [userId, setUserId] = useState<string>("")

    useEffect(() => {
        // Получаем userId из localStorage или URL
        const storedId = localStorage.getItem('userId')
        if (storedId) {
            setUserId(storedId)
        } else {
            const urlParams = new URLSearchParams(window.location.search)
            const id = urlParams.get('userId') || urlParams.get('id')
            if (id) {
                setUserId(id)
                localStorage.setItem('userId', id)
            } else {
                setUserId("2")
            }
        }
    }, [])

    const actions = [
        {
            icon: MapPin,
            title: "Find Centers",
            description: "Locate donation centers",
            href: "http://localhost:8080/map",
            external: true,
            color: "bg-chart-2/10 text-chart-2",
        },
        {
            icon: FileText,
            title: "Analysis Results",
            description: "View your test results",
            href: `/dashboard/for-donor/analysis?userId=${userId}`,
            external: false,
            color: "bg-chart-3/10 text-chart-3",
        },
        {
            icon: Calendar,
            title: "My Appointments",
            description: "View and manage your appointments",
            href: `/dashboard/for-donor/appointments?userId=${userId}`,
            external: false,
            color: "bg-chart-4/10 text-chart-4",
        },
        {
            icon: CalendarPlus,
            title: "Schedule",
            description: "Book new appointment",
            href: `/dashboard/for-donor/book-donation?userId=${userId}`,
            external: false,
            color: "bg-primary/10 text-primary",
        },
        {
            icon: Droplet,
            title: "Donation History",
            description: "View past donations",
            href: `/dashboard/for-donor/donation-history?userId=${userId}`,
            external: false,
            color: "bg-chart-2/10 text-chart-2",
        },
    ]

    // Пока userId не загружен, показываем заглушку
    if (!userId) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <Card key={i} className="p-4 rounded-xl border border-border animate-pulse">
                        <div className="w-12 h-12 rounded-xl bg-muted mb-3"></div>
                        <div className="h-4 bg-muted rounded w-3/4 mb-1"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                    </Card>
                ))}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {actions.map((action) => {
                const Icon = action.icon
                const content = (
                    <Card
                        className="p-4 rounded-xl border border-border hover:shadow-md transition-all cursor-pointer group"
                    >
                        <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                            <Icon className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold text-foreground mb-1">{action.title}</h3>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                    </Card>
                )

                if (action.external) {
                    return (
                        <a
                            key={action.title}
                            href={action.href}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {content}
                        </a>
                    )
                }

                return (
                    <Link key={action.title} href={action.href}>
                        {content}
                    </Link>
                )
            })}
        </div>
    )
}