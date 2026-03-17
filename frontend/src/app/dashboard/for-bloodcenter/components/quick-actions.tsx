import { Card } from "@/components/ui/card"
import { ClipboardList, Droplet, FileText, BarChart3 } from "lucide-react"
import Link from "next/link"

const actions = [
    {
        icon: ClipboardList,
        title: "Blood Requests",
        description: "View incoming requests",
        href: "/dashboard/for-bloodcenter/requests",
        color: "bg-chart-1/10 text-chart-1",
    },
    {
        icon: Droplet,
        title: "Blood Reserve",
        description: "Manage blood inventory",
        href: "/dashboard/for-bloodcenter/reserve",
        color: "bg-chart-2/10 text-chart-2",
    },
    {
        icon: FileText,
        title: "Donations",
        description: "Track all donations",
        href: "/dashboard/for-bloodcenter/donations",
        color: "bg-chart-3/10 text-chart-3",
    },
    {
        icon: BarChart3,
        title: "Statistics",
        description: "View analytics",
        href: "/dashboard/for-bloodcenter/statistics",
        color: "bg-chart-4/10 text-chart-4",
    },
]

export function QuickActions() {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {actions.map((action) => {
                const Icon = action.icon
                return (
                    <Link key={action.title} href={action.href}>
                        <Card className="p-4 rounded-xl border border-border hover:shadow-md transition-all cursor-pointer group">
                            <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                                <Icon className="w-6 h-6" />
                            </div>
                            <h3 className="font-semibold text-foreground mb-1">{action.title}</h3>
                            <p className="text-sm text-muted-foreground">{action.description}</p>
                        </Card>
                    </Link>
                )
            })}
        </div>
    )
}
