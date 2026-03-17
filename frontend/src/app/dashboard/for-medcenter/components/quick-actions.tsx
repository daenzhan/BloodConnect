import { Card } from "@/components/ui/card"
import { FileText, ClipboardList, MapPin, User } from "lucide-react"
import Link from "next/link"

const actions = [
    {
        icon: FileText,
        title: "Create Request",
        description: "Submit new blood request",
        href: "/dashboard/for-medcenter/create-request",
        color: "bg-chart-2/10 text-chart-2",
    },
    {
        icon: ClipboardList,
        title: "My Requests",
        description: "View all your requests",
        href: "/dashboard/for-medcenter/my-requests",
        color: "bg-chart-3/10 text-chart-3",
    },
    {
        icon: MapPin,
        title: "Blood Centers",
        description: "Find donation centers",
        href: "/dashboard/for-medcenter/blood-centers",
        color: "bg-chart-4/10 text-chart-4",
    },
    {
        icon: User,
        title: "Profile",
        description: "Manage your profile",
        href: "/dashboard/for-medcenter/profile",
        color: "bg-primary/10 text-primary",
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
