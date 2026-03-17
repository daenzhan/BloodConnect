import { Card } from "@/components/ui/card"
import { MapPin, FileText, CalendarPlus, Droplet } from "lucide-react"
import Link from "next/link"

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
        href: "/dashboard/for-donor/analysis",
        external: false,
        color: "bg-chart-3/10 text-chart-3",
    },
    {
        icon: CalendarPlus,
        title: "Schedule",
        description: "Book appointment",
        href: "#",
        external: false,
        color: "bg-chart-4/10 text-chart-4",
    },
    {
        icon: Droplet,
        title: "Donation History",
        description: "View past donations",
        href: "#",
        external: false,
        color: "bg-primary/10 text-primary",
    },
]

export function QuickActions() {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
