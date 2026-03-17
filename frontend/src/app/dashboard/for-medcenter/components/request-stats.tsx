// components/request-stats.tsx
import { Card } from "@/components/ui/card"
import { FileText, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react"

interface RequestStatsProps {
    totalRequests: number
    approvedRequests: number
    pendingRequests: number
    rejectedRequests: number
    inProgressRequests: number
}

export function RequestStats({
                                 totalRequests,
                                 approvedRequests,
                                 pendingRequests,
                                 rejectedRequests,
                                 inProgressRequests
                             }: RequestStatsProps) {
    const statsItems = [
        {
            icon: FileText,
            label: "Total Requests",
            value: totalRequests,
            color: "text-primary",
            bg: "bg-primary/10",
        },
        {
            icon: CheckCircle,
            label: "Approved",
            value: approvedRequests,
            color: "text-green-600",
            bg: "bg-green-100",
        },
        {
            icon: Clock,
            label: "Pending",
            value: pendingRequests,
            color: "text-yellow-600",
            bg: "bg-yellow-100",
        },
        {
            icon: AlertCircle,
            label: "In Progress",
            value: inProgressRequests,
            color: "text-blue-600",
            bg: "bg-blue-100",
        },
        {
            icon: XCircle,
            label: "Rejected",
            value: rejectedRequests,
            color: "text-red-600",
            bg: "bg-red-100",
        },
    ]

    return (
        <Card className="p-6 rounded-2xl border border-border">
            <h3 className="font-semibold text-foreground mb-4">Request statistics</h3>
            <div className="grid grid-cols-2 gap-4">
                {statsItems.map((item) => {
                    const Icon = item.icon
                    return (
                        <div key={item.label} className="space-y-2">
                            <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center`}>
                                <Icon className={`w-5 h-5 ${item.color}`} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{item.value}</p>
                                <p className="text-sm text-muted-foreground">{item.label}</p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </Card>
    )
}