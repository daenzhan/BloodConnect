"use client"

import { Card } from "@/components/ui/card"
import { FileText, ClipboardList, MapPin, User } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

const actions = [
    {
        icon: FileText,
        title: "Create Request",
        description: "Submit new blood request",
        href: "/dashboard/for-medcenter/create-request",
    },
    {
        icon: ClipboardList,
        title: "My Requests",
        description: "View all your requests",
        href: "/dashboard/for-medcenter/my-requests",
    },
    {
        icon: MapPin,
        title: "Blood Centers",
        description: "Find donation centers",
        href: "/dashboard/for-medcenter/blood-centers",
    },
    {
        icon: User,
        title: "Profile",
        description: "Manage your profile",
        href: "/dashboard/for-medcenter/profile",
    },
]

export function QuickActions() {
    const searchParams = useSearchParams()
    const medCenterId = searchParams.get('id')

    const getHrefWithId = (href: string) => {
        if (medCenterId) {
            return `${href}?id=${medCenterId}`
        }
        return href
    }

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {actions.map((action) => {
                const Icon = action.icon
                const hrefWithId = getHrefWithId(action.href)

                return (
                    <Link key={action.title} href={hrefWithId}>
                        <Card className="p-4 rounded-xl border border-border hover:shadow-md transition-all cursor-pointer group">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform group-hover:bg-primary/20">
                                <Icon className="w-6 h-6 text-primary" />
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